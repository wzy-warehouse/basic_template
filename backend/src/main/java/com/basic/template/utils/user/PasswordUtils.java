package com.basic.template.utils.user;

import com.basic.template.utils.safety.SM3Utils;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

public class PasswordUtils {

    // 盐值长度（32字节=256位，安全性较高）
    private static final int SALT_LENGTH = 32;

    /**
     * 生成随机盐值（用于密码哈希增强）
     */
    public static byte[] generateSalt() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        secureRandom.nextBytes(salt);
        return salt;
    }

    /**
     * 加密密码（盐值+密码组合后用SM3哈希）
     * @param rawPassword 原始明文密码
     * @param salt 盐值（generateSalt()生成）
     * @return 加密后的哈希值（32字节）
     */
    public static byte[] encryptPassword(String rawPassword, String salt) {
        // 校验参数
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new IllegalArgumentException("明文密码不能为空");
        }
        if (salt == null) {
            throw new IllegalArgumentException("盐值不能能为空");
        }

        byte[] saltBytes = SM3Utils.fromHex(salt);
        if(saltBytes.length != SALT_LENGTH) {
            throw new IllegalArgumentException("盐值无效（必须是\" + SALT_LENGTH + \"字节）");
        }

        // 组合盐值和密码（盐值在前，密码在后，固定规则）
        byte[] passwordBytes = rawPassword.getBytes(StandardCharsets.UTF_8);
        byte[] input = new byte[saltBytes.length + passwordBytes.length];
        System.arraycopy(saltBytes, 0, input, 0, saltBytes.length);
        System.arraycopy(passwordBytes, 0, input, saltBytes.length, passwordBytes.length);

        // 调用SM3计算哈希
        return SM3Utils.hash(input);
    }

    /**
     * 验证密码是否匹配
     * @param inputPassword 输入的明文密码（如登录时用户输入）
     * @param salt 存储的盐值（从数据库获取）
     * @param storedHash 存储的密码哈希值（从数据库获取）
     * @return true-匹配；false-不匹配
     */
    public static boolean verifyPassword(String inputPassword, String salt, String storedHash) {
        if (storedHash == null) {
            return false;
        }
        // 用相同盐值计算输入密码的哈希，与存储的哈希比对
        byte[] inputHash = encryptPassword(inputPassword, salt);

        return storedHash.equals(SM3Utils.toHex(inputHash));
    }

    public static void main(String[] args) {
        byte[] salt = generateSalt();
        byte[] password = encryptPassword("admin@123", SM3Utils.toHex(salt));
        System.out.println(SM3Utils.toHex(salt));
        System.out.println(SM3Utils.toHex(password));
    }
}
