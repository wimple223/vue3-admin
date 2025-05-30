<template>
  <el-aside class="el-aside" :width="width">
    <el-menu
      class="el-menu"
      :router="true"
      :collapse="store.state.isCollapse"
      :collapse-transition="false"
      active-text-color="#ffd04b"
      background-color="#333"
      text-color="#fff"
    >
      <h3 class="aside-title" :class="{ 'title-collapse': store.state.isCollapse }">
        <img src="../assets/logo.svg" alt="Logo" width="24px" />
        <span class="title-text">{{ store.state.isCollapse ? '' : 'vue3-admin' }}</span>
      </h3>

      <template v-for="item in menuList" :key="item.path">
        <!-- 有子菜单的情况 -->
        <el-sub-menu v-if="item.children?.length" :index="item.path" popper-append-to-body>
          <template #title>
            <el-icon><component :is="item.icon" /></el-icon>
            <span class="menu-label">{{ item.label }}</span>
          </template>
          <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
            <el-icon><component :is="child.icon" /></el-icon>
            <span class="menu-label">{{ child.label }}</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 无子菜单的情况 -->
        <el-menu-item v-else :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span class="menu-label">{{ item.label }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </el-aside>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw, watchEffect } from 'vue'
import {
  HomeFilled,
  Shop,
  Avatar,
  User,
  Menu as MenuIcon,
  List,
  Lock,
  GoodsFilled,
  MessageBox,
} from '@element-plus/icons-vue'
import { useAllDataStore } from '@/stores'
import { useAuthStore } from '@/stores/modules/auth'
import { useRoute } from 'vue-router'

const store = useAllDataStore()
const authStore = useAuthStore()

// 响应式侧边栏宽度
const width = computed(() => (store.state.isCollapse ? '64px' : '200px'))

// 菜单数据结构
interface MenuItem {
  path: string
  label: string
  icon: any
  children?: MenuItem[]
  redirect?: string
}

// 从authStore获取菜单
const menuList = ref<MenuItem[]>([])

// 注册所有需要的图标
const icons: Record<string, any> = {
  HomeFilled: markRaw(HomeFilled),
  Shop: markRaw(Shop),
  Avatar: markRaw(Avatar),
  User: markRaw(User),
  MenuIcon: markRaw(MenuIcon),
  List: markRaw(List),
  Lock: markRaw(Lock), // 添加缺失的Lock图标
  MessageBox: markRaw(MessageBox), // 添加MessageBox图标
  // 为未找到的图标提供默认图标
  Brand: markRaw(Shop), // 使用Shop作为Brand的替代图标
  lock: markRaw(Lock), // 修复大小写问题
  GoodsFilled: markRaw(GoodsFilled), // 添加缺失的GoodsFilled图标
}

// 监听authStore.menuList的变化
watchEffect(() => {
  // 处理菜单数据，生成完整路径
  menuList.value = authStore.menuList.map((item: any) => {
    const fullPath = item.path

    // 递归处理子菜单，添加父路径前缀
    const children = item.children?.map((child: any) => {
      // 如果子路径不是以/开头，添加父路径前缀
      const childPath = child.path.startsWith('/') ? child.path : `${fullPath}/${child.path}`

      return {
        ...child,
        path: childPath,
        icon: icons[child.icon] || markRaw(Shop), // 默认使用Shop图标
      }
    })

    return {
      ...item,
      path: fullPath,
      icon: icons[item.icon] || markRaw(Shop), // 默认使用Shop图标
      children,
    }
  })

  console.log('处理后的菜单数据:', menuList.value)
})
</script>

<style scoped>
/* 样式部分保持不变 */
.el-aside {
  height: 100vh;
  background: #333;
  transition: width 0.28s;
}

.el-menu {
  border-right: none;
  transition: border-color 0.28s;
}
.el-menu-item {
  padding: 0 20px;
}
.aside-title {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  color: #fff;
  margin: 0;
  transition: all 0.3s;

  img {
    margin-right: 8px;
  }

  &.title-collapse img {
    margin-right: 0;
  }
}

.title-text {
  overflow: hidden;
  white-space: nowrap;
}

.menu-label {
  margin-left: 8px;
  transition: all 0.3s;
}

/* 折叠状态样式 */
.el-menu--collapse {
  .menu-label,
  .el-sub-menu__icon-arrow {
    display: none;
  }

  .el-sub-menu > .el-sub-menu__title {
    padding: 0 16px !important;
  }

  .el-menu-item {
    padding: 0 16px !important;
  }
}
</style>
