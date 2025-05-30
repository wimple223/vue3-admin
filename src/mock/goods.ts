// mock/productData.ts
import type { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { ResponseCode } from './login'

// 请求参数类型
interface ProductListRequest {
  page?: number
  pageSize?: number
  search?: string
  status?: string // 商品状态（上架/下架）
}

interface ProductItem {
  id: number
  name: string // 商品名称
  stock: number // 库存
  image: string // 图片地址
  status: '上架' | '下架' // 商品状态
  price: number // 价格
  description: string // 商品描述
  createTime: string // 创建时间
  updateTime: string // 更新时间
}

interface CreateProductRequest {
  name: string
  stock?: number
  image?: string
  status?: '上架' | '下架'
  price?: number
  description?: string
}

interface EditProductRequest {
  name?: string
  stock?: number
  image?: string
  status?: '上架' | '下架'
  price?: number
  description?: string
}

function generateProductName() {
  const categories = ['手机', '电脑', '平板', '耳机', '相机', '手表', '电视', '音箱']
  const brands = ['苹果', '华为', '小米', '三星', 'OPPO', 'VIVO', '魅族', '联想']
  const suffixes = ['Pro', 'Max', 'Ultra', 'Lite', 'S', 'Plus', 'Mini']

  const category = categories[Mock.Random.integer(0, categories.length - 1)]
  const brand = brands[Mock.Random.integer(0, brands.length - 1)]
  const suffix = Mock.Random.boolean() ? suffixes[Mock.Random.integer(0, suffixes.length - 1)] : ''

  return `${brand}${category}${suffix}`
}
let products = Mock.mock({
  'list|100': [
    {
      'id|+1': 1,
      name: () => generateProductName(), // 随机2-4字中文名称
      stock: '@integer(0, 2000)', // 随机库存
      image: () => `https://picsum.photos/seed/product${Mock.Random.integer(1, 1000)}/200/200`, // 随机图片
      'status|1': ['上架', '下架'], // 随机状态
      price: '@float(10, 5000, 2, 2)', // 10-5000元浮点数（两位小数）
    },
  ],
}).list as ProductItem[]

// 模拟商品数据（初始化100条数据）
console.log('[Mock] 商品数据初始化完成，数量:', products.length)

export default [
  // ==============================
  // 商品列表接口（支持分页、搜索、筛选）
  // ==============================
  {
    url: '/api/product/list',
    method: 'get',
    response: ({ query }: { query: ProductListRequest }) => {
      const page = Number(query.page) || 1
      const pageSize = Number(query.pageSize) || 10
      const search = String(query.search)?.trim() || ''
      const statusFilter = query.status !== undefined ? String(query.status) : ''

      console.log('[Mock] 接收的查询参数:', { page, pageSize, search, statusFilter })

      // 数据过滤
      let filteredProducts = products.filter((product) => {
        const statusPass = !statusFilter || product.status === statusFilter

        // 仅搜索商品名称字段，并增加空值检查
        const searchPass = !search || (product.name && product.name.includes(search))

        return statusPass && searchPass
      })

      console.log('[Mock] 过滤后的商品数据量:', filteredProducts.length)

      // 分页处理
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedList = filteredProducts.slice(start, end)

      return {
        code: ResponseCode.Success,
        data: {
          total: filteredProducts.length,
          page: page,
          pageSize: pageSize,
          list: paginatedList,
        },
      }
    },
  },

  {
    url: '/api/product/:id',
    method: 'get',
    response: (req: any) => {
      // 从URL中提取ID
      const id = req.url.match(/\/api\/product\/(\d+)/)?.[1]
      if (!id || isNaN(Number(id))) {
        return { code: ResponseCode.ClientError, message: '无效的商品ID' }
      }

      const product = products.find((p) => p.id === Number(id))
      return product
        ? { code: ResponseCode.Success, data: product }
        : { code: ResponseCode.ClientError, message: '商品不存在' }
    },
  },

  // ==============================
  // 新增商品接口
  // ==============================
  {
    url: '/api/product',
    method: 'post',
    response: ({ body }: { body: CreateProductRequest }) => {
      // 基础校验
      if (!body.name) {
        return { code: ResponseCode.ClientError, message: '商品名称必填' }
      }

      // 生成新ID
      const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1

      // 创建新商品
      const newProduct: ProductItem = {
        id: newId,
        name: body.name,
        stock: body.stock || Mock.Random.integer(0, 2000),
        image: body.image || `https://picsum.photos/seed/product${newId}/200/200`,
        status: body.status || '上架',
        price: body.price || Mock.Random.float(10, 5000, 2, 2),
        description: body.description || Mock.mock('@cparagraph(1, 2)'),
        createTime: Mock.mock('@datetime'),
        updateTime: Mock.mock('@datetime'),
      }

      products.push(newProduct)
      return {
        code: ResponseCode.Success,
        data: newProduct,
        message: '商品创建成功',
      }
    },
  },

  // ==============================
  // 编辑商品接口
  // ==============================
  {
    url: '/api/product/:id',
    method: 'put',
    response: (req: any) => {
      // 提取ID
      const idMatch = req.url.match(/\/api\/product\/(\d+)/)
      if (!idMatch || isNaN(Number(idMatch[1]))) {
        return { code: ResponseCode.ClientError, message: '无效的商品ID' }
      }
      const productId = Number(idMatch[1])

      // 查找商品
      const index = products.findIndex((p) => p.id === productId)
      if (index === -1) {
        return { code: ResponseCode.ClientError, message: '商品不存在' }
      }

      // 处理请求体
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

      // 合并更新数据
      const updatedProduct = {
        ...products[index],
        ...body,
        updateTime: Mock.mock('@datetime'), // 更新时间
      }

      // 数据校验（示例：价格必须为正数）
      if (updatedProduct.price && updatedProduct.price < 0) {
        return { code: ResponseCode.ClientError, message: '价格不能为负数' }
      }

      products[index] = updatedProduct
      return {
        code: ResponseCode.Success,
        data: updatedProduct,
        message: '商品更新成功',
      }
    },
  },

  // ==============================
  // 删除商品接口
  // ==============================
  {
    url: '/api/product/:id',
    method: 'delete',
    response: (req: any) => {
      // 提取ID
      const idMatch = req.url.match(/\/api\/product\/(\d+)/)
      if (!idMatch || isNaN(Number(idMatch[1]))) {
        return { code: ResponseCode.ClientError, message: '无效的商品ID' }
      }
      const productId = Number(idMatch[1])

      // 执行删除
      const originalLength = products.length
      products = products.filter((p) => p.id !== productId)

      return products.length < originalLength
        ? { code: ResponseCode.Success, message: '商品删除成功' }
        : { code: ResponseCode.ClientError, message: '商品不存在' }
    },
  },
] as MockMethod[]
