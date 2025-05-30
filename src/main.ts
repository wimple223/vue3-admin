import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/modules/auth'

const app = createApp(App)
app.use(ElementPlus)
app.use(createPinia())

const initApp = async () => {
  const authStore = useAuthStore()
  await authStore.initAppRoutes()

  app.use(router)
  app.mount('#app')
}

initApp().catch((error) => {
  console.error('初始化应用失败:', error)
})
