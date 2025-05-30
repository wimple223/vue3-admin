// 使用相对路径匹配，而不是 @ 别名
const module = import.meta.glob('/src/views/**/*.vue')
import type { RouteItem, RouteRecordRaw } from '@/router/types'

export const formatRoutes = (serverRoutes: any) => {
  return serverRoutes.map((route: RouteItem) => {
    // 构建与 import.meta.glob 匹配的路径

    const componentPath = `/src/views/${route.component}.vue`

    const component = module[componentPath] || null

    // 添加错误处理
    if (!component) {
      console.error(`无法加载组件: ${componentPath}`)
      console.log('可用模块:', Object.keys(module))
    }

    return {
      path: route.path,
      name: route.name,
      label: route.label,
      component: component,
      icon: route.icon,
      meta: route.meta,
      children: route.children ? formatRoutes(route.children) : [],
    }
  })
}
