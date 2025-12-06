package com.basic.template.service.ex;

public class IncorrectPasswordException extends ServiceException{
    public IncorrectPasswordException() {
        super("密码错误。");
    }
}
