import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ResponseCode } from './login'

// 订单状态类型
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

// 订单商品项
interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
  sku: string
}

// 请求接口定义
interface OrderListRequest {
  page?: number
  pageSize?: number
  status?: OrderStatus
  orderNo?: string
  startTime?: string
  endTime?: string
}

interface CreateOrderRequest {
  orderNo: string
  items: OrderItem[]
  totalAmount: number
  status?: OrderStatus
  customerId: number
  customerName: string
  shippingAddress: string
}

interface UpdateOrderRequest {
  orderNo?: string
  items?: OrderItem[]
  totalAmount?: number
  status?: OrderStatus
  customerId?: number
  customerName?: string
  shippingAddress?: string
}

// 响应接口定义
interface OrderListResponse {
  code: number
  data: {
    total: number
    list: OrderItem[]
  }
}

interface OrderItem {
  id: number
  orderNo: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  customerId: number
  customerName: string
  shippingAddress: string
  createTime: string
  updateTime: string
}

// 模拟订单数据
let orders = Mock.mock({
  'list|100': [
    {
      'id|+1': 1000,
      orderNo: () => `ORD-${Mock.Random.date('yyMMdd')}-${Mock.Random.id()}`,
      'status|1': ['pending', 'paid', 'shipped', 'completed', 'cancelled'],
      'items|1-5': [
        {
          'id|+1': 1,
          name: '@cword(3,8)',
          price: '@float(10, 1000, 2, 2)',
          quantity: '@integer(1, 10)',
          sku: () => `SKU-${Mock.Random.string('upper', 3)}-${Mock.Random.integer(100, 999)}`,
        },
      ],

      customerName: '@cname',
      shippingAddress: '@county(true)',
      createTime: '@datetime',
    },
  ],
}).list as OrderItem[]

// 订单状态映射表，用于中文显示
const statusMap: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

export default [
  // 获取订单列表
  {
    url: '/api/orders',
    method: 'get',
    response: ({ query }: { query: OrderListRequest }) => {
      const page = query.page || 1
      const pageSize = query.pageSize || 10
      const { status, orderNo, startTime, endTime } = query

      let filtered = orders.filter((order) => {
        if (status && order.status !== status) return false
        if (orderNo && !order.orderNo.includes(orderNo)) return false
        if (startTime && new Date(order.createTime) < new Date(startTime)) return false
        if (endTime && new Date(order.createTime) > new Date(endTime)) return false
        return true
      })

      return {
        code: ResponseCode.Success,
        data: {
          total: filtered.length,
          list: filtered.slice((page - 1) * pageSize, page * pageSize).map((order) => ({
            ...order,
            statusText: statusMap[order.status], // 增加状态中文描述
          })),
        },
      }
    },
  },

  // 获取单个订单
  {
    url: '/api/orders/:id',
    method: 'get',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const order = orders.find((o) => o.id === id)

      if (!order) {
        return {
          code: ResponseCode.ClientError,
          message: '订单不存在',
        }
      }

      return {
        code: ResponseCode.Success,
        data: {
          ...order,
          statusText: statusMap[order.status], // 增加状态中文描述
        },
      }
    },
  },

  // 删除订单
  {
    url: '/api/orders/:id',
    method: 'delete',
    response: (req: any) => {
      const id = Number(req.url.split('/').pop())
      const originalLength = orders.length

      orders = orders.filter((o) => o.id !== id)

      if (orders.length === originalLength) {
        return {
          code: ResponseCode.ClientError,
          message: '订单不存在',
        }
      }

      return {
        code: ResponseCode.Success,
        message: '订单删除成功',
      }
    },
  },
] as MockMethod[]
