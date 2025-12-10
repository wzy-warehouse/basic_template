package com.basic.template.service.impl;

import cn.hutool.captcha.ShearCaptcha;
import cn.hutool.captcha.generator.CodeGenerator;
import cn.hutool.captcha.generator.RandomGenerator;
import cn.hutool.core.codec.Base64;
import cn.hutool.core.util.RandomUtil;
import com.basic.template.config.Constant;
import com.basic.template.domain.user.GenerateCaptchaResponse;
import com.basic.template.entity.User;
import com.basic.template.mapper.UserMapper;
import com.basic.template.service.UserService;
import com.basic.template.service.ex.IncorrectPasswordException;
import com.basic.template.service.ex.KeyDataMissingException;
import com.basic.template.service.ex.UserNotExistException;
import com.basic.template.service.ex.VerificationCodeErrorException;
import com.basic.template.utils.user.PasswordUtils;
import com.basic.template.vo.user.UserVo;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class IUserServiceImpl implements UserService {

    @Resource
    private UserMapper userMapper;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;


    // Redis中验证码的key前缀
    @Value("${login.captcha.redis.key.prefix}")
    private String captchaRedisPrefix;


    @Override
    public GenerateCaptchaResponse generateCaptcha(int width) {

        // 生成UUID
        String uuid = UUID.randomUUID().toString();

        // 修正宽高：强制3:1比例，限制最小/最大尺寸
        width = Math.max(Constant.MIN_WIDTH, Math.min(width, Constant.MAX_WIDTH));
        int height = Math.round(width / Constant.CAPTCHA_RATIO); // 按比例计算高度
        height = Math.max(Constant.MIN_HEIGHT, Math.min(height, Constant.MAX_HEIGHT));

        // 生成自定义字符
        String captchaCode = RandomUtil.randomString(Constant.CAPTCHA_CHAR_POOL, Constant.CAPTCHA_LENGTH);

        // 创建扭曲验证码
        ShearCaptcha captcha = new ShearCaptcha(width, height, Constant.CAPTCHA_LENGTH, 8);

        // 绑定自定义CodeGenerator，强制使用我们生成的captchaCode
        CodeGenerator generator = new RandomGenerator(Constant.CAPTCHA_CHAR_POOL, Constant.CAPTCHA_LENGTH) {
            @Override
            public String generate() {
                return captchaCode;
            }
        };
        captcha.setGenerator(generator); // 将自定义生成器绑定到验证码对象

        // 配置验证码样式
        int fontSize = (int) (height * 0.6); // 字体占高度60%，更易扭曲
        captcha.setFont(new Font("Arial", Font.BOLD, fontSize)); // 加粗字体，扭曲更明显
        captcha.setBackground(new Color(RandomUtil.randomInt(230, 255),
                RandomUtil.randomInt(230, 255),
                RandomUtil.randomInt(230, 255))); // 浅色背景

        // 生成验证码图片
        captcha.createImage(captchaCode);

        // 存入Redis
        redisTemplate.opsForValue().set(
                captchaRedisPrefix + uuid,
                captchaCode,
                Constant.CAPTCHA_EXPIRE,
                TimeUnit.MINUTES
        );

        // 将图片转为Base64字符串返回
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            captcha.write(bos);
            return new GenerateCaptchaResponse(uuid, "data:image/png;base64," + Base64.encode(bos.toByteArray()));
        } catch (IOException e) {
            throw new RuntimeException("验证码生成失败", e);
        }
    }

    @Override
    public User login(UserVo user) {
        // 判断是否有验证码
        if(user.getIncludeCaptcha()) {
            if(user.getUuid() == null || user.getCaptcha() == null) {
                throw new KeyDataMissingException();
            }
            String captchaCode = redisTemplate.opsForValue().get(captchaRedisPrefix + user.getUuid()).toString();
            if(!user.getCaptcha().equalsIgnoreCase(captchaCode)) {
                throw new VerificationCodeErrorException();
            }
        }

        // 根据用户名获取用户信息
        User userInfo = userMapper.findByUsername(user.getUsername());

        // 判断用户是否存在
        if (userInfo == null || userInfo.getUsername() == null) {
            throw new UserNotExistException();
        }

        boolean verify = PasswordUtils.verifyPassword(user.getPassword(), userInfo.getSalt(), userInfo.getPassword());

        if (!verify) {
            throw new IncorrectPasswordException();
        }

        return userInfo;
    }
}
