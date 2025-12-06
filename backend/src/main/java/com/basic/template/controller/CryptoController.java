package com.basic.template.controller;

import com.basic.template.domain.ApiResponse;
import com.basic.template.utils.safety.SM2Utils;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/crypto")
public class CryptoController extends BaseController {

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${safety.sm2.global}")
    private String sm2KeyPairRedisKey;

    /**
     * 初始化SM2密钥对
     */
    @PostConstruct
    public void initSm2KeyPair() {
        Object sm2KeyPairObj = redisTemplate.opsForValue().get(sm2KeyPairRedisKey);
        if (sm2KeyPairObj == null) {
            Map<String, String> sm2KeyPair = SM2Utils.generateKeyPair();
            redisTemplate.opsForValue().set(sm2KeyPairRedisKey, sm2KeyPair);
            System.out.println("SM2密钥对已生成并存储到Redis");
        }
    }

    /**
     * 获取SM2公钥
     */
    @GetMapping("/sm2/public-key")
    @SuppressWarnings("unchecked")
    public ApiResponse<Map<String, String>> getSm2PublicKey() {
        Map<String, String> sm2KeyPair = (Map<String, String>) redisTemplate.opsForValue().get(sm2KeyPairRedisKey);
        if (sm2KeyPair == null) {
            throw new RuntimeException("SM2密钥对未初始化");
        }

        Map<String, String> result = new HashMap<>();
        result.put("publicKey", sm2KeyPair.get("publicKey"));
        return ApiResponse.ok(result);
    }
}