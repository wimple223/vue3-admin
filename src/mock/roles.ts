import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ResponseCode } from './login'

export interface RoleItem {
  id: number

  position: string
  permissions: string[]
  createTime: string
  updateTime: string
}

interface RoleListRequest {
  page?: number
  pageSize?: number
  search?: string
}

interface RoleListResponse {
  code: number
  data: {
    total: number
    list: RoleItem[]
  }
}

interface CreateRoleRequest {
  position: string
  permissions?: string[]
}

interface EditRoleRequest {
  position?: string
  permissions?: string[]
}

// 模拟角色数据
const ALL_PERMISSIONS = [
  { id: 'user:view', name: '用户查看' },
  { id: 'user:edit', name: '用户编辑' },
  { id: 'role:view', name: '角色查看' },
  { id: 'role:edit', name: '角色编辑' },
  { id: 'permission:view', name: '权限查看' },
  { id: 'permission:edit', name: '权限编辑' },
  { id: 'system:config', name: '系统配置' },
  { id: 'log:view', name: '日志查看' },
  { id: 'data:export', name: '数据导出' },
  { id: 'data:import', name: '数据导入' },
]

let roles = Mock.mock({
  'list|20': [
    {
      'id|+1': 1,
      position: '@cword(2, 4)@cword(1, 3)员',
      // 关键修改：生成正确的权限数组
      permissions: () =>
        Mock.Random.shuffle(ALL_PERMISSIONS)
          .slice(0, Mock.Random.integer(1, 8))
          .map((p: any) => p.id),
      createTime: '@datetime',
      updateTime: '@datetime',
    },
  ],
}).list as RoleItem[]

export default [
  // 角色列表接口
  {
    url: '/api/roles',
    method: 'get',
    response: ({ query }: { query: RoleListRequest }) => {
      const page = query.page || 1
      const pageSize = query.pageSize || 10
      const search = query.search || ''

      const filtered = roles.filter(
        (role) => role.position.includes(search) || role.position.includes(search), // 搜索职位名称
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

  // 获取单个角色接口
  {
    url: '/api/roles/:id',
    method: 'get',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const role = roles.find((r) => r.id === id)

      if (!role) {
        return {
          code: ResponseCode.ClientError,
          message: '角色不存在',
        }
      }

      return {
        code: ResponseCode.Success,
        data: role,
      }
    },
  },

  // 创建角色接口
  {
    url: '/api/roles',
    method: 'post',
    response: ({ body }: { body: CreateRoleRequest }) => {
      if (!body.position) {
        return { code: ResponseCode.ClientError, message: '职位名称必填' }
      }

      const newRoleId = roles.length > 0 ? Math.max(...roles.map((r) => r.id)) + 1 : 1
      const newRole = {
        id: newRoleId,

        position: body.position, // 使用职位名称
        permissions: body.permissions || [],
        createTime: Mock.mock('@datetime'),
        updateTime: Mock.mock('@datetime'),
      }

      roles.push(newRole)
      return {
        code: ResponseCode.Success,
        data: newRole,
        message: '角色创建成功',
      }
    },
  },

  // 更新角色接口
  {
    url: '/api/roles/:id',
    method: 'put',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const roleIndex = roles.findIndex((r) => r.id === id)

      if (roleIndex === -1) {
        return {
          code: ResponseCode.ClientError,
          message: '角色不存在',
        }
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

      const updatedRole = {
        ...roles[roleIndex],
        ...body,
        updateTime: Mock.mock('@datetime'),
      }

      roles[roleIndex] = updatedRole

      return {
        code: ResponseCode.Success,
        data: updatedRole,
        message: '角色更新成功',
      }
    },
  },

  // 删除角色接口
  {
    url: '/api/roles/:id',
    method: 'delete',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const originalLength = roles.length

      roles = roles.filter((r) => r.id !== id)

      if (roles.length === originalLength) {
        return {
          code: ResponseCode.ClientError,
          message: '角色不存在',
        }
      }

      return {
        code: ResponseCode.Success,
        message: '角色删除成功',
      }
    },
  },

  // 批量删除角色接口

  {
    url: '/api/permissions',
    method: 'get',
    response: () => {
      return {
        code: ResponseCode.Success,
        data: ALL_PERMISSIONS,
      }
    },
  },

  // 分配权限接口
  {
    url: '/api/roles/:id/permissions',
    method: 'put',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const roleIndex = roles.findIndex((r) => r.id === id)

      if (roleIndex === -1) {
        return {
          code: ResponseCode.ClientError,
          message: '角色不存在',
        }
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { permissions } = body

      // 更新角色权限
      roles[roleIndex].permissions = permissions
      roles[roleIndex].updateTime = Mock.mock('@datetime')

      return {
        code: ResponseCode.Success,
        data: roles[roleIndex],
        message: '权限分配成功',
      }
    },
  },
] as MockMethod[]
