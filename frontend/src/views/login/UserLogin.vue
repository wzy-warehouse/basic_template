<template>
  <div class="login-bg">
    <div class="form-bg">
      <div class="title">登录页面</div>
      <div class="form-box">
        <el-form :model="loginForm" :rules="useLoginValidator" ref="loginFormRef">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="用户名" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="loginForm.password" placeholder="密码" type="password" />
          </el-form-item>

          <el-form-item prop="remember">
            <el-checkbox v-model="loginForm.remember">记住密码(7天)</el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button class="login-btn" type="success" @click="handleLogin">登录系统</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script name="UserLogin" setup lang="ts">
import type { LoginRequest } from '@/types/user/LoginRequest'
import { onMounted, reactive, ref } from 'vue'
import { useLoginValidator } from '@/hooks/user/useLoginValidator'
import type { ElForm } from 'element-plus'
import { $api } from '@/api/api'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { ElMessage } from 'element-plus'
import config from '@/config/config.json'

// 表单数据
const loginForm: LoginRequest = reactive({
  username: 'admin',
  password: 'admin@123',
  remember: false,
})

// 表单引用
const loginFormRef = ref<InstanceType<typeof ElForm>>()

// 路由
const router = useRouter()
const route = useRoute()

// 用户pinia
const userStore = useUserStore()

// 获取跳转路径
const getRedirectPath = () => {
  // 从当前登录页的URL中获取redirect参数（需解码，因为路由跳转时可能用了encodeURIComponent）
  const redirect = route.query.redirect as string
  const decodedRedirect = redirect ? decodeURIComponent(redirect) : ''

  // 安全校验：只允许内部路径（避免跳转到外部网站）
  if (decodedRedirect && decodedRedirect.startsWith('/')) {
    return decodedRedirect
  }
  // 无有效redirect参数时，默认跳首页
  return '/home'
}

// 登录处理
const handleLogin = async () => {
  const isValid = await loginFormRef.value?.validate()
  if (!isValid) return

  try {
    const res = await $api.user.login(loginForm)
    // 存储登录状态到pinia
    userStore.token = res.data.token
    userStore.username = res.data.user.username
    userStore.id = res.data.user.id

    // 存储"记住密码"状态到localStorage（持久化）
    if (loginForm.remember) {
      localStorage.setItem(config.rememberMeKey, 'true')
      localStorage.setItem(config.rememberMeTokenKey, res.data.token)
    } else {
      localStorage.removeItem(config.rememberMeKey)
      localStorage.removeItem(config.rememberMeTokenKey)
    }

    router.push(getRedirectPath())
  } catch (error) {
    ElMessage.error(`登录失败，${error}`)
  }
}

// 页面挂载时执行登录状态判断
onMounted(async () => {
  try {
    // 检查当前是否已登录（sa-token判断）
    const loginStatusRes = await $api.user.checkLogin()
    if (loginStatusRes.data) {
      router.push(getRedirectPath())
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
      router.push(getRedirectPath())
    }
  } catch (error) {
    ElMessage.error(`登录状态检查失败，${error}`)
  }
})
</script>
<style scoped>
.login-bg {
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100vh;
  line-height: 20px;
  background: linear-gradient(
    150.14deg,
    rgba(228, 234, 241, 0) 0.98%,
    rgba(228, 234, 241, 0.31) 0.98%,
    rgba(228, 234, 241, 1) 112.22%
  );
}

.form-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30%;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.08);
  transform: translate(-50%, -50%);
}

.form-bg .title {
  line-height: 50px;
  color: rgba(44, 62, 80, 1);
  font-size: 48px;
  text-align: center;
  font-family: '微软雅黑';
  font-weight: bold;
  margin: 20px auto;
}

.form-bg .form-box {
  width: 90%;
  margin: 0 auto 30px auto;
}

.form-bg .form-box .login-btn {
  display: block;
  width: 100%;
}
</style>
