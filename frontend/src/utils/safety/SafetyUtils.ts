import { $api } from '@/api/api'
import { useCryptStore } from '@/stores/useCryptStore'
import { SM2, SM4 } from 'gm-crypto'

// 与后端SM2Utils对应的模式配置
const SM2_MODE = SM2.constants.C1C3C2
const SM2_INPUT_ENCODING = 'utf8'
const SM2_OUTPUT_ENCODING = 'hex'

// 与后端SM4Utils对应的模式配置（ECB模式）
const SM4_MODE = SM4.constants.ECB
const SM4_INPUT_ENCODING = 'utf8'
const SM4_OUTPUT_ENCODING = 'hex'

export const SafetyUtils = {
  /**
   * 获取SM2公钥
   */
  getSm2PublicKey: async (): Promise<string> => {
    const cryptStore = useCryptStore()
    if (cryptStore.sm2PublicKey) return cryptStore.sm2PublicKey

    try {
      const res = await $api.crypto.getSm2PublicKey()
      const publicKey = res.data.publicKey
      cryptStore.sm2PublicKey = publicKey
      return publicKey
    } catch (error) {
      console.error('获取SM2公钥失败:', error)
      throw new Error('获取加密公钥失败')
    }
  },

  /**
   * 生成随机SM4密钥（16字节=32位十六进制字符串）
   */
  generateSm4Key: (): string => {
    return SafetyUtils._generateRandomHex(16)
  },

  /**
   * SM2非对称加密（公钥加密）
   */
  sm2Encrypt: async (data: object | string, publicKey?: string): Promise<string> => {
    try {
      const targetPublicKey = publicKey || (await SafetyUtils.getSm2PublicKey())
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data)
      return (
        '04' +
        SM2.encrypt(plaintext, targetPublicKey, {
          mode: SM2_MODE,
          inputEncoding: SM2_INPUT_ENCODING,
          outputEncoding: SM2_OUTPUT_ENCODING,
        })
      )
    } catch (error) {
      console.error('SM2加密失败:', error)
      throw new Error('数据加密失败')
    }
  },

  /**
   * SM2非对称解密（私钥解密）
   */
  sm2Decrypt: async (data: string, privateKey: string): Promise<string> => {
    try {
      return SM2.decrypt(data.substring(2), privateKey, {
        inputEncoding: SM2_OUTPUT_ENCODING,
        outputEncoding: SM2_INPUT_ENCODING,
        mode: SM2.constants.C1C3C2,
      })
    } catch (error) {
      console.error('SM2加密失败:', error)
      throw new Error('数据加密失败')
    }
  },

  /**
   * SM4对称加密（ECB模式）
   */
  sm4Encrypt: (key: string, data: object | string): string => {
    try {
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data)
      return SM4.encrypt(plaintext, key, {
        mode: SM4_MODE,
        inputEncoding: SM4_INPUT_ENCODING,
        outputEncoding: SM4_OUTPUT_ENCODING,
      })
    } catch (error) {
      console.error('SM4加密失败:', error)
      throw new Error('数据加密失败')
    }
  },

  /**
   * SM4对称解密（ECB模式）
   */
  sm4Decrypt: (key: string, encryptedData: string): object | string => {
    try {
      const plaintext = SM4.decrypt(encryptedData, key, {
        mode: SM4_MODE,
        inputEncoding: SM4_OUTPUT_ENCODING,
        outputEncoding: SM4_INPUT_ENCODING,
      })

      // 尝试解析JSON，兼容对象和字符串
      try {
        return JSON.parse(plaintext)
      } catch {
        return plaintext
      }
    } catch (error) {
      console.error('SM4解密失败:', error)
      throw new Error('数据解密失败')
    }
  },

  /**
   * 加密FormData中的普通字段
   */
  encryptFormData: (key: string, formData: FormData): FormData => {
    const encryptedFormData = new FormData()

    for (const [fieldName, value] of formData.entries()) {
      if (value instanceof Blob) {
        // 保留文件字段
        encryptedFormData.append(fieldName, value, (value as File).name)
      } else {
        // 加密普通字段
        const encryptedValue = SafetyUtils.sm4Encrypt(key, String(value))
        encryptedFormData.append(fieldName, encryptedValue)
      }
    }

    return encryptedFormData
  },

  /**
   * 生成指定长度的随机十六进制字符串
   */
  _generateRandomHex: (length: number): string => {
    const uint8Array = new Uint8Array(length)
    window.crypto.getRandomValues(uint8Array)
    return Array.from(uint8Array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  },
}
