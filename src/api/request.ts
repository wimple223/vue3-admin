import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/modules/auth'
import { ElMessage } from 'element-plus'
import { ResponseCode } from '@/mock/login'

const service = axios.create({
  headers: {
    'Content-Type': 'application/json,charset=utf-8',
  },
  timeout: 5000, // 修正了timeout的位置
})

// 错误类型常量
const ERROR_MSG: Record<number | string, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求资源不存在',
  500: '服务器错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
  network: '网络连接异常',
  system: '系统异常',
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    // 登录接口不携带token
    if (config.url !== '/api/login') {
      config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res.code === ResponseCode.Success) {
      console.log(res)

      return {
        ...response,
        data: res.data,
        code: res.code,
      } as AxiosResponse // 添加类型断言确保类型匹配
    }
    if (res.code === ResponseCode.ClientError) {
      ElMessage.error(res.message || '操作失败')
      return Promise.reject(res)
    }

    // 添加默认返回，避免返回undefined
    return response
  },
  async (error: AxiosError) => {
    // 处理错误情况
    const { response, config } = error
    if (response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      useAuthStore().logout()
      return Promise.reject(error)
    }
    let errorMsg = ERROR_MSG.network
    if (error.response) {
      errorMsg = ERROR_MSG[error.response.status] || errorMsg
    }
    ElMessage.error(errorMsg)
    return Promise.reject(error)
  },
)

// 扩展请求配置类型
declare module 'axios' {
  interface AxiosRequestConfig {
    needRefreshToken?: boolean
  }
}

export default service
