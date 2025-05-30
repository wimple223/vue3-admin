// router/index.js - 修复后的完整代码
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
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { requiresAuth: false },
  },
  {
    // 定义主布局路由
    path: '/',
    name: 'Main',
    component: () => import('@/views/Main.vue'),
    redirect: '/home',
    meta: {
      title: '首页',
    },
    children: [], // 动态路由将添加到这里
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { requiresAuth: false },
    beforeEnter: (to: any, from: any, next: any) => {
      // 确保动态路由加载完成后再检查
      const authStore = useAuthStore()
      if (!authStore.isRoutesReady) {
        next(false) // 阻止导航，等待路由加载
        return
      }
      next()
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes, // 直接使用基础路由初始化
})

// 添加基础路由（保留此方法但简化）
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

// 动态添加异步路由
export const addAsyncRoutes = (routes: any) => {
  // 确保Main路由已存在
  const mainRoute = router.getRoutes().find((r) => r.name === 'Main')
  if (!mainRoute) {
    console.error('Main路由未找到，无法添加子路由')
    return false
  }

  // 处理动态路由，确保路径格式正确
  routes.forEach((route: any) => {
    // 移除路径开头的斜杠，避免子路由路径问题
    if (route.path.startsWith('/')) {
      route.path = route.path.slice(1)
    }

    // 添加路由前检查名称是否存在
    if (router.hasRoute(route.name)) {
      console.warn(`路由名称 ${route.name} 已存在，跳过添加`)
      return
    }

    router.addRoute('Main', route)
  })

  return true
}

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. 首先放行白名单路由
  if (['Login', 'NotFound'].includes(to.name as string)) {
    next()
    return
  }

  // 2. 检查 Token 是否存在
  if (!authStore.isAuthenticated) {
    ElMessage.error('会话已过期，请重新登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 3. 验证动态路由状态
  if (!authStore.isRoutesReady) {
    try {
      await authStore.initAppRoutes()
      // 重定向到原始目标路由（处理动态路由加载后的刷新问题）
      next({ ...to, replace: true })
    } catch (error) {
      console.error('路由初始化失败:', error)
      next({ path: '/login' })
    }
    return
  }

  // 4. 验证路由是否存在
  if (!router.hasRoute(to.name || '') && to.path !== '/404') {
    next({ name: 'NotFound' })
    return
  }

  // 5. 最终放行
  next()
})
export default router
