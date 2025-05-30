import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteMockServe } from 'vite-plugin-mock'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {}, // 开发环境清空代理配置
  },
  plugins: [
    vue(),
    vueDevTools(),
    viteMockServe({
      mockPath: 'src/mock', // mock文件目录
      enable: true, // 全局启用（可根据环境动态配置）
      logger: true, // 控制台显示请求日志
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
