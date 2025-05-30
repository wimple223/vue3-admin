<template>
  <div class="goods-container">
    <el-col class="search-container">
      <el-input
        v-model="search"
        placeholder="请输入商品名称"
        clearable
        style="width: 350px; margin-bottom: 20px"
      >
        <template #prepend>商品名</template></el-input
      >

      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </el-col>
    <el-card>
      <el-dialog
        v-model="dialogVisible"
        @close="handleDialogClose"
        :title="add ? '新增商品' : '编辑商品'"
        :padding="24"
      >
        <el-form
          ref="formRef"
          :model="formValue"
          class="dialog-form"
          :rules="rules"
          label-width="100px"
          label-position="right"
          style="max-width: 500px; margin: 0 auto"
        >
          <el-form-item label="商品名称" prop="name">
            <el-input
              v-model="formValue.name"
              placeholder="请输入商品名称"
              style="width: 100%"
            ></el-input>
          </el-form-item>

          <el-form-item label="商品图" prop="image" class="avatar-container">
            <div style="display: flex; align-items: center; gap: 20px; width: 100%">
              <el-upload
                class="avatar-uploader"
                action="..."
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
              >
                <img
                  v-if="formValue.image"
                  :src="formValue.image"
                  class="avatar"
                  style="width: 100px; height: 100px; object-fit: cover"
                />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div style="flex-grow: 1">
                <p>建议上传尺寸：200x200px，大小不超过2MB</p>
              </div>
            </div>
          </el-form-item>

          <el-row>
            <el-col span="12">
              <el-form-item label="价格" prop="price">
                <el-input
                  v-model="formValue.price"
                  placeholder="请输入商品价格"
                  type="number"
                  style="width: 100%"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col span="12">
              <el-form-item label="库存" prop="stock">
                <el-input
                  v-model="formValue.stock"
                  placeholder="请输入商品库存"
                  type="number"
                  style="width: 100%"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="状态" prop="status">
            <el-select v-model="formValue.status" placeholder="请选择商品状态" style="width: 100%">
              <el-option label="上架" value="上架"></el-option>
              <el-option label="下架" value="下架"></el-option>
            </el-select>
          </el-form-item>
        </el-form>

        <template #footer>
          <div style="margin-top: 30px; text-align: right">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" style="margin-left: 15px">
              确定
            </el-button>
          </div>
        </template>
      </el-dialog>
      <el-button type="primary" @click="handelAdd">新增商品</el-button>
      <el-table :data="tableData" stripe>
        <el-table-column prop="id" label="ID"></el-table-column>
        <el-table-column prop="name" label="商品名称"></el-table-column>
        <el-table-column label="商品图">
          <!-- 使用scoped slot自定义内容 -->
          <template #default="scope">
            <el-image :src="scope.row.image" style="width: 60px; height: 60px" fit="cover">
              <!-- 加载失败时显示的内容 -->
              <template #error>
                <div class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存"> </el-table-column>
        <el-table-column prop="price" label="价格"></el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag
              :class="`status-${scope.row.status}`"
              :type="scope.row.status === '上架' ? 'success' : 'danger'"
              effect="dark"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" @click="handleRemove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[6, 10, 20, 30, 50]"
        :page-size="pageSize"
        layout="total, sizes,prev, pager, next, jumper"
        :total="total"
        class="pagination-container"
      >
      </el-pagination>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/api/request'
import { Plus } from '@element-plus/icons-vue'
import type { UploadProps } from 'element-plus'
const dialogVisible = ref(false)
const total = ref(0)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const search = ref('')
const formRef = ref<any>(null)
const rules = reactive({
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [
    {
      required: true,
      message: '请输入商品价格',
      trigger: 'blur',
      validator: (rule: any, value: any, callback: any) => {
        if (value === undefined || value === null || value === '') {
          callback(new Error('请输入商品价格'))
        } else if (isNaN(Number(value))) {
          callback(new Error('请输入有效数字'))
        } else {
          callback()
        }
      },
    },
  ],
  stock: [
    {
      required: true,
      message: '请输入库存数量',
      trigger: 'blur',
      validator: (rule: any, value: any, callback: any) => {
        if (value === undefined || value === null || value === '') {
          callback(new Error('请输入库存数量'))
        } else if (!Number.isInteger(Number(value)) || Number(value) < 0) {
          callback(new Error('请输入非负整数'))
        } else {
          callback()
        }
      },
    },
  ],
})

const currentId = ref(0)
const formValue = ref({
  name: '',
  stock: 0,
  status: '上架',
  image: '',
  price: 0,
})
const add = ref(false)
// 获取商品列表
const fetchProductList = async (params: {
  page: number
  pageSize: number
  search?: string
  status?: string
}) => {
  try {
    const response = await service.get('/api/product/list', { params })
    console.log('API返回数据:', response)

    if (response.status === 200) {
      tableData.value = response.data.list
      total.value = response.data.total
      currentPage.value = response.data.page
      pageSize.value = response.data.pageSize
    } else {
      ElMessage.error('获取商品列表失败')
    }
  } catch (error) {
    console.error('获取商品列表出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}
const handleDialogClose = () => {
  dialogVisible.value = false
}
// 页面大小改变时
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  fetchProductList({ page: currentPage.value, pageSize: newSize, search: '' })
}
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return tableData.value.slice(start, start + pageSize.value)
})
// 当前页改变时
const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  fetchProductList({ page: newPage, pageSize: pageSize.value, search: '' })
}
watch(search, () => {
  if (search.value.trim() === '') {
    fetchProductList({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: '',
      status: '',
    })
  }
})
const handleEdit = (row: any) => {
  formValue.value = {
    ...row,
    status: String(row.status), // 确保为字符串类型
  }
  currentId.value = row.id
  dialogVisible.value = true
  add.value = false
}
const handleSearch = () => {
  if (search.value.trim() === '') {
    ElMessage.error('请输入搜索内容')
    return
  }
  fetchProductList({
    page: currentPage.value,
    pageSize: pageSize.value,
    status: '',
    search: search.value,
  })
}
const handleRemove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认删除该商品吗？', {
      type: 'error',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
    const res = await service.delete(`/api/product/${row.id}`)
    if (res.status === 200) {
      ElMessage.success('删除成功')
      fetchProductList({
        page: currentPage.value,
        pageSize: pageSize.value,
        status: '',
        search: '',
      })
    }
  } catch (error) {
    console.error('删除商品出错:', error)
  }
}
const handelAdd = () => {
  formValue.value = {
    name: '',
    stock: 0,
    status: '上架',
    image: '',
    price: 0,
  }
  dialogVisible.value = true
  add.value = true
}
// 假设后端接口返回图片 URL
const handleAvatarSuccess = async (response: any, uploadFile: File) => {
  // 真实场景需通过 FormData 上传文件，并获取后端返回的 image URL
  const formData = new FormData()
  formData.append('file', uploadFile)
  const res = await service.post('/api/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  formValue.value.image = res.data.url // 保存后端返回的 URL
}

// 移除 beforeUpload 中的临时加载提示（使用组件自带的 loading 状态）
const beforeAvatarUpload = (rawFile: File) => {
  const isJPG = rawFile.type.startsWith('image/') // 支持多种图片格式
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('图片必须为图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  return true
}

const handleSubmit = async () => {
  try {
    // 修改：确保formRef存在
    if (!formRef.value) return

    // 修改：正确调用validate方法
    const valid = await formRef.value.validate()
    if (!valid) return

    // 根据条件选择发送 POST 或 PUT 请求，并等待请求完成
    if (add.value) {
      await service.post('/api/product', formValue.value)
      ElMessage.success('新增商品成功')
    } else {
      await service.put(`/api/product/${currentId.value}`, formValue.value) // 修改：使用formValue.value
      ElMessage.success('编辑商品成功')
    }

    dialogVisible.value = false
    fetchProductList({ page: currentPage.value, pageSize: pageSize.value, search: '', status: '' })
  } catch (error) {
    console.error('提交出错:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 初始化加载，明确传递空搜索参数
onMounted(() => {
  fetchProductList({
    page: currentPage.value,
    pageSize: pageSize.value,
    search: search.value,
    status: '',
  })
})
</script>
<style scoped>
.pagination-container {
  display: flex;
  justify-content: end;
}
.search-container {
  display: flex;
  justify-content: space-between;
}
.dialog-form {
  width: 100%;
  padding: 20px;
}

.avatar-container {
  margin: 20px 0;
}

.avatar-uploader {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar {
  width: 100%;
  height: 100px;
  object-fit: cover;
}
</style>
