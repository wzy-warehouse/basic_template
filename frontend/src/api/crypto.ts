import type { Sm2PublicKeyResponse } from '@/types/crypto/Sm2PublicKeyResponse'
import type { Response } from '@/types/Response'
import httpInstance from '@/utils/request/http'

/**
 * 获取sm2加密公钥
 * @returns
 */
export const getSm2PublicKey = (): Promise<Response<Sm2PublicKeyResponse>> => {
  return httpInstance.get('/crypto/sm2/public-key')
}
