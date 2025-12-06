package com.basic.template.service;

import com.basic.template.domain.user.LoginResponse;
import com.basic.template.entity.User;
import com.basic.template.vo.user.UserVo;

public interface UserService {

    User login(UserVo user);
}
