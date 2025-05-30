<template>
  <div class="common-layout">
    <el-container class="lay-container">
      <common-aside></common-aside>

      <el-container>
        <el-header class="el-header">
          <common-header></common-header>
        </el-header>
        <common-tag></common-tag>
        <el-main class="el-main">
          <!-- 修复：使用插槽语法正确包裹 keep-alive -->
          <router-view v-slot="{ Component }">
            <keep-alive :include="menuList">
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
<script lang="ts" setup>
import CommonAside from '@/components/CommonAside.vue'
import CommonHeader from '@/components/CommonHeader.vue'
import CommonTag from '@/components/CommonTag.vue'
import { ref } from 'vue'
const menuList = ref(['Home', 'Role', 'User', 'Menu', 'Brand', 'Goods'])
</script>

<style scoped>
.common-layout {
  height: 100vh; /* 关键：视口高度 */
  display: flex;
}

.lay-container {
  flex: 1;
  min-height: 0; /* 解决flex容器溢出问题 */
}

.el-header {
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.el-main {
  padding: 20px;
  background: #f5f7fa;
}
</style>
