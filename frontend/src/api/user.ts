import type { Response } from '@/types/Response'
import type { changePasswordRequest } from '@/types/user/ChangePasswordRequest'
import type { CreateUserRequest } from '@/types/user/CreateUserRequest'
import type { CreateUserResponse } from '@/types/user/CreateUserResponse'
import type { LoginRequest } from '@/types/user/LoginRequest'
import type { LoginResponse } from '@/types/user/LoginResponse'
import httpInstance from '@/utils/request/http'

/**
 * 登录
 * @param loginData 登录数据
 * @returns 登录情况
 */
export const login = (loginData: LoginRequest): Promise<Response<LoginResponse>> => {
  return httpInstance.post('/user/login', loginData)
}

/**
 * 检查登录状态
 * @returns
 */
export const checkLogin = (): Promise<Response<boolean>> => {
  return httpInstance.get('/user/check-login')
}

/**
 * 检查记住登录状态
 * @param token
 * @returns
 */
export const checkRemember = (token: string): Promise<Response<boolean>> => {
  return httpInstance.get('/user/check-remember', {
    params: {
      token,
    },
  })
}

/**
 * 自动登录
 * @param token
 * @returns
 */
export const autoLogin = (token: string): Promise<Response<LoginResponse>> => {
  return httpInstance.post('/user/auto-login', null, {
    params: {
      token,
    },
  })
}

/**
 * 修改密码
 * @param changeDatas 修改密码数据
 * @returns
 */
export const changePassword = (changeDatas: changePasswordRequest): Promise<Response<void>> => {
  return httpInstance.post('/user/change-pwd', changeDatas)
}

/**
 * 创建用户
 * @param createData 创建用户数据
 * @returns 创建用户id
 */
export const create = (createData: CreateUserRequest): Promise<Response<CreateUserResponse>> => {
  return httpInstance.post('/user/create', createData)
}
