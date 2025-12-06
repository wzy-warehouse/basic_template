package com.basic.template.utils.safety;

import org.bouncycastle.crypto.digests.SM3Digest;
import org.bouncycastle.util.encoders.Hex;

/**
 * SM3算法工具类（纯算法实现，不依赖业务逻辑）
 * 仅负责：计算字节数组的SM3哈希值、字节数组与十六进制转换
 */
public class SM3Utils {
    /**
     * 计算字节数组的SM3哈希值
     * @param input 输入字节数组（可任意数据，如盐值+密码的组合）
     * @return SM3哈希值（32字节）
     */
    public static byte[] hash(byte[] input) {
        if (input == null || input.length == 0) {
            throw new IllegalArgumentException("输入字节数组不能为空");
        }
        SM3Digest digest = new SM3Digest();
        digest.update(input, 0, input.length);
        byte[] hashBytes = new byte[digest.getDigestSize()];
        digest.doFinal(hashBytes, 0);
        return hashBytes;
    }

    /**
     * 字节数组转16进制字符串（用于哈希值可视化）
     */
    public static String toHex(byte[] bytes) {
        if (bytes == null) {
            return null;
        }
        return Hex.toHexString(bytes);
    }

    /**
     * 16进制字符串转字节数组（反向操作）
     */
    public static byte[] fromHex(String hexStr) {
        if (hexStr == null || hexStr.isEmpty()) {
            return null;
        }
        return Hex.decode(hexStr);
    }
}