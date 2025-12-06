import type { LoginRequest } from '@/types/user/LoginRequest'
import {
  autoLogin,
  changePassword,
  checkLogin,
  checkRemember,
  create as createUser,
  login,
} from './user'
import type { changePasswordRequest } from '@/types/user/ChangePasswordRequest'
import type { CreateUserRequest } from '@/types/user/CreateUserRequest'
import { getSm2PublicKey } from './crypto'

export const $api = {
  // 用户模块
  user: {
    // 登录
    login: (loginData: LoginRequest) => login(loginData),

    // 检查登录状态
    checkLogin: () => checkLogin(),

    // 检查记住登录状态
    checkRemember: (token: string) => checkRemember(token),

    // 自动登录
    autoLogin: (token: string) => autoLogin(token),

    // 修改密码
    changePassword: (changeDatas: changePasswordRequest) => changePassword(changeDatas),

    // 创建新用户
    create: (createData: CreateUserRequest) => createUser(createData),
  },

  // 加密模块
  crypto: {
    // 获取sm2公钥
    getSm2PublicKey: () => getSm2PublicKey(),
  },
}
