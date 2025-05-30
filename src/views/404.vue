<template>
  <div class="not-found">
    <!-- 可以在这里添加404页面的具体内容 -->
  </div>
</template>

<script setup lang="ts">
// 可以在这里添加script逻辑，比如导航到首页的按钮点击事件等
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100vh; /* 使用视口高度代替100%，以确保元素高度正确 */
  align-items: center;
  background-image: url(@/assets/404.png);
  background-size: cover; /* 确保背景图片覆盖整个元素 */
  background-position: center; /* 将背景图片居中 */
  flex-direction: column; /* 如果需要垂直排列子元素 */
}
.text {
  position: absolute;
  color: black;
  top: 50%;
  left: 40%;
}
</style>
