export interface LoginRequest {
  username: string            // 用户名
  password: string            // 密码
  remember: boolean           // 记住密码
  includeCaptcha: boolean     // 包含验证码
  captcha: string             // 验证码
  uuid: string                // 验证码 UUID
}
