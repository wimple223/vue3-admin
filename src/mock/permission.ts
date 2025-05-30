// types/menu.d.ts
export interface MenuItem {
  path: string
  name?: string
  label: string
  icon?: string
  redirect?: string
  component?: string
  meta?: {
    title?: string
    requiresAuth?: boolean
    cacheable?: boolean
    disabled?: boolean
  }
  children?: MenuItem[]
}

// mock/permission.ts
import type { MockMethod } from 'vite-plugin-mock'
import { ResponseCode, UserRole } from './login'

const generateMenus = (role: UserRole): MenuItem[] => {
  const baseMenus: MenuItem[] = [
    {
      path: '/home',
      name: 'home',
      label: '首页',
      icon: 'HomeFilled',
      component: 'Home',

      meta: {
        // title: '首页',
        requiresAuth: true,
      },
    },
  ]

  const adminMenus: MenuItem[] = [
    {
      path: '/mall',
      label: '商品管理',
      icon: 'MessageBox',
      redirect: 'goods',
      meta: { requiresAuth: true, title: '商品管理', disabled: true },
      children: [
        {
          path: 'goods',
          name: 'mall.goods',
          label: '商品列表',
          icon: 'GoodsFilled',
          component: 'Mall/Goods',
          meta: { title: '商品列表' },
        },
        // {
        //   path: 'brand',
        //   name: 'mall.brand',
        //   icon: 'Brand',
        //   label: '品牌管理',
        //   component: 'Mall/Brand',
        //   meta: { title: '品牌管理' },
        // },
        {
          path: 'order',
          name: 'mall.order',
          icon: 'Order',
          label: '订单管理',
          component: 'Mall/Order',
          meta: { title: '订单管理' },
        },
      ],
    },
    {
      path: '/permission',
      label: '权限管理',
      icon: 'lock',
      redirect: 'role',
      meta: { requiresAuth: true, title: '权限管理', disabled: true },
      children: [
        {
          path: 'role',
          name: 'permission.role',
          label: '角色管理',
          icon: 'Avatar',
          component: 'Permission/Role',
          meta: { title: '角色管理' },
        },
        {
          path: 'user',
          name: 'permission.user',
          label: '用户管理',
          icon: 'User',
          component: 'Permission/User',
          meta: { title: '用户管理' },
        },
        {
          path: 'menu',
          name: 'permission.menu',
          label: '菜单管理',
          icon: 'List',
          component: 'Permission/Menu',
          meta: { title: '菜单管理' },
        },
      ],
    },
  ]

  return role === UserRole.Admin ? [...baseMenus, ...adminMenus] : baseMenus
}

export default [
  {
    url: '/api/getmenuList',
    method: 'post',
    response: ({ body }: { body: { roles?: UserRole[] } }) => {
      try {
        const role = body.roles?.[0]

        if (!role || !Object.values(UserRole).includes(role)) {
          return {
            code: ResponseCode.Unauthorized,
            data: {
              menuList: [],
              permissions: [],
              message: '无效的用户角色',
            },
          }
        }

        return {
          code: ResponseCode.Success,
          data: {
            menuList: generateMenus(role),
            permissions: [role],
            message: '菜单获取成功',
          },
        }
      } catch (error) {
        return {
          code: ResponseCode.Unauthorized,
          data: {
            menuList: [],
            permissions: [],
            message: '服务器内部错误',
          },
        }
      }
    },
  },
] as MockMethod[]
