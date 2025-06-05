// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { ElMessage } from 'element-plus'

// 基础路由（无需权限）
const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    // 主布局路由必须放在404路由前
    path: '/',
    name: 'Main',
    component: () => import('@/views/Main.vue'),
    redirect: '/home',
    meta: {
      title: '首页',
      requiresAuth: true,
    },
    children: [], // 动态路由将添加到这里
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { requiresAuth: false },
  },
  // 移除这里的通配符路由，统一在addAsyncRoutes中处理
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

// 添加基础路由
export const addConstantRoutes = () => {
  constantRoutes.forEach((route) => {
    if (!router.hasRoute(route.name as string)) {
      router.addRoute(route)
    }
  })
}

// 重置路由
export const resetRouter = () => {
  router.getRoutes().forEach((route) => {
    if (!constantRoutes.some((r) => r.name === route.name)) {
      router.removeRoute(route.name as string)
    }
  })
}

// 动态添加异步路由 - 修改后的版本
export const addAsyncRoutes = (routes: any) => {
  const mainRoute = router.getRoutes().find((r) => r.name === 'Main')
  if (!mainRoute) {
    console.error('Main路由未找到，无法添加子路由')
    return false
  }

  routes.forEach((route: any) => {
    // 规范化路径
    route.path = route.path.replace(/^\/+/, '') // 移除开头斜杠

    if (router.hasRoute(route.name)) {
      console.warn(`路由名称 ${route.name} 已存在，跳过添加`)
      return
    }

    router.addRoute('Main', route)
  })

  // 添加兜底404路由（确保在最后）
  if (!router.hasRoute('NotFound')) {
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/404.vue'),
      meta: { requiresAuth: false },
    })
  }

  return true
}

// 全局前置守卫 - 修改后的版本
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. 放行白名单路由
  if (to.name === 'Login' || to.name === 'NotFound') {
    next()
    return
  }

  // 2. 检查认证状态
  if (!authStore.isAuthenticated) {
    ElMessage.error('会话已过期，请重新登录')
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 3. 确保动态路由已加载
  if (!authStore.isRoutesReady) {
    try {
      // 防止重复初始化
      if (!authStore.routeInitPending) {
        authStore.routeInitPending = true
        await authStore.initAppRoutes()
      }

      // 重新解析路由并跳转
      next({ ...to, replace: true })
    } catch (error) {
      console.error('路由初始化失败:', error)
      next({ name: 'Login' })
    }
    return
  }

  // 4. 检查路由是否存在
  if (!router.hasRoute(to.name as string)) {
    next({ name: 'NotFound', query: { originalPath: to.fullPath } })
    return
  }

  // 5. 最终放行
  next()
})

export default router
