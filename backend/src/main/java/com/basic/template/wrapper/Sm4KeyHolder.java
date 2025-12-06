package com.basic.template.wrapper;

/**
 * SM4密钥存储
 */
public class Sm4KeyHolder {
    // 线程本地存储SM4密钥（Hex格式，32位字符串）
    private static final ThreadLocal<String> SM4_KEY_HOLDER = new ThreadLocal<>();

    // 设置当前线程的SM4密钥
    public static void setSm4Key(String sm4Key) {
        SM4_KEY_HOLDER.set(sm4Key);
    }

    // 获取当前线程的SM4密钥
    public static String getSm4Key() {
        return SM4_KEY_HOLDER.get();
    }

    // 清除线程本地存储（避免内存泄漏）
    public static void clear() {
        SM4_KEY_HOLDER.remove();
    }
}
