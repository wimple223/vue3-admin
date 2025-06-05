<template>
  <div class="main-container">
    <div class="body-container">
      <el-form
        class="login-container"
        :rules="rules"
        :model="loginForm"
        ref="loginFormRef"
        @keyup.enter="handleLogin"
      >
        <h1 class="title">欢迎登录</h1>

        <!-- 用户名输入 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <!-- 密码输入 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <!-- 登录按钮 -->
        <el-button
          type="primary"
          class="login-btn"
          :loading="authStore.isLoading"
          @click="handleLogin"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? '登录中...' : '立即登录' }}
          <el-icon v-show="!authStore.isLoading" class="arrow">
            <ArrowRight />
          </el-icon>
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, ArrowRight } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import service from '@/api/request'
import { useRouter } from 'vue-router'
const router = useRouter()

const authStore = useAuthStore()

// 表单实例
const loginFormRef = ref<FormInstance>()

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
})

// 验证规则增强
const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      min: 5,
      message: '用户名长度为5个字符',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      min: 6,

      message: '密码长度至少6个字符',
      trigger: 'blur',
    },
  ],
})

// 登录处理逻辑优化
const handleLogin = async () => {
  try {
    // 表单验证
    await loginFormRef.value?.validate()

    // 执行登录并等待结果
    const success = await authStore.login(loginForm.username, loginForm.password)
    console.log(router.getRoutes())
    if (success) {
      
    } else {
      ElMessage.error('登录失败')
    }
  } catch (error: any) {
    // 精准错误处理
    const errorMessage = error.message || '登录请求失败'
    if (error?.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error(errorMessage)
    }
  }
}
</script>

<style scoped lang="scss">
.main-container {
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 10%, #2a5298 100%);

  display: flex;
  justify-content: flex-end;
}

.body-container {
  width: 100%;
  max-width: 1440px;
  height: 100%;
  background-image: url('@/assets/login-bg.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.login-container {
  width: 420px;
  padding: 40px;

  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);

  .title {
    margin-bottom: 30px;
    font-size: 24px;
    color: #2c3e50;
    text-align: center;
    font-weight: 600;
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  margin-top: 24px;
  font-size: 16px;
  transition: all 0.3s ease;
  letter-spacing: 2px;

  .arrow {
    margin-left: 8px;
    transition: transform 0.3s ease;
  }

  &:not([disabled]):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    .arrow {
      transform: translateX(4px);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .body-container {
    justify-content: center;
    padding: 20px;
  }

  .login-container {
    width: 100%;
    margin: 0;
    padding: 30px 20px;
  }
}

@media (max-width: 480px) {
  .login-container {
    .title {
      font-size: 20px;
    }
  }

  .login-btn {
    height: 44px;
    font-size: 14px;
  }
}
</style>
