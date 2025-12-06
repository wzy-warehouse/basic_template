package com.basic.template.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 添加Sa-Token拦截器，校验所有请求
        registry.addInterceptor(new SaInterceptor(handle -> {
            // 登录校验：其他都需要登录
            StpUtil.checkLogin();
        }))
        .addPathPatterns("/**") // 拦截所有接口
        .excludePathPatterns(
                // 匿名访问路径
                "/user/login",
                "/user/check-login",
                "/user/check-remember",
                "/user/auto-login",
                "/crypto/sm2/public-key"
        );
    }
}