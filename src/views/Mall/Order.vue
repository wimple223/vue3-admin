<template>
  <el-col>
    <el-card>
      <el-dialog v-model="dialogVisible" title="订单信息">
        <el-form :model="formValue">
          <el-form-item label="订单号"
            ><el-input v-model="formValue.id" disabled></el-input
          ></el-form-item>
          <el-form-item label="下单用户">
            <el-input v-model="formValue.customerName" disabled></el-input
          ></el-form-item>
          <el-form-item label="订单地址"
            ><el-input v-model="formValue.shippingAddress" disabled></el-input>
          </el-form-item> 
          <el-form-item label="订单状态"
            ><el-input v-model="formValue.statusText" disabled></el-input>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-input v-model="formValue.createTime" disabled></el-input
          ></el-form-item>

          <el-form-item></el-form-item>
        </el-form>
      </el-dialog>
      <el-table :data="tableData">
        <el-table-column prop="id" label="订单号"></el-table-column>

        <el-table-column prop="customerName" label="用户名称"></el-table-column>
        <el-table-column prop="createTime" label="创建时间"></el-table-column>

        <el-table-column prop="statusText" label="状态"></el-table-column>

        <el-table-column prop="name" label="操作">
          <template #default="scope">
            <el-button type="primary" @click="handleViewDetail(scope.row)">查看详情</el-button>
            <el-button type="danger" @click="handleRemove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-col class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[6, 10, 20, 30, 50]"
          :page-size="pageSize"
          layout="prev, pager, next, jumper"
          :total="total"
          class="pagination-container"
        >
        </el-pagination>
      </el-col>
    </el-card>
  </el-col>
</template>
<script lang="ts" setup>
import service from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

import { onMounted, ref } from 'vue'
const tableData = ref([])
const total = ref(0)
const pageSize = ref(10)
const dialogVisible = ref(false)
const currentPage = ref(1)
const formValue = ref({
  id: '',
  customerName: '',
  createTime: '',
  statusText: '',
  name: '',
  shippingAddress: '',
})
const fetchOrder = async (params: { page: number; pageSize: number }) => {
  const res = await service.get('/api/orders', { params })
  tableData.value = res.data.list
  total.value = res.data.total
  console.log(res)
}
const search = ref('')
const handleSearch = () => {}
const handleSizeChange = (size: number) => {
  pageSize.value = size

  fetchOrder({ page: currentPage.value, pageSize: pageSize.value })
}
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchOrder({ page: currentPage.value, pageSize: pageSize.value })
}

fetchOrder({ page: currentPage.value, pageSize: pageSize.value })
const handleViewDetail = (row: any) => {
  dialogVisible.value = true
  const res = service.get(`/api/orders/${row.id}`)
  formValue.value = { ...row }
  console.log(res)
}
const handleRemove = async (row: any) => {
  await ElMessageBox.confirm('确定删除该订单吗？', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error',
  })
  try {
    await service.delete(`/api/orders/${row.id}`)
    ElMessage.success('删除成功')
    fetchOrder({ page: currentPage.value, pageSize: pageSize.value })
  } catch (error) {
    ElMessage.success('删除失败')
    console.error(error)
  }
}
onMounted(() => {
  fetchOrder({ page: currentPage.value, pageSize: pageSize.value })
})
</script>
<style lang="scss" scoped>
.pagination-container {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}
.search-container {
  display: flex;
  justify-content: space-between;
}
</style>
