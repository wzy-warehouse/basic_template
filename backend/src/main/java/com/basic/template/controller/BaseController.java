package com.basic.template.controller;

import com.basic.template.domain.ApiResponse;
import com.basic.template.service.ex.ServiceException;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * 基础controller类，所有controller层对象必须继承这个类
 */
public class BaseController{

    // 用于统一处理应用层抛出的异常
    @ExceptionHandler(ServiceException.class)
    public ApiResponse<Void> handleServiceException(Throwable e) {
        return ApiResponse.error(e.getMessage());
    }

    // 用于统一处理其余抛出的异常
    @ExceptionHandler(RuntimeException.class)
    public ApiResponse<Void> handleException(Throwable e) {
        return ApiResponse.error(e.getMessage());
    }
}