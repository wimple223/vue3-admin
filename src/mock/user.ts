// mock/userData.ts
import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ResponseCode } from './login'

interface EditUserRequest {
  username?: string
  roles?: string[]
  phone?: string
  email?: string
}

interface UserListRequest {
  page?: number
  pageSize?: number
  search?: string
}

interface UserListResponse {
  code: number
  data: {
    total: number
    list: UserItem[]
  }
}

interface UserItem {
  id: number
  username: string
  roles: string[]
  phone: string
  email: string
  createTime: string
}

interface CreateUserRequest {
  username: string
  roles?: string[]
  phone?: string
  email?: string
}

let users = Mock.mock({
  'list|100': [
    {
      'id|+1': 1,
      username: '@cname',
      'roles|1': ['admin', 'editor', 'guest'],
      phone: /^1[3-9]\d{9}$/,
      email: '@email',
      createTime: '@datetime',
      updateTime: '@datetime',
    },
  ],
}).list as UserItem[]

export default [
  // 用户列表接口（GET）
  {
    url: '/api/getUserData',
    method: 'get',
    response: ({ query }: { query: UserListRequest }) => {
      const page = query.page || 1
      const pageSize = query.pageSize || 10
      const search = query.search || ''
      const filtered = users.filter(
        (user) =>
          user.username.includes(search) ||
          user.phone.includes(search) ||
          user.email.includes(search),
      )
      return {
        code: ResponseCode.Success,
        data: {
          total: filtered.length,
          list: filtered.slice((page - 1) * pageSize, page * pageSize),
        },
      }
    },
  },

  // 编辑用户接口（PUT /api/user/{id}）
  {
    url: '/api/user/:id', // 使用冒号语法
    method: 'put',
    response: (req: any) => {
      // 从URL提取ID
      const id = req.url.match(/\/api\/user\/(\d+)/)?.[1]
      const userId = Number(id)

      // 验证ID有效性
      if (!id || isNaN(userId)) {
        return {
          code: ResponseCode.ClientError,
          message: '用户ID格式错误',
        }
      }

      // 查找用户
      const userIndex = users.findIndex((u) => u.id === userId)
      if (userIndex === -1) {
        return {
          code: ResponseCode.ClientError,
          message: '用户不存在',
        }
      }

      // 处理请求体
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

      // 数据验证
      if (!body.username?.trim()) {
        return {
          code: ResponseCode.ClientError,
          message: '用户名不能为空',
        }
      }

      // 合并数据
      const updatedUser = {
        ...users[userIndex],
        ...body,
        roles: Array.isArray(body.roles) ? body.roles : [body.roles], // 强制转换为数组
        updateTime: Mock.mock('@datetime'),
      }

      // 更新数据
      users[userIndex] = updatedUser

      console.log('[Mock] 用户更新成功:', updatedUser)
      return {
        code: ResponseCode.Success,
        data: updatedUser,
        message: '更新成功',
      }
    },
  },
  // 删除用户接口（DELETE /api/user/{id}）
  {
    url: '/api/user/:id',
    method: 'delete',
    response: (req: any) => {
      // 提取ID
      const id = req.url.match(/\/api\/user\/(\d+)/)?.[1]
      const userId = Number(id)

      // ID验证
      if (!id || isNaN(userId)) {
        return {
          code: ResponseCode.ClientError,
          message: '无效的用户ID',
        }
      }

      // 执行删除
      const originalLength = users.length
      users = users.filter((u) => u.id !== userId)

      // 验证删除结果
      if (users.length === originalLength) {
        return {
          code: ResponseCode.ClientError,
          message: '用户不存在',
        }
      }

      console.log(`[Mock] 用户 ${userId} 删除成功`)
      return {
        code: ResponseCode.Success,
        message: '删除成功',
      }
    },
  },

  // 新增用户接口（POST /api/user）
  {
    url: '/api/user',
    method: 'post',
    response: ({ body }: { body: CreateUserRequest }) => {
      if (!body.username) {
        return { code: ResponseCode.ClientError, message: '用户名必填' }
      }
      const newUserId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1
      const newUser = {
        id: newUserId,
        username: body.username,
        roles: body.roles?.length ? body.roles : [Mock.Random.pick(['admin', 'editor', 'guest'])],
        phone: body.phone || Mock.mock(/^1[3-9]\d{9}$/),
        email: body.email || Mock.mock('@email'),
        createTime: Mock.mock('@datetime'),
        updateTime: Mock.mock('@datetime'),
      }
      users.push(newUser)
      return { code: ResponseCode.Success, data: newUser, message: '创建成功' }
    },
  },
] as MockMethod[]
