export interface RouteItem {
  path?: string
  name?: string
  label?: string // 菜单显示名称
  component?: any // 对应前端组件路径
  icon?: string
  redirect?: string
  meta?: {
    title?: string
    requiresAuth?: boolean
  }
  children?: RouteItem[]
}
export interface RouteRecordRaw {
  path?: string
  name?: string
  component?: any
  label?: string
  redirect?: string
  icon?: string
  children?: RouteRecordRaw[]
  meta?: {
    title?: string
    requiresAuth?: boolean
  }
}
