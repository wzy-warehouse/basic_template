package com.basic.template.wrapper;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import lombok.Setter;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 解密拦截器
 */
public class DecryptRequestWrapper extends HttpServletRequestWrapper {
    // 缓存解密后的请求体（用于POST等带Body的请求）
    private final byte[] decryptedBody;
    // 用于更新解密后的参数（GET场景）
    // 缓存解密后的参数（用于GET等带Query参数的请求）
    @Setter
    private Map<String, String[]> decryptedParams;

    public DecryptRequestWrapper(HttpServletRequest request, byte[] decryptedBody) {
        super(request);
        this.decryptedBody = decryptedBody;
        this.decryptedParams = new HashMap<>(request.getParameterMap());
    }

    // 重写输入流，返回解密后的Body
    @Override
    public ServletInputStream getInputStream() throws IOException {
        ByteArrayInputStream bis = new ByteArrayInputStream(decryptedBody);
        return new ServletInputStream() {
            @Override
            public boolean isFinished() {
                return bis.available() == 0;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener listener) {}

            @Override
            public int read() throws IOException {
                return bis.read();
            }
        };
    }

    // 重写参数获取方法，返回解密后的参数（用于GET）
    @Override
    public String getParameter(String name) {
        String[] values = decryptedParams.get(name);
        return values != null && values.length > 0 ? values[0] : null;
    }

    @Override
    public Map<String, String[]> getParameterMap() {
        return decryptedParams;
    }

}