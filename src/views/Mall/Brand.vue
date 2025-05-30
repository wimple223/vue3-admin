<template>
  <el-col>
    <el-card>
      <el-button type="primary">
        <el-icon><Plus /></el-icon>
        添加品牌</el-button
      >
      <el-table>
        <el-table-column prop="name" label="序号"></el-table-column>
        <el-table-column prop="name" label="品牌名称"></el-table-column>
        <el-table-column prop="name" label="品牌LOGO"></el-table-column>
        <el-table-column prop="name" label="品牌LOGOO"></el-table-column>
        <el-table-column prop="name" label="创建时间"></el-table-column>
        <el-table-column prop="name" label="操作">
          <el-button type="text">编辑</el-button>
          <el-button type="text">删除</el-button>
        </el-table-column>
      </el-table>
    </el-card>
  </el-col>
</template>
<script lang="ts" setup>
import { Plus } from '@element-plus/icons-vue'
</script>
<style lang="scss" scoped></style>
