package com.basic.template.service.ex;

public class UserNotExistException extends ServiceException{
    public UserNotExistException() {
        super("用户名不存在。");
    }
}
