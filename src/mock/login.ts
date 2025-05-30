// mock/auth.ts
import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

// 类型定义
export interface LoginRequest {
  username: string
  password: string
}

interface UserInfoResponse {
  code: number
  data: {
    name: string
    roles: string[]
    avatar: string
  }
}

export enum ResponseCode {
  Success = 200,
  ClientError = 400,
  Unauthorized = 401,
}

export enum UserRole {
  Admin = 'admin',
  Editor = 'editor',
}

interface LoginResponse {
  code: number
  data?: {
    token: string
    refreshToken: string
    roles: UserRole[]
    expires: number
  }
  message?: string
}

interface RefreshTokenRequest {
  refreshToken: string
}

interface RefreshTokenResponse {
  code: number
  data?: {
    token: string
    expires: number
  }
  message?: string
}

// Token 存储结构
interface TokenRecord {
  token: string
  expire: number
  role: UserRole
  refreshToken: string
}

// 内存存储（生产环境应使用数据库）
const tokenStore = new Map<string, TokenRecord>()
const refreshTokenStore = new Map<string, string>()

// 过期时间配置（毫秒）
// const TOKEN_EXPIRE = 30 * 60 * 1000 // 30分钟
const TOKEN_EXPIRE = 10 * 1000 // 10秒
const REFRESH_TOKEN_EXPIRE = 7 * 24 * 60 * 60 * 1000 // 7天

// 通用响应头
const commonHeaders = {
  'Content-Type': 'application/json',
}

export default [
  // 登录接口
  {
    url: '/api/login',
    method: 'post',
    response: ({ body }: { body: LoginRequest }): LoginResponse => {
      try {
        // 验证用户身份
        if (!['admin', 'editor'].includes(body.username)) {
          return {
            code: ResponseCode.Unauthorized,
            message: '用户不存在',
          }
        }

        if (body.password !== '123456') {
          return {
            code: ResponseCode.Unauthorized,
            message: '密码错误',
          }
        }

        // 生成 Token
        const now = Date.now()
        const token = `MOCK_TOKEN_${Mock.Random.guid()}`
        const refreshToken = `MOCK_RT_${Mock.Random.guid()}`
        const role = body.username === 'admin' ? UserRole.Admin : UserRole.Editor

        // 存储 Token 记录
        const tokenRecord: TokenRecord = {
          token,
          expire: now + TOKEN_EXPIRE,
          role,
          refreshToken,
        }

        tokenStore.set(token, tokenRecord)
        refreshTokenStore.set(refreshToken, token)

        return {
          code: ResponseCode.Success,
          data: {
            token,
            refreshToken,
            roles: [role],
            expires: TOKEN_EXPIRE,
          },
        }
      } catch (error) {
        return {
          code: ResponseCode.ClientError,
          message: '登录服务异常',
        }
      }
    },
  },

  // 用户信息接口
  {
    url: '/api/userinfo',
    method: 'get',
    response: (req: any): UserInfoResponse => {
      const token = req.headers.authorization?.replace('Bearer ', '')
      const record = tokenStore.get(token)

      if (!record) {
        return {
          code: ResponseCode.Unauthorized,
          data: {
            name: '',
            roles: [],
            avatar: '',
          },
        }
      }

      return {
        code: ResponseCode.Success,
        data: {
          name: record.role === UserRole.Admin ? '管理员' : '编辑员',
          roles: [record.role],
          avatar: 'https://example.com/avatar.png',
        },
      }
    },
  },

  // Token 刷新接口
  {
    url: '/api/refresh',
    method: 'post',
    response: ({ body }: { body: RefreshTokenRequest }): RefreshTokenResponse => {
      try {
        const oldToken = refreshTokenStore.get(body.refreshToken)

        if (!oldToken) {
          return {
            code: ResponseCode.Unauthorized,
            message: '无效的刷新令牌',
          }
        }

        const oldRecord = tokenStore.get(oldToken)
        if (!oldRecord) {
          return {
            code: ResponseCode.Unauthorized,
            message: '令牌记录不存在',
          }
        }

        // 检查刷新令牌是否过期
        if (Date.now() > oldRecord.expire + REFRESH_TOKEN_EXPIRE) {
          return {
            code: ResponseCode.Unauthorized,
            message: '刷新令牌已过期',
          }
        }

        // 生成新 Token
        const now = Date.now()
        const newToken = `MOCK_TOKEN_${Mock.Random.guid()}`
        const newRefreshToken = `MOCK_RT_${Mock.Random.guid()}`

        // 更新存储
        tokenStore.delete(oldToken)
        refreshTokenStore.delete(oldRecord.refreshToken)

        const newRecord: TokenRecord = {
          token: newToken,
          expire: now + TOKEN_EXPIRE,
          role: oldRecord.role,
          refreshToken: newRefreshToken,
        }

        tokenStore.set(newToken, newRecord)
        refreshTokenStore.set(newRefreshToken, newToken)

        return {
          code: ResponseCode.Success,
          data: {
            token: newToken,
            expires: TOKEN_EXPIRE,
          },
        }
      } catch (error) {
        return {
          code: ResponseCode.ClientError,
          message: '令牌刷新失败',
        }
      }
    },
  },

  // 全局 Token 验证中间件
  {
    url: '/api/*',
    method: 'all',
    response: (req: any) => {
      // 排除登录和刷新接口
      if (['/api/login', '/api/refresh'].includes(req.url)) return

      const token = req.headers.authorization?.replace('Bearer ', '')
      const record = tokenStore.get(token)

      if (!record) {
        return {
          code: ResponseCode.Unauthorized,
          message: '无效的访问令牌',
          headers: commonHeaders,
        }
      }

      if (Date.now() > record.expire) {
        return {
          code: ResponseCode.Unauthorized,
          message: '访问令牌已过期',
          headers: commonHeaders,
        }
      }

      // 正常请求透传到具体接口
      return
    },
  },
] as MockMethod[]
