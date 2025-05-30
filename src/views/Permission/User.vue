<template>
  <el-col class="search-container">
    <el-input
      placeholder="输入用户名/手机号进行搜索"
      label="用户名"
      v-model="searchName"
      style="width: 350px"
    >
      <template #prepend>用户名</template>
    </el-input>
    <div class="button-group">
      <el-button type="primary" :disabled="searchName === ''" @click="handleSearch">搜索</el-button>
    </div>
  </el-col>
  <el-card>
    <el-dialog v-model="isEdit" :title="add ? '新增用户' : '编辑用户'" @close="handleDialogClose">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select v-model="form.roles" placeholder="选择角色" :multiple="false">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="编辑" value="editor"></el-option>
            <el-option label="访客" value="guest"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isEdit = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-button type="primary" @click="handleAddUser">新增</el-button>
    <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
    <el-table :data="userList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50"></el-table-column>
      <el-table-column prop="id" label="ID"></el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="roles" label="角色">
        <template #default="scope">
          {{ getRoleLabel(scope.row.roles) }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="createTime" label="创建时间"></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button @click="handleEdit(scope.row)" size="small" type="primary"> 编辑 </el-button>
          <el-button @click="handleDelete(scope.row)" size="small" type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="demo-pagination-block">
      <div class="demonstration"></div>
      <el-pagination
        background
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :size="size"
        :disabled="disabled"
        layout=" prev, pager, next, jumper,"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type ComponentSize } from 'element-plus'
import service from '@/api/request'

interface UserItem {
  id: number
  username: string
  roles: string[] | string
  phone: string
  email: string
  createTime?: string
}

const searchName = ref('')
const currentPage = ref(1)
const isEdit = ref(false)
const pageSize = ref(10)
const size = ref<ComponentSize>('default')
const add = ref(false)
const disabled = ref(false)
const isRemove = ref(false)
const loading = ref(false)
const userList = ref<UserItem[]>([])
const total = ref(0)
const currentDeleteId = ref(0)
const multipleSelection = ref<UserItem[]>([])
const form = ref<UserItem>({ id: 0, username: '', roles: [], phone: '', email: '' })
const formRef = ref<any>()

// 获取角色标签
type RoleType = 'admin' | 'editor' | 'guest'

const getRoleLabel = (roles: RoleType | RoleType[]) => {
  const roleMap: Record<RoleType, string> = {
    admin: '管理员',
    editor: '编辑',
    guest: '访客',
  }

  if (Array.isArray(roles)) {
    return roles.map((role) => roleMap[role] || role).join(', ')
  }

  return roleMap[roles] || roles
}

// 获取用户数据
const fetchUsers = async (params: { page: number; pageSize: number; search?: string }) => {
  try {
    loading.value = true
    const response = await service.get('/api/getUserData', {
      params,
    })
    console.log('获取用户数据:', response)

    userList.value = response.data.list || []
    total.value = response.data.total || 0
  } catch (error) {
    console.error('获取用户数据失败:', error)
    ElMessage.error('获取用户数据失败，请重试')
  } finally {
    loading.value = false
  }
}

// 初始化加载
fetchUsers({ page: 1, pageSize: 10 })

// 搜索功能
const handleSearch = () => {
  if (!searchName.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  currentPage.value = 1
  fetchUsers({ page: 1, pageSize: pageSize.value, search: searchName.value.trim() })
}
watch(searchName, () => {
  if (searchName.value.trim() === '') {
    currentPage.value = 1
    fetchUsers({ page: 1, pageSize: pageSize.value })
  }
})
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchUsers({ page: currentPage.value, pageSize: val })
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  fetchUsers({ page: newPage, pageSize: pageSize.value })
}

const handleEdit = (row: UserItem) => {
  add.value = false
  // 复制用户数据，避免直接修改原数据
  form.value = {
    ...row,
    // 确保roles格式正确
    roles: Array.isArray(row.roles) ? row.roles[0] : row.roles,
  }
  isEdit.value = true
}

const formRules = ref({
  username: [{ required: true, message: '用户名必填', trigger: 'blur' }],
  roles: [{ required: true, message: '请选择角色', trigger: 'change' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur', required: true }],
  email: [{ type: 'email', message: '邮箱格式错误', trigger: 'blur', required: true }],
})

const handleDelete = async (row: UserItem) => {
  try {
    await ElMessageBox.confirm(`确认删除用户 ${row.username} 吗？`, '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'error',
    })

    const response = await service.delete(`/api/user/${row.id}`)

    if (response.status === 200) {
      ElMessage.success('删除成功')
      fetchUsers({ page: currentPage.value, pageSize: pageSize.value }) // 刷新数据
    } else {
      ElMessage.error(`删除失败: ${response.data.message || '未知错误'}`)
    }
  } catch (error) {
    console.log('用户取消删除')
  }
}

// 处理选择变化
const handleSelectionChange = (val: UserItem[]) => {
  multipleSelection.value = val
}

// 批量删除
const handleBatchDelete = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要删除的用户')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${multipleSelection.value.length} 个用户吗？`,
      '警告',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'error',
      },
    )

    const ids = multipleSelection.value.map((user) => user.id)
    let successCount = 0
    let errorCount = 0

    // 循环调用单个删除接口
    for (const id of ids) {
      try {
        const response = await service.delete(`/api/user/${id}`)
        if (response.status === 200) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
        console.error('删除用户失败:', error)
      }
    }

    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 个用户`)
      fetchUsers({ page: currentPage.value, pageSize: pageSize.value })
      multipleSelection.value = []
    }

    if (errorCount > 0) {
      ElMessage.warning(`${errorCount} 个用户删除失败`)
    }
  } catch (error) {
    console.log('用户取消批量删除')
  }
}

const handleDialogClose = () => {
  isEdit.value = false
  formRef.value?.resetFields()
}

// 合并保存和新增逻辑
const handleSave = async () => {
  await formRef.value?.validate().catch(() => {
    ElMessage.error('请检查表单信息')
    return false
  })

  try {
    let response

    if (add.value) {
      // 新增用户
      response = await service.post('/api/user', {
        username: form.value.username,
        phone: form.value.phone,
        email: form.value.email,
        roles: [form.value.roles],
      })

      if (response.status === 200) {
        ElMessage.success('新增用户成功')
      }
    } else {
      // 编辑用户
      response = await service.put(`/api/user/${form.value.id}`, {
        username: form.value.username,
        phone: form.value.phone,
        email: form.value.email,
        roles: [form.value.roles],
      })

      if (response.status === 200) {
        ElMessage.success('编辑成功')
      }
    }

    fetchUsers({ page: currentPage.value, pageSize: pageSize.value })
    isEdit.value = false
  } catch (error) {
    console.error(add.value ? '新增用户失败' : '编辑用户失败', error)
    ElMessage.error(add.value ? '新增用户失败，请重试' : '编辑用户失败，请重试')
  }
}

const handleAddUser = () => {
  add.value = true
  isEdit.value = true
  form.value = { id: 0, username: '', roles: [], phone: '', email: '' }
}
</script>

<style scoped lang="scss">
.search-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
