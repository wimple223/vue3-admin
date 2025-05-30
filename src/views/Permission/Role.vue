<template>
  <el-col class="search-container">
    <el-input
      placeholder="请输入角色名称搜索"
      label="角色名称"
      v-model="searchName"
      style="width: 350px"
    >
      <template #prepend>角色名称</template>
    </el-input>
    <div class="button-group">
      <el-button type="primary" :disabled="searchName === ''" @click="handleSearch">搜索</el-button>
    </div>
  </el-col>
  <el-card>
    <el-dialog v-model="dialogVisible" :title="add ? '新增角色' : '编辑角色'">
      <el-form :model="formValue" ref="formRef" :rules="rules">
        <el-form-item prop="position" label="角色名称">
          <el-input v-model="formValue.position" placeholder="请输入角色名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="分配权限">
      <el-form :model="permissionForm">
        <el-form-item label="角色名称">
          <el-input v-model="permissionForm.position" disabled></el-input>
        </el-form-item>
        <el-form-item label="权限列表">
          <div v-if="permissionsLoading" class="permission-loading">
            <el-skeleton animated />
          </div>
          <el-tree
            v-else
            :data="permissions"
            show-checkbox
            node-key="id"
            ref="permissionTreeRef"
            :props="treeProps"
            :default-checked-keys="permissionForm.permissions"
          ></el-tree>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPermissions" @click="handleSavePermissions"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <el-button type="primary" @click="handleAdd">新增角色</el-button>

    <el-table :data="tableData" :row-class-name="getRowClass">
      <el-table-column prop="id" label="ID"></el-table-column>
      <el-table-column prop="position" label="角色名称"></el-table-column>
      <el-table-column label="角色权限">
        <template #default="scope">
          <el-tag
            v-for="permissionId in scope.row.permissions"
            :key="permissionId"
            :type="getPermissionType(permissionId)"
            size="small"
          >
            {{ getPermissionName(permissionId) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间"></el-table-column>
      <el-table-column prop="updateTime" label="更新时间"></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="info" @click="handlePremission(scope.row)"> 分配权限 </el-button>
          <el-button type="primary" @click="handleEdit(scope.row)">编辑 </el-button>
          <el-button type="danger" @click="handleRemove(scope.row)">删除 </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="demo-pagination-block">
      <div class="demonstration"></div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :size="size"
        :disabled="disabled"
        background
        layout="prev, pager, next, jumper,"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, onMounted, nextTick, computed } from 'vue'
import type { ComponentSize } from 'element-plus'
import service from '@/api/request'
import { ElMessage, ElMessageBox, ElSkeleton } from 'element-plus'
import { type RoleItem } from '@/mock/roles'

interface PermissionItem {
  id: string
  name: string
}

// 表格数据和分页相关
const tableData = ref<RoleItem[]>([])
const searchName = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const size = ref<ComponentSize>('default')
const disabled = ref(false)
const total = ref(0)

// 角色表单相关
const dialogVisible = ref(false)
const formValue = reactive({
  position: '',
})
const formRef = ref<any>()
const add = ref(false)
const currentId = ref(0)

// 权限分配相关
const permissionDialogVisible = ref(false)
const permissionsLoaded = ref(false)
const permissionForm = reactive({
  id: 0,
  position: '',
  permissions: [] as string[],
})
const permissions = ref<PermissionItem[]>([])
const permissionTreeRef = ref<any>()
const treeProps = {
  label: 'name',
  children: 'children',
}
const permissionsLoading = ref(false)
const savingPermissions = ref(false)
const permissionUpdatingId = ref(0)

// 权限名称映射表（用于优化性能）
const permissionNameMap = computed(() => {
  return permissions.value.reduce(
    (map, perm) => {
      map[perm.id] = perm.name
      return map
    },
    {} as Record<string, string>,
  )
})

// 获取所有权限列表
const fetchPermissions = async () => {
  if (permissions.value.length > 0) return
  permissionsLoading.value = true
  try {
    const response = await service.get('/api/permissions')
    console.log('权限数据:', response.data)
    permissions.value = response.data || []
    permissionsLoaded.value = true // 权限数据加载完成
  } catch (error) {
    // 错误处理...
  } finally {
    permissionsLoading.value = false
  }
}

// 初始化加载权限列表
onMounted(() => {
  fetchPermissions()
  fetchRoles({ page: currentPage.value, pageSize: pageSize.value })
})

// 根据权限ID获取权限名称
// 修改权限名称获取函数
const getPermissionName = (permissionId: string) => {
  if (!permissionsLoaded.value) return permissionId // 加载中显示 ID
  return permissionNameMap.value[permissionId] || '未知权限'
}

// 根据权限ID获取标签类型
const getPermissionType = (permissionId: string) => {
  if (permissionId.includes('edit')) return 'success'
  if (permissionId.includes('view')) return 'info'
  if (permissionId.includes('system')) return 'danger'
  return 'primary'
}

// 获取行样式（用于权限更新时的视觉反馈）
const getRowClass = ({ row }: { row: RoleItem }) => {
  if (row.id === permissionUpdatingId.value && permissionDialogVisible.value) {
    return 'permission-updating-row'
  }
  return ''
}

// 获取角色列表
const fetchRoles = async (params: { page: number; pageSize: number; search?: string }) => {
  try {
    const response = await service.get('/api/roles', {
      params,
    })
    console.log('角色列表:', response)
    tableData.value = response.data.list || []
    console.log(
      '角色权限ID类型:',
      tableData.value[0]?.permissions?.map((id) => typeof id),
    )
    total.value = response.data.total || 0
  } catch (error) {
    console.error('获取角色列表失败', error)
    ElMessage.error('获取角色列表失败')
  }
}

// 分页相关方法
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchRoles({ page: currentPage.value, pageSize: val, search: searchName.value })
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchRoles({ page: val, pageSize: pageSize.value, search: searchName.value })
}

// 编辑角色
const handleEdit = (row: RoleItem) => {
  dialogVisible.value = true
  formValue.position = row.position
  currentId.value = row.id
  add.value = false
}

// 角色表单验证规则
const rules = reactive({
  position: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度在2-20个字符之间', trigger: 'blur' },
  ],
})

// 分配权限
const handlePremission = async (row: RoleItem) => {
  permissionDialogVisible.value = true
  permissionForm.id = row.id
  permissionForm.position = row.position
  permissionForm.permissions = [...row.permissions]
  permissionUpdatingId.value = row.id

  // 确保权限数据已加载
  if (!permissions.value.length) {
    await fetchPermissions()
  }

  // 延迟执行，确保DOM更新后再操作树组件
  nextTick(() => {
    const tree = permissionTreeRef.value
    if (tree) {
      tree.setCheckedKeys(permissionForm.permissions)
    }
  })
}

// 保存权限分配
const handleSavePermissions = async () => {
  if (savingPermissions.value) return

  const permissionTree = permissionTreeRef.value
  if (!permissionTree) {
    ElMessage.error('权限树加载失败')
    return
  }

  savingPermissions.value = true
  try {
    // 获取选中的权限ID
    const checkedKeys = permissionTree.getCheckedKeys()
    const halfCheckedKeys = permissionTree.getHalfCheckedKeys()
    const allPermissions = [...checkedKeys, ...halfCheckedKeys]

    console.log('保存的权限:', allPermissions)

    // 发送请求保存权限
    const response = await service.put(`/api/roles/${permissionForm.id}/permissions`, {
      permissions: allPermissions,
    })

    if (response.status === 200) {
      ElMessage.success('权限分配成功')

      // 乐观更新（立即更新表格数据）
      const roleIndex = tableData.value.findIndex((role) => role.id === permissionForm.id)
      if (roleIndex !== -1) {
        const updatedRole = {
          ...tableData.value[roleIndex],
          permissions: allPermissions,
          updateTime: new Date().toISOString(), // 更新时间戳，触发视图更新
        }
        tableData.value.splice(roleIndex, 1, updatedRole)
      }

      // 关闭对话框
      permissionDialogVisible.value = false
      permissionUpdatingId.value = 0
    } else {
      ElMessage.error('权限分配失败')
    }
  } catch (error) {
    console.error('保存权限失败', error)
    ElMessage.error('权限分配失败')
  } finally {
    savingPermissions.value = false
  }
}

// 新增角色
const handleAdd = () => {
  add.value = true
  dialogVisible.value = true
  formValue.position = ''
}

// 提交角色表单
const handleFormSubmit = async () => {
  await formRef.value?.validate((valid: boolean) => {
    if (!valid) return false
  })

  try {
    if (add.value) {
      // 新增角色
      const response = await service.post('/api/roles', formValue)
      if (response.status === 200) {
        ElMessage.success('新增角色成功')
        dialogVisible.value = false
        fetchRoles({ page: currentPage.value, pageSize: pageSize.value })
      } else {
        ElMessage.error('新增角色失败')
      }
    } else {
      // 编辑角色
      const response = await service.put(`/api/roles/${currentId.value}`, {
        position: formValue.position,
      })

      if (response.status === 200) {
        ElMessage.success('编辑角色成功')
        dialogVisible.value = false
        fetchRoles({ page: currentPage.value, pageSize: pageSize.value })
      } else {
        ElMessage.error('编辑角色失败')
      }
    }
  } catch (error) {
    console.error('提交失败', error)
    ElMessage.error('提交失败')
  }
}

// 搜索角色
const handleSearch = () => {
  if (searchName.value.trim() === '') {
    return ElMessage.error('请输入搜索内容')
  }
  currentPage.value = 1
  fetchRoles({ page: currentPage.value, pageSize: pageSize.value, search: searchName.value })
}

// 监听搜索框变化
watch(searchName, () => {
  if (searchName.value.trim() === '') {
    fetchRoles({ page: currentPage.value, pageSize: pageSize.value })
  }
})

// 删除角色
const handleRemove = async (row: RoleItem) => {
  try {
    await ElMessageBox.confirm(`确定要删除${row.position}该角色吗?`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
    })

    const response = await service.delete(`/api/roles/${row.id}`)
    if (response.status === 200) {
      fetchRoles({ page: currentPage.value, pageSize: pageSize.value })
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    console.error('删除失败', error)
    ElMessage.error('删除失败')
  }
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
  margin-top: 20px;
}

.permission-loading {
  padding: 20px;
  text-align: center;
}

.permission-updating-row {
  background-color: rgba(245, 247, 250, 0.8);
}
</style>
