package com.basic.template.service.ex;

public class KeyDataMissingException extends ServiceException{
    public KeyDataMissingException() {
        super("缺少关键数据，请不要擅自更改数据。");
    }
}
