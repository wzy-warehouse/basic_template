package com.basic.template.service.ex;

public class VerificationCodeErrorException extends ServiceException{
    public VerificationCodeErrorException() {
        super("验证码错误，请重新输入。");
    }
}
