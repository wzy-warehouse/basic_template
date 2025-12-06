package com.basic.template.wrapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.basic.template.config.Constant;
import com.basic.template.utils.safety.SM4Utils;
import jakarta.annotation.Resource;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 响应数据加密拦截器
 */
@ControllerAdvice
public class EncryptResponseAdvice implements ResponseBodyAdvice<Object> {

    @Resource
    private ObjectMapper objectMapper;

    /**
     * 判断是否需要加密：排除特定路径，其余全部加密
     */
    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        // 获取当前请求的URI
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return false; // 非Web请求场景，不加密
        }
        HttpServletRequest request = attributes.getRequest();
        String requestUri = request.getRequestURI();

        // 检查是否为无需加密的路径
        for (String path : Constant.NO_ENCRYPT_PATHS) {
            if (requestUri.contains(path)) {
                return false; // 排除路径，不加密
            }
        }

        // 其余路径均需要加密
        return true;
    }

    /**
     * 响应体加密逻辑（保持不变）
     */
    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {
        try {
            String sm4Key = Sm4KeyHolder.getSm4Key();
            if (sm4Key == null || sm4Key.length() != 32) {
                throw new RuntimeException("SM4密钥不存在或格式错误，无法加密响应");
            }

            String plaintext = objectMapper.writeValueAsString(body);
            String encryptedText = SM4Utils.encrypt(sm4Key, plaintext);
            return encryptedText;
        } catch (Exception e) {
            throw new RuntimeException("响应数据加密失败: " + e.getMessage(), e);
        } finally {
            Sm4KeyHolder.clear(); // 清除线程本地存储，避免内存泄漏
        }
    }
}