import { $api } from '@/api/api'
import config from '@/config/config.json'
import { useUserStore } from '@/stores/useUserStore'
import { ElMessage } from 'element-plus'
import type { Router } from 'vue-router'

// 用户pinia
const userStore = useUserStore()

export const useLogin = {
  /**
   * 检查登录状态
   */
  checkLogin: async (redirect: string, router: Router) => {
    try {
      // 检查当前是否已登录（sa-token判断）
      const loginStatusRes = await $api.user.checkLogin()
      if (loginStatusRes.data) {
        router.push(useLogin.getRedirectPath(redirect))
        return
      }

      // 未登录，检查是否有"记住密码"标记
      const isRemembered = localStorage.getItem(config.rememberMeKey) === 'true'
      if (!isRemembered) {
        return
      }

      // 有记住密码标记，检查上次登录是否过期
      const token = localStorage.getItem(config.rememberMeTokenKey)
      if (!token) {
        return
      }
      const rememberStatusRes = await $api.user.checkRemember(token)
      if (!rememberStatusRes.data) {
        localStorage.removeItem(config.rememberMeKey)
        return
      }

      // 记住登录未过期，自动恢复登录状态
      const autoLoginRes = await $api.user.autoLogin(token)
      if (autoLoginRes.data) {
        // 更新pinia存储
        userStore.token = autoLoginRes.data.token
        userStore.username = autoLoginRes.data.user.username
        userStore.id = autoLoginRes.data.user.id
        userStore.isLogin = true
        router.push(useLogin.getRedirectPath(redirect))
        return
      }
    } catch (error) {
      ElMessage.error(`登录状态检查失败，${error}`)
    }
  },

  /**
   * 获取跳转路由
   */
  getRedirectPath: (redirect: string) => {
    const decodedRedirect = redirect ? decodeURIComponent(redirect) : ''

    // 安全校验：只允许内部路径（避免跳转到外部网站）
    if (decodedRedirect && decodedRedirect.startsWith('/')) {
      return decodedRedirect
    }
    // 无有效redirect参数时，默认跳首页
    return '/home'
  },
}
