package com.basic.template.vo.user;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
public class ChangePasswordVo implements Serializable {
    @Serial
    private static final long serialVersionUID = 7549223125539340653L;

    private String oldPwd;
    private String newPwd;
}
