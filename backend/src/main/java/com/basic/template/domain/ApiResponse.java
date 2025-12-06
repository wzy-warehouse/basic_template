package com.basic.template.domain;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
public class ApiResponse<T> implements Serializable {
    @Serial
    private static final long serialVersionUID = -7318963194081396360L;

    private int code;
    private String message;
    private T data;

    public ApiResponse() {}

    public ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(int code, String message) {
        this.code = code;
        this.message = message;
    }

    // 成功响应 - 无数据
    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(200, "success");
    }

    // 成功响应 - 带数据
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, "success", data);
    }

    // 成功响应 - 自定义消息和数据
    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }

    // 错误响应 - 默认错误
    public static ApiResponse<Void> error() {
        return new ApiResponse<>(500, "error");
    }

    // 错误响应 - 自定义错误消息
    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(500, message);
    }

    // 错误响应 - 自定义状态码和错误消息
    public static ApiResponse<Void> error(Integer code, String message) {
        return new ApiResponse<>(code, message);
    }

    // 错误相应，自定义所有信息
    public static <T> ApiResponse<T> error(Integer code, String message, T data) {
        return new ApiResponse<>(code, message, data);
    }

}