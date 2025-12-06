import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import configJson from '@/config/config.json'
import { useUserStore } from '@/stores/useUserStore'
import { SafetyUtils } from '../safety/SafetyUtils.ts'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 扩展Axios内部配置类型
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    __sm4Key?: string
    isNoEncryptUrl?: boolean
  }
}

const httpInstance = axios.create({
  baseURL: configJson.apiBaseUrl,
  timeout: 15000, // 增加超时时间
  withCredentials: true,
})

// 请求拦截器
httpInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const { url, method } = config
    const userStore = useUserStore()

    // 初始化headers
    config.headers = config.headers || {}

    // Token处理
    const isNoTokenUrl = configJson.noTokenUrls.some((path) => url?.includes(path))
    if (!isNoTokenUrl && userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    // 加密处理标记
    const isNoEncryptUrl = configJson.noEncryptUrls.some((path) => url?.includes(path))
    config.isNoEncryptUrl = isNoEncryptUrl

    if (!isNoEncryptUrl) {
      try {
        // 生成SM4密钥并加密，无论是否有业务参数
        const sm4Key = SafetyUtils.generateSm4Key()
        config.__sm4Key = sm4Key
        const sm4KeyEncrypted = await SafetyUtils.sm2Encrypt(sm4Key)

        // GET请求：处理URL参数（无论是否有params，都要传递sm4KeyEncrypted）
        if (method?.toUpperCase() === 'GET') {
          // 有业务参数则加密，无参数则仅传递sm4KeyEncrypted
          const encryptedParams = config.params ? SafetyUtils.sm4Encrypt(sm4Key, config.params) : '' // 无参数时encryptedData可为空

          config.params = {
            encryptedData: encryptedParams,
            sm4KeyEncrypted: sm4KeyEncrypted,
          }
        }

        // POST/PUT/DELETE/PATCH请求：处理请求体（无论是否有data，都要传递sm4KeyEncrypted）
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method?.toUpperCase() || '')) {
          if (config.data instanceof FormData) {
            // 加密表单数据
            const encryptedFormData = SafetyUtils.encryptFormData(sm4Key, config.data)

            const newFormData = new FormData()
            // 复制加密后的业务字段
            for (const [key, value] of encryptedFormData.entries()) {
              newFormData.append(key, value)
            }
            // 强制添加sm4KeyEncrypted
            newFormData.append('sm4KeyEncrypted', sm4KeyEncrypted)
            config.data = newFormData
          } else {
            // 有业务数据则加密，无数据则encryptedData为空
            const encryptedData = config.data ? SafetyUtils.sm4Encrypt(sm4Key, config.data) : ''

            config.data = {
              encryptedData: encryptedData,
              sm4KeyEncrypted: sm4KeyEncrypted,
            }
          }
        }
      } catch (error) {
        console.error('请求加密失败:', error)
        return Promise.reject(new Error('请求数据加密失败'))
      }
    }

    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
httpInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { config, data } = response
    let processedData // 用于存储处理后（原始或解密）的数据

    // 处理非加密接口或无密钥的情况
    if (config.isNoEncryptUrl || !config.__sm4Key) {
      processedData = data
    } else {
      // 处理加密接口的解密逻辑
      try {
        if (typeof data === 'string') {
          // 解密字符串类型的加密数据
          processedData = SafetyUtils.sm4Decrypt(config.__sm4Key, data)
        } else if (data && typeof data === 'object') {
          // 解密对象中包含的加密字段
          processedData = SafetyUtils.sm4Decrypt(config.__sm4Key, data.encryptedData || data)
        } else {
          // 非预期数据格式直接使用原始数据
          processedData = data
        }
      } catch (error) {
        console.error('响应数据解密失败:', error)
        ElMessage.error('数据解密失败，请重试')
        return Promise.reject(new Error('数据解密失败，请重试'))
      }
    }

    // 统一判断处理后的数据状态
    if (processedData?.code === 200 || processedData?.code === 409) {
      return processedData
    } else if (processedData?.code == 401) {
      router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
      ElMessage.error('请先登录')
    } else {
      const errorMsg = processedData?.message || '操作失败，请稍后重试'
      ElMessage.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }
  },
  (error) => {
    console.error('响应拦截器错误:', error)
    let errorMsg = '请求失败，请稍后重试'

    // 处理服务器解密相关错误
    if (error.response?.status === 500 && error.response?.data?.msg?.includes('解密')) {
      errorMsg = '服务器解密失败，请检查密钥配置'
    } else if (error.message) {
      // 使用错误对象自带的消息
      errorMsg = error.message
    }

    // 错误提示
    ElMessage.error(errorMsg)
    return Promise.reject(error)
  },
)

export default httpInstance
