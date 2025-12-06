package com.basic.template.vo.user;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
public class UserVo implements Serializable {
    @Serial
    private static final long serialVersionUID = 8348804870131547000L;

    @NotEmpty(message = "用户名不能为空。")
    @Size(max = 50, min = 3, message = "用户名长度必须介于3-50之间")
    private String username;

    @NotEmpty(message = "密码不能为空。")
    @Size(max = 20, min = 6, message = "密码长度必须介于6-20之间")
    @Pattern(regexp = "^(?![0-9]+$)(?![A-Za-z]+$)(?![!@#$%^&*()_+;]+$)[\\dA-Za-z!@#$%^&*()_+;]+$",
    message = "密码格式不正确，密码需至少包含数字、字母、特殊字符(!@#$%^&*()_+;)中的两类")
    private String password;

    private Boolean remember;
}
