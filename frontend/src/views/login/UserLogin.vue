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

          <el-form-item prop="captcha" v-if="includeCaptcha">
            <el-row style="width: 100%">
              <el-col :span="18">
                <el-input v-model="loginForm.captcha" placeholder="验证码" type="text" />
              </el-col>
              <el-col :span="6">
                <img
                  :src="captchaUrl"
                  ref="captchaRef"
                  class="captcha-img"
                  @click="updateCaptcha"
                />
              </el-col>
            </el-row>
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
import { onMounted, reactive, type Ref, ref } from 'vue'
import { useLoginValidator } from '@/hooks/user/useLoginValidator'
import type { ElForm } from 'element-plus'
import { $api } from '@/api/api'
import { useUserStore } from '@/stores/useUserStore'
import { ElMessage } from 'element-plus'
import config from '@/config/config.json'
import { useLogin } from '../../hooks/user/useLogin'
import { useRoute, useRouter } from 'vue-router'

// 包含验证码
const includeCaptcha = config.includeCaptcha

// 验证码图片路径
const captchaUrl: Ref<string> = ref('')
// 验证码
const captchaRef = ref<HTMLDivElement>()

// 表单数据
const loginForm: LoginRequest = reactive({
  username: 'admin',
  password: 'admin@123',
  includeCaptcha: includeCaptcha,
  captcha: '',
  uuid: '',
  remember: false,
})

// 表单引用
const loginFormRef = ref<InstanceType<typeof ElForm>>()

// 路由
const router = useRouter()
const route = useRoute()

// 从当前登录页的URL中获取redirect参数
const redirect: Ref<string> = ref('');

// 用户pinia
const userStore = useUserStore()
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

    router.push(useLogin.getRedirectPath(redirect.value))
  } catch (error) {
    ElMessage.error(`登录失败，${error}`)
  }
}

// 页面挂载时执行登录状态判断
onMounted(async () => {
  redirect.value = route.query.redirect as string
  console.log('检查登录状态', redirect)
  // 检查登录状态
  await useLogin.checkLogin(redirect.value, router)

  // 获取验证码
  if (includeCaptcha) {
    $api.user.generateCaptcha(150).then((res) => {
      loginForm.uuid = res.data.uuid
      captchaUrl.value = res.data.captcha
    })
  }
})

// 更新验证码
const updateCaptcha = () => {
  if (!captchaRef.value) return
  $api.user.generateCaptcha(captchaRef.value?.clientWidth).then((res) => {
    loginForm.uuid = res.data.uuid
    captchaUrl.value = res.data.captcha
  })
}
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

.captcha-img {
  height: calc(var(--el-input-height, 32px) - 2px);
  padding-left: 20px;
  box-sizing: border-box;
  cursor: pointer;
}
</style>
