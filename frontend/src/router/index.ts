import { createRouter, createWebHashHistory } from 'vue-router'
import { $api } from '@/api/api'
import { useUserStore } from '@/stores/useUserStore'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/UserLogin.vue'),
      meta: {
        noLoginRequired: true,
      },
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/home/HomePage.vue'),
    },
  ],
})

// 全局前置守卫：路由跳转前校验
router.beforeEach(async (to, from, next) => {
  // 免登录页面
  if (to.meta.noLoginRequired) {
    next()
    return
  }

  try {
    // 登录验证
    const userStore = useUserStore()
    if (userStore.isLogin) {
      next()
      return
    }

    // 从后端获取登录状态
    if ((await $api.user.checkLogin()).data) {
      userStore.isLogin = true
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  } catch (err) {
    console.error('登录状态校验失败', err)
    ElMessage.error('网络异常，无法验证登录状态')
    next(false)
  }
})

export default router
