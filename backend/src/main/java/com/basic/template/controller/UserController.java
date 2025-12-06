package com.basic.template.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.basic.template.entity.User;
import com.basic.template.mapper.UserMapper;
import com.basic.template.service.UserService;
import com.basic.template.vo.user.ChangePasswordVo;
import com.basic.template.domain.user.CreateResponse;
import com.basic.template.domain.user.LoginResponse;
import com.basic.template.domain.ApiResponse;
import com.basic.template.vo.user.UserVo;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/user")

public class UserController extends BaseController{

    @Resource
    private UserService userService;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    @Resource
    private UserMapper userMapper;

    @Value("${login.remember.redis.key.prefix}")
    private String rememberKeyPrefix;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody @Valid UserVo user) {
        // 登录验证
        User loginUser = userService.login(user);

        // 判断记住密码
        if(user.getRemember()) {
            // token
            String token = StpUtil.getTokenValue();

            String redisKey = rememberKeyPrefix + token;
            redisTemplate.opsForValue().set(redisKey, loginUser.getId(), 7, TimeUnit.DAYS);
        }

        // 登录成功
        StpUtil.login(loginUser.getId());
        return ApiResponse.ok(new LoginResponse(
                StpUtil.getTokenValue(),
                loginUser.getId(),
                loginUser.getUsername()
        ));
    }

    @GetMapping("/check-login")
    public ApiResponse<Boolean> checkLogin() {
        return ApiResponse.ok(StpUtil.isLogin());
    }

    @GetMapping("/check-remember")
    public ApiResponse<Boolean> checkRemember(@RequestParam(value = "token", required = true) String token) {
        return ApiResponse.ok(redisTemplate.hasKey(rememberKeyPrefix + token));
    }

    @PostMapping("/user/auto-login")
    public ApiResponse<LoginResponse> autoLogin(@RequestParam(value = "token", required = true) String token) {
        // 获取存储的值
        Long id = (Long)redisTemplate.opsForValue().get(rememberKeyPrefix + token);

        // 根据id获取用户
        User user = userMapper.findById(id);

        // 登录成功
        StpUtil.login(user.getId());
        return ApiResponse.ok(new LoginResponse(
                StpUtil.getTokenValue(),
                user.getId(),
                user.getUsername()
        ));
    }

    @PostMapping("/change-pwd")
    public ApiResponse<Void> changePwd(@RequestBody ChangePasswordVo changePassword) {
        return ApiResponse.ok();
    }

    @PostMapping("/create")
    public ApiResponse<CreateResponse> create(@RequestBody UserVo user) {
        return ApiResponse.ok(new CreateResponse(2L));
    }
}
