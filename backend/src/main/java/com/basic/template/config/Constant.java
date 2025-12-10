package com.basic.template.config;

public class Constant {
    // ========== 验证码核心配置 ==========
    public static final float CAPTCHA_RATIO = 3.0f; // 固定宽高比3:1
    public static final int MIN_WIDTH = 150; // 最小宽度
    public static final int MAX_WIDTH = 600; // 最大宽度
    public static final int MIN_HEIGHT = 50; // 最小高度
    public static final int MAX_HEIGHT = 200; // 最大高度
    // 字符源：数字+大小写字母（排除易混淆字符：0/O、1/I、6/G、8/B、9/q）
    public static final String CAPTCHA_CHAR_POOL = "2345789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
    public static final int CAPTCHA_LENGTH = 4; // 验证码位数
    public static final long CAPTCHA_EXPIRE = 5; // 有效期5分钟

    // 响应无需加密的路径
    public static String[] NO_ENCRYPT_PATHS = {
            "/crypto/sm2/public-key"
    };

    // 请求无需解密的路径
    public static String[] NO_DECRYPT_PATHS = {
            "/crypto/sm2/public-key"
    };


}