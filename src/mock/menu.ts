import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ResponseCode } from './login'

export interface MenuItem {
  id: number
  parentId: number | null
  name: string
  type: 'directory' | 'menu' | 'button'
  path: string
  component: string
  icon: string
  sort: number
  permission: string
  status: boolean
  createTime: string
  updateTime: string
}
type MenuType = 'directory' | 'menu' | 'button'
// 独立路径生成函数（避免使用this）
const generatePath = function (this: { type: MenuType }) {
  switch (this.type) {
    case 'directory':
      return `/${Mock.Random.word(3, 6)}` // 目录路径：/dashboard
    case 'menu':
      return `/${Mock.Random.word(3, 6)}/${Mock.Random.word(3, 6)}` // 菜单路径：/user/list
    default: // button
      return '' // 按钮无路径
  }
}

// 生成权限（普通函数，通过 this 访问 type）
const generatePermission = function (this: { type: MenuType }) {
  return this.type === 'button'
    ? `${Mock.Random.word(3, 6)}:${Mock.Random.word(2, 4)}` // 按钮权限：user:edit
    : '' // 非按钮无权限
}

// 模拟菜单数据（完全避免使用this和未初始化的menus）
let menus: MenuItem[] = Mock.mock({
  'list|30': [
    {
      'id|+1': 1,
      'parentId|1-5': 0, // 0后续处理为null
      name: '@cword(2, 6)', // 中文名称
      'type|1': ['directory', 'menu', 'button'], // 随机类型
      path: generatePath, // 直接引用生成函数
      // 直接引用生成函数
      icon: '@word(2, 4)', // Mock.js内置占位符
      'sort|1-100': 1, // 随机排序
      permission: generatePermission, // 权限生成
      'status|1': [true, false], // 随机状态
      createTime: '@datetime', // 随机时间
      updateTime: '@datetime',
    },
  ],
}).list.map((menu: any) => ({
  // 统一处理parentId
  ...menu,
  parentId: menu.parentId === 0 ? null : menu.parentId, // 根菜单设为null
  // 确保函数生成的值正确类型（避免 Mock.js 推断为字符串）
  path: typeof menu.path === 'function' ? menu.path() : menu.path, // 调用函数获取值
  permission: typeof menu.permission === 'function' ? menu.permission() : menu.permission, // 根菜单设为null
})) as MenuItem[]

export default [
  // 菜单列表接口
  // 菜单列表接口
  {
    url: '/api/menus',
    method: 'get',
    response: ({ query }: any) => {
      const page = Number(query.page) || 1
      const pageSize = Number(query.pageSize) || 10

      // 不进行过滤，直接返回所有菜单的分页结果
      return {
        code: 200,
        data: {
          total: menus.length,
          list: menus.slice((page - 1) * pageSize, page * pageSize),
        },
      }
    },
  },

  // 其他接口（保持不变）
  {
    url: '/api/menus/:id',
    method: 'get',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const menu = menus.find((m) => m.id === id)
      return menu
        ? { code: ResponseCode.Success, data: menu }
        : { code: ResponseCode.ClientError, message: '菜单不存在' }
    },
  },

  // 创建菜单接口
  {
    url: '/api/menus',
    method: 'post',
    response: ({ body }: { body: any }) => {
      if (!body.name) {
        return { code: ResponseCode.ClientError, message: '菜单名称必填' }
      }

      if (!body.type) {
        return { code: ResponseCode.ClientError, message: '菜单类型必填' }
      }

      const newMenuId = menus.length > 0 ? Math.max(...menus.map((m) => m.id)) + 1 : 1
      const newMenu = {
        id: newMenuId,
        parentId: body.parentId,
        name: body.name,
        type: body.type,
        path: body.path,
        component: body.component,
        icon: body.icon,
        sort: body.sort,
        permission: body.permission,
        status: body.status,
        createTime: Mock.mock('@datetime'),
        updateTime: Mock.mock('@datetime'),
      }

      menus.push(newMenu)
      return {
        code: ResponseCode.Success,
        data: newMenu,
        message: '菜单创建成功',
      }
    },
  },

  // 更新菜单接口
  {
    url: '/api/menus/:id',
    method: 'put',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const menuIndex = menus.findIndex((m) => m.id === id)

      if (menuIndex === -1) {
        return {
          code: ResponseCode.ClientError,
          message: '菜单不存在',
        }
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

      const updatedMenu = {
        ...menus[menuIndex],
        ...body,
        updateTime: Mock.mock('@datetime'),
      }

      menus[menuIndex] = updatedMenu

      return {
        code: ResponseCode.Success,
        data: updatedMenu,
        message: '菜单更新成功',
      }
    },
  },

  // 删除菜单接口
  {
    url: '/api/menus/:id',
    method: 'delete',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const originalLength = menus.length

      // 递归删除子菜单
      function deleteChildMenus(parentId: number) {
        const childIds = menus.filter((menu) => menu.parentId === parentId).map((menu) => menu.id)

        childIds.forEach((childId) => {
          deleteChildMenus(childId)
        })

        menus = menus.filter((menu) => menu.id !== parentId && !childIds.includes(menu.id))
      }

      deleteChildMenus(id)

      if (menus.length === originalLength) {
        return {
          code: ResponseCode.ClientError,
          message: '菜单不存在',
        }
      }

      return {
        code: ResponseCode.Success,
        message: '菜单删除成功',
      }
    },
  },

  // 获取菜单树接口
  // 获取菜单树接口
  {
    url: '/api/menus/tree',
    method: 'get',
    response: () => {
      // 显式指定返回类型
      function buildMenuTree(parentId: number | null): MenuItem[] {
        return menus
          .filter((menu) => menu.parentId === parentId)
          .sort((a, b) => a.sort - b.sort)
          .map((menu) => ({
            ...menu,
            children: buildMenuTree(menu.id),
          }))
      }

      const menuTree = buildMenuTree(null)

      return {
        code: ResponseCode.Success,
        data: menuTree,
      }
    },
  },

  // 获取所有菜单接口(扁平结构)
  {
    url: '/api/menus/all',
    method: 'get',
    response: () => {
      return {
        code: ResponseCode.Success,
        data: menus.sort((a, b) => a.sort - b.sort),
      }
    },
  },
] as MockMethod[]
