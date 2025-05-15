<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
    console.log('登录状态检查组件已加载')
    console.log('当前登录状态:', userStore.isLoggedIn ? '已登录' : '未登录')

    // 如果已登录，重定向到仪表盘
    if (userStore.isLoggedIn) {
        console.log('检测到已登录，重定向到仪表板')
        router.replace('/app/dashboard')
    } else {
        console.log('未检测到登录状态，重定向到登录页')
        router.replace('/auth/login')
    }
})
</script>

<template>
    <div class="auth-checker">
        <div class="loader">
            <span>检查登录状态中...</span>
        </div>
    </div>
</template>

<style scoped>
.auth-checker {
    height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f7fa;
}

.loader {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.loader span {
    margin-top: 20px;
    color: #606266;
    font-size: 16px;
}
</style>
