package com.basic.template.utils.safety;

import org.bouncycastle.asn1.gm.GMNamedCurves;
import org.bouncycastle.asn1.x9.X9ECParameters;
import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.generators.ECKeyPairGenerator;
import org.bouncycastle.crypto.params.*;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.encoders.Hex;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.Security;
import java.util.HashMap;
import java.util.Map;

/**
 * SM2工具类（与前端gm-crypto兼容，加解密使用Hex编码）
 */
public class SM2Utils {

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private static final X9ECParameters x9ECParameters = GMNamedCurves.getByName("sm2p256v1");
    private static final ECDomainParameters ecDomainParameters = new ECDomainParameters(x9ECParameters.getCurve(), x9ECParameters.getG(), x9ECParameters.getN());

    /**
     * 生成SM2密钥对
     */
    public static Map<String, String> generateKeyPair() {
        try {
            ECKeyPairGenerator generator = new ECKeyPairGenerator();
            ECKeyGenerationParameters genParams = new ECKeyGenerationParameters(ecDomainParameters, new SecureRandom());
            generator.init(genParams);
            AsymmetricCipherKeyPair keyPair = generator.generateKeyPair();

            // 公钥：非压缩格式（64字节，包含0x04前缀共65字节）
            ECPublicKeyParameters publicKey = (ECPublicKeyParameters) keyPair.getPublic();
            String publicKeyHex = Hex.toHexString(publicKey.getQ().getEncoded(false));

            // 私钥：32字节Hex字符串
            ECPrivateKeyParameters privateKey = (ECPrivateKeyParameters) keyPair.getPrivate();
            String privateKeyHex = privateKey.getD().toString(16);
            // 补零到64位
            privateKeyHex = String.format("%64s", privateKeyHex).replace(' ', '0');

            Map<String, String> keyMap = new HashMap<>(2);
            keyMap.put("publicKey", publicKeyHex);
            keyMap.put("privateKey", privateKeyHex);
            return keyMap;
        } catch (Exception e) {
            throw new RuntimeException("生成SM2密钥对失败: " + e.getMessage(), e);
        }
    }

    /**
     * SM2公钥加密（返回Hex字符串）
     */
    public static String encrypt(String publicKeyHex, String plaintext) {
        try {
            // 解析带0x04前缀的公钥（65字节）
            byte[] publicKeyBytes = Hex.decode(publicKeyHex);

            ECPublicKeyParameters publicKey = new ECPublicKeyParameters(x9ECParameters.getCurve().decodePoint(publicKeyBytes), ecDomainParameters);

            // 初始化加密器（C1C3C2模式）
            org.bouncycastle.crypto.engines.SM2Engine engine = new org.bouncycastle.crypto.engines.SM2Engine((org.bouncycastle.crypto.engines.SM2Engine.Mode.C1C3C2));
            engine.init(true, new ParametersWithRandom(publicKey, new SecureRandom()));

            byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);
            byte[] encryptedBytes = engine.processBlock(plaintextBytes, 0, plaintextBytes.length);
            // 加密结果转为Hex字符串
            return Hex.toHexString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("SM2加密失败: " + e.getMessage(), e);
        }
    }

    /**
     * SM2私钥解密（接收Hex字符串密文）
     */
    public static String decrypt(String privateKeyHex, String ciphertextHex) {
        try {
            // 解析私钥
            byte[] privateKeyBytes = Hex.decode(privateKeyHex);
            ECPrivateKeyParameters privateKey = new ECPrivateKeyParameters(new BigInteger(1, privateKeyBytes), ecDomainParameters);

            // 解码Hex格式密文
            byte[] ciphertextBytes = Hex.decode(ciphertextHex);

            // 初始化解密器
            org.bouncycastle.crypto.engines.SM2Engine engine = new org.bouncycastle.crypto.engines.SM2Engine(org.bouncycastle.crypto.engines.SM2Engine.Mode.C1C3C2);
            engine.init(false, privateKey);

            byte[] decryptedBytes = engine.processBlock(ciphertextBytes, 0, ciphertextBytes.length);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("SM2解密失败: " + e.getMessage(), e);
        }
    }
}