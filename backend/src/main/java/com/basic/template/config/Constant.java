package com.basic.template.config;

import java.util.List;

public class Constant {
    // 响应无需加密的路径
    public static String[] NO_ENCRYPT_PATHS = {
            "/crypto/sm2/public-key"
    };

    // 请求无需解密的路径
    public static String[] NO_DECRYPT_PATHS = {
            "/crypto/sm2/public-key"
    };
}