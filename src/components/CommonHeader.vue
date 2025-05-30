<template>
  <div class="header">
    <div class="l-container">
      <el-button class="collapse-btn" @click="handleCollapse">
        <el-icon>
          <component :is="Grid"></component>
        </el-icon>
      </el-button>
      <el-breadcrumb :separator-icon="ArrowRight" class="breadcrumb">
        <el-breadcrumb-item
          v-for="(item, index) in route.matched"
          :to="item.meta.disabled ? item.redirect : item.path"
          class="breadcrumb-item"
          v-show="route.matched.length > 1"
          >{{ item.meta.title }}</el-breadcrumb-item
        >
      </el-breadcrumb>
    </div>
    <div class="r-container">
      <el-dropdown>
        <span class="el-dropdown-link">
          <el-avatar
            :size="50"
            src="https://foruda.gitee.com/images/1723603502796844527/03cdca2a_716974.gif?imageView2/1/w/80/h/80"
            class="avatar-img"
          ></el-avatar>
          <span class="avatar-name">admin</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item @click="loginOut">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ArrowRight, Grid } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useAllDataStore } from '@/stores'
import { useAuthStore } from '@/stores/modules/auth'
import router from '@/router'
import { useRoute } from 'vue-router'
const route = useRoute()
const store = useAllDataStore()
const authStore = useAuthStore()
console.log(route.matched)

const handleCollapse = () => {
  store.state.isCollapse = !store.state.isCollapse
}
console.log('route.matched', route.matched)

const loginOut = () => {
  authStore.logout()
  router.push('/login')
}
const menuList = authStore.menuList
</script>
<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 0, 20px;
}
.l-container {
  display: flex;
  align-items: center;
}
.collapse-btn {
  border: none;
  padding: 0;
  margin-left: -8px;
  width: 25px;
}
.r-container {
  display: flex;
  align-items: center;
}
.avatar-name {
  position: relative;
  top: -18px;
  left: 5px;
  text-align: center;
}
:deep(.el-dropdown-menu) {
  border: none !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
.breadcrumb {
  margin-left: 20px;
}
.breadcrumb-item {
  cursor: pointer;
}
</style>
