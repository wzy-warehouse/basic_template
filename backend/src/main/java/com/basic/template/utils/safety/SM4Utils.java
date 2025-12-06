package com.basic.template.utils.safety;

import org.bouncycastle.crypto.CipherParameters;
import org.bouncycastle.crypto.engines.SM4Engine;
import org.bouncycastle.crypto.paddings.PKCS7Padding;
import org.bouncycastle.crypto.paddings.PaddedBufferedBlockCipher;
import org.bouncycastle.crypto.params.KeyParameter;
import org.bouncycastle.util.encoders.Hex;

import java.nio.charset.StandardCharsets;

/**
 * SM4工具类（ECB模式，与前端兼容，加解密使用Hex编码）
 */
public class SM4Utils {

    /**
     * SM4加密（ECB模式，返回Hex字符串）
     */
    public static String encrypt(String keyHex, String plaintext) {
        try {
            // 解析密钥（16字节=32位Hex字符串）
            byte[] key = Hex.decode(keyHex);
            if (key.length != 16) {
                throw new IllegalArgumentException("SM4密钥必须是16字节（32位Hex字符串）");
            }

            // 初始化加密器（ECB模式 + PKCS7填充）
            PaddedBufferedBlockCipher cipher = new PaddedBufferedBlockCipher(
                    new SM4Engine(),
                    new PKCS7Padding()
            );
            CipherParameters params = new KeyParameter(key);
            cipher.init(true, params);

            // 处理明文
            byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);
            byte[] output = new byte[cipher.getOutputSize(plaintextBytes.length)];
            int length = cipher.processBytes(plaintextBytes, 0, plaintextBytes.length, output, 0);
            length += cipher.doFinal(output, length);

            // 加密结果转为Hex字符串
            return Hex.toHexString(output, 0, length);
        } catch (Exception e) {
            throw new RuntimeException("SM4加密失败: " + e.getMessage(), e);
        }
    }

    /**
     * SM4解密（ECB模式，接收Hex字符串密文）
     */
    public static String decrypt(String keyHex, String ciphertextHex) {
        try {
            // 解析密钥（16字节=32位Hex字符串）
            byte[] key = Hex.decode(keyHex);
            if (key.length != 16) {
                throw new IllegalArgumentException("SM4密钥必须是16字节（32位Hex字符串）");
            }

            // 解码Hex格式密文
            byte[] ciphertextBytes = Hex.decode(ciphertextHex);

            // 初始化解密器
            PaddedBufferedBlockCipher cipher = new PaddedBufferedBlockCipher(
                    new SM4Engine(),
                    new PKCS7Padding()
            );
            CipherParameters params = new KeyParameter(key);
            cipher.init(false, params);

            // 处理密文
            byte[] output = new byte[cipher.getOutputSize(ciphertextBytes.length)];
            int length = cipher.processBytes(ciphertextBytes, 0, ciphertextBytes.length, output, 0);
            length += cipher.doFinal(output, length);

            // 解密结果转为字符串
            return new String(output, 0, length, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("SM4解密失败: " + e.getMessage(), e);
        }
    }
}