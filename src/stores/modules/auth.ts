import { defineStore } from 'pinia'
import service from '@/api/request'
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import router, { addConstantRoutes, addAsyncRoutes, resetRouter } from '@/router'
import { formatRoutes } from '@/utils/routerUtils'

export const useAuthStore = defineStore('auth', () => {
  // 状态定义
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const roles = ref<string[]>(JSON.parse(localStorage.getItem('roles') || '[]'))
  const menuList = ref(JSON.parse(localStorage.getItem('menuList') || '[]'))
  const isRoutesReady = ref(false)
  const isLoading = ref(false)
  const routeInitPending = ref(false)
  // 计算属性：判断用户是否已登录
  const isAuthenticated = computed(() => !!token.value)

  // 初始化应用路由
  const initAppRoutes = async () => {
    // 如果路由已经加载，直接返回
    if (isRoutesReady.value) return true

    try {
      // 添加基础路由
      addConstantRoutes()

      // 如果用户已登录，加载动态路由
      if (isAuthenticated.value) {
        return await loadAsyncRoutes()
      }

      // 添加404路由（未登录状态）
      if (!router.hasRoute('NotFound')) {
        router.addRoute({
          path: '/:pathMatch(.*)*',
          name: 'NotFound',
          component: () => import('@/views/404.vue'),
          meta: { requiresAuth: false },
        })
      }

      isRoutesReady.value = true
      return true
    } catch (error) {
      console.error('初始化路由失败:', error)
      return false
    } finally {
      routeInitPending.value = false
    }
  }

  // 加载异步路由 - 修改重点
  const loadAsyncRoutes = async () => {
    try {
      // 确保Main路由已存在
      const mainRouteExists = router.hasRoute('Main')
      if (!mainRouteExists) {
        console.error('Main路由不存在，无法添加子路由')
        return false
      }

      // 如果已有缓存的菜单，直接使用
      if (menuList.value.length > 0) {
        const dynamicRoutes = formatRoutes(menuList.value)
        addAsyncRoutes(dynamicRoutes)
        console.log('路由已从本地缓存恢复')
      }
      // 如果没有缓存，从服务器获取
      else if (roles.value.length > 0) {
        const menuResponse = await service.post('/api/getmenuList', {
          roles: roles.value,
        })

        menuList.value = menuResponse.data.menuList
        localStorage.setItem('menuList', JSON.stringify(menuList.value))

        const dynamicRoutes = formatRoutes(menuList.value)
        addAsyncRoutes(dynamicRoutes)
        console.log('路由已从服务器加载')
      } else {
        throw new Error('用户角色或菜单列表为空')
      }

      isRoutesReady.value = true
      return true
    } catch (error) {
      console.error('加载动态路由失败:', error)
      return false
    }
  }

  // 刷新路由（用于角色变更等情况）
  const refreshRoutes = async () => {
    try {
      // 重置现有路由
      resetRouter()

      // 加载动态路由
      return await loadAsyncRoutes()
    } catch (error) {
      console.error('刷新路由失败:', error)
      return false
    }
  }

  // 登录方法
  const login = async (username: string, password: string) => {
    try {
      isLoading.value = true
      const response = await service.post('/api/login', {
        username,
        password,
      })

      // 存储认证信息
      token.value = response.data.token
      refreshToken.value = response.data.refreshToken
      roles.value = response.data.roles || []

      localStorage.setItem('token', token.value)
      localStorage.setItem('refreshToken', refreshToken.value)
      localStorage.setItem('roles', JSON.stringify(roles.value))

      if (roles.value.length === 0) {
        throw new Error('用户角色未定义')
      }

      // 加载动态路由
      const routesLoaded = await loadAsyncRoutes()
      if (routesLoaded) {
        // 跳转到登录前的页面或首页
        const redirect = router.currentRoute.value.query.redirect || '/'
        // 使用name而不是path，确保路由名称正确
        router.push({ name: 'Main', path: redirect })
        ElMessage.success('登录成功')
        return response.data
      } else {
        throw new Error('加载路由失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
      return false
    } finally {
      isLoading.value = false
    }
  }
  // 登出方法
  const logout = () => {
    // 重置状态
    token.value = ''
    refreshToken.value = ''
    roles.value = []
    menuList.value = []
    isRoutesReady.value = false

    // 清除存储
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('roles')
    localStorage.removeItem('menuList')

    // 重置路由
    resetRouter()

    // 跳转登录页
    router.push('/login')
    ElMessage.success('已安全退出')
  }

  // 监听token变化，自动登出
  watch(token, (newToken) => {
    if (!newToken && isAuthenticated.value) {
      logout()
    }
  })

  return {
    token,
    refreshToken,
    roles,
    menuList,
    isAuthenticated,
    isRoutesReady,
    isLoading,
    initAppRoutes,
    login,
    loadAsyncRoutes,
    logout,
    routeInitPending,
    refreshRoutes,
  }
})
