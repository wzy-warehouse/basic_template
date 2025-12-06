interface User {
  id: number
  username: string
}

export interface LoginResponse {
  user: User
  token: string
}
