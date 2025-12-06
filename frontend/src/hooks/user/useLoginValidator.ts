export const useLoginValidator = {
  // 用户名验证
  username: [
    {
      required: true,
      message: '用户名不能为空。',
      trigger: 'blur',
    },
    {
      min: 3,
      max: 50,
      message: '用户名长度必须介于3-50之间',
      trigger: 'blur',
    },
  ],
  // 密码验证
  password: [
    {
      required: true,
      message: '密码不能为空。',
      trigger: 'blur',
    },
    {
      min: 6,
      max: 20,
      message: '密码长度必须介于6-20之间',
      trigger: 'blur',
    },
    {
      pattern: /^(?![0-9]+$)(?![A-Za-z]+$)(?![!@#$%^&*()_+;]+$)[\dA-Za-z!@#$%^&*()_+;]+$/,
      message: '密码格式不正确，需至少包含数字、字母、特殊字符(!@#$%^&*()_+;)中的两类',
      trigger: 'blur',
    },
  ],
}
