package com.basic.template.service;

import com.basic.template.domain.user.GenerateCaptchaResponse;
import com.basic.template.entity.User;
import com.basic.template.vo.user.UserVo;

public interface UserService {

    GenerateCaptchaResponse generateCaptcha(int width);

    User login(UserVo user);
}
