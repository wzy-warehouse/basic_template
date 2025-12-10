package com.basic.template.domain.user;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
public class GenerateCaptchaResponse implements Serializable {
    @Serial
    private static final long serialVersionUID = -7204291395460816538L;

    private String uuid;
    private String captcha;

    public GenerateCaptchaResponse(String uuid, String captcha) {
        this.uuid = uuid;
        this.captcha = captcha;
    }
}
