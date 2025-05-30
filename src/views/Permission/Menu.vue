<template>
  <el-card>
    <el-table
      :data="menulist"
      style="width: 100%"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      border
      stripe
      :empty-text="loading ? '加载中...' : '暂无菜单数据'"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column label="菜单名称" prop="name" width="180"></el-table-column>
      <el-table-column label="类型" :formatter="formatType" width="120"></el-table-column>
      <el-table-column label="路径" prop="path" show-overflow-tooltip></el-table-column>
      <el-table-column label="权限" prop="permission" show-overflow-tooltip></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(scope.row)"
            style="margin-left: 5px"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 空数据提示 -->
    <div class="empty-container" v-show="!loading && menulist.length === 0">
      <el-empty image="el-icon-s-empty" description="当前没有菜单数据，点击按钮创建新菜单">
        <template #footer>
          <el-button type="primary" @click="handleCreate">创建菜单</el-button>
        </template>
      </el-empty>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-container" v-show="total > 0">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
        background
        layout=" prev, pager, next, jumper"
      ></el-pagination>
    </div>

    <!-- 编辑/创建对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="菜单管理"
      :close-on-click-modal="false"
      width="400px"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="菜单名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入菜单名称（必填）"
            auto-complete="off"
            required
          ></el-input>
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-select
            v-model="editForm.type"
            placeholder="请选择菜单类型（必填）"
            clearable
            required
          >
            <el-option
              v-for="item in menuTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="路径" prop="path">
          <el-input
            v-model="editForm.path"
            placeholder="示例：/system/menu"
            auto-complete="off"
            v-if="editForm.type !== 'button'"
          ></el-input>
          <span v-else class="text-muted">按钮类型无需填写路径</span>
        </el-form-item>

        <el-form-item label="权限" prop="permission">
          <el-input
            v-model="editForm.permission"
            placeholder="示例：menu:view"
            auto-complete="off"
            v-if="editForm.type === 'button'"
          ></el-input>
          <span v-else class="text-muted">非按钮类型无需填写权限</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">
          {{ editForm.id ? '更新' : '创建' }}菜单
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import service from '@/api/request'

// 类型定义
interface MenuItem {
  id: number
  parentId: number | null
  name: string
  type: 'directory' | 'menu' | 'button'
  path: string
  permission?: string
  status?: boolean
  createTime?: string
  updateTime?: string
  component?: string
}
const editFormRef = ref<any>()
// 组件状态
const menulist = ref<MenuItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const editDialogVisible = ref(false)
const editForm = reactive<MenuItem>({
  id: 0,
  parentId: null,
  name: '',
  type: 'menu',
  path: '',
  permission: '',
})

const editRules = reactive({
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
})

const menuTypes = ref([
  { value: 'directory', label: '目录（用于导航）' },
  { value: 'menu', label: '菜单（对应路由）' },
  { value: 'button', label: '按钮（操作权限）' },
])

// 生命周期
onMounted(() => {
  fetchMenuList()
})

// 获取菜单列表
const fetchMenuList = async () => {
  loading.value = true
  try {
    const res = await service.get('/api/menus', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
      },
    })

    // 数据校验
    if (res.data.list && Array.isArray(res.data.list)) {
      menulist.value = res.data.list
      total.value = res.data.total || 0
    } else {
      menulist.value = []
      total.value = 0
      ElMessage.error('数据格式异常')
    }
  } catch (error: any) {
    ElMessage.error('获取菜单失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 分页处理
const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  resetSelection()
  fetchMenuList()
}

const handleCurrentPageChange = (page: number) => {
  if (page < 1) return
  currentPage.value = page
  fetchMenuList()
}

// 重置多选
const resetSelection = () => {
  multipleSelection.value = []
}

// 格式化类型
const formatType = (row: MenuItem) => {
  return (
    {
      directory: '目录',
      menu: '菜单',
      button: '按钮',
    }[row.type] || '未知'
  )
}

// 创建菜单
const handleCreate = () => {
  editDialogVisible.value = true
  resetForm()
  editForm.type = 'menu' // 默认类型
}

// 编辑菜单
const handleEdit = (row: MenuItem) => {
  editDialogVisible.value = true
  Object.assign(editForm, {
    id: row.id,
    name: row.name,
    type: row.type,
    path: row.path,
    permission: row.permission || '',
    parentId: row.parentId,
  })
}

// 保存菜单
const handleSave = async () => {
  try {
    await editFormRef.value.validate()

    const payload: MenuItem = {
      ...editForm,
      // 自动处理非必填字段
      component: editForm.type !== 'button' ? '@/views/Common/Empty.vue' : '',
      status: true,
    }

    let res: any
    if (editForm.id) {
      res = await service.put(`/api/menus/${editForm.id}`, payload)
      ElMessage.success('菜单更新成功')
    } else {
      res = await service.post('/api/menus', payload)
      ElMessage.success('菜单创建成功')
      currentPage.value = 1 // 创建后回到第一页
    }

    editDialogVisible.value = false
    resetForm()
    fetchMenuList()
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message)
  }
}

// 删除菜单
const handleDelete = async (row: MenuItem) => {
  await ElMessageBox.confirm(`确定要删除「${row.name}」及其所有子菜单吗？`, '警告', {
    type: 'warning',
  })

  try {
    await service.delete(`/api/menus/${row.id}`)
    ElMessage.success('删除成功')
    resetSelection()
    fetchMenuList()
  } catch (error: any) {
    ElMessage.error('删除失败：' + error.message)
  }
}

// 重置表单
const resetForm = () => {
  editForm.id = 0
  editForm.parentId = null
  editForm.name = ''
  editForm.type = 'menu'
  editForm.path = ''
  editForm.permission = ''
}

// 多选状态
const multipleSelection = ref<MenuItem[]>([])
const handleSelectionChange = (selection: MenuItem[]) => {
  multipleSelection.value = selection
}
</script>

<style lang="scss" scoped>
.pagination-container {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  justify-content: end;
}

.empty-container {
  padding: 100px 20px;
  text-align: center;
  color: #606266;
}

.el-table {
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.text-muted {
  color: #909399;
  font-size: 0.9em;
  margin-left: 5px;
}
</style>
