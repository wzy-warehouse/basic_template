package com.basic.template.service.impl;

import com.basic.template.domain.user.LoginResponse;
import com.basic.template.entity.User;
import com.basic.template.mapper.UserMapper;
import com.basic.template.service.UserService;
import com.basic.template.service.ex.IncorrectPasswordException;
import com.basic.template.service.ex.UserNotExistException;
import com.basic.template.utils.user.PasswordUtils;
import com.basic.template.vo.user.UserVo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

@Service
public class IUserServiceImpl implements UserService {

    @Resource
    private UserMapper userMapper;

    @Override
    public User login(UserVo user) {
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
