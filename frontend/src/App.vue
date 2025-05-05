<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentRoute = ref('')
const isDevelopment = ref(import.meta.env.MODE !== 'production')

// 监听路由变化
function handleRouteChange() {
  // 开发环境下才输出调试信息
  if (isDevelopment.value) {
    console.log(`路由切换到: ${router.currentRoute.value.path}`)
  }

  currentRoute.value = router.currentRoute.value.path
}

onMounted(() => {
  console.log('App.vue 组件已挂载')
  handleRouteChange()

  // 添加路由变化监听器
  router.beforeEach((to, from, next) => {
    next()
  })

  router.afterEach(() => {
    handleRouteChange()
  })
})

onBeforeUnmount(() => {
  console.log('App.vue 组件将卸载')
})
</script>

<template>
  <div class="app-root">
    <div v-if="isDevelopment" class="debug-info">
      当前路由: {{ currentRoute }}
    </div>
    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
}

.debug-info {
  position: fixed;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  font-size: 12px;
  z-index: 9999;
}
</style>
