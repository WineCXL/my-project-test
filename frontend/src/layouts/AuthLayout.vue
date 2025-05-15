<template>
    <div class="auth-layout">
        <div class="auth-background"></div>
        <div class="auth-container">
            <div class="auth-logo">
                <el-icon class="logo-icon">
                    <Lock />
                </el-icon>
                <h1>元数据隐私保护资源分配系统</h1>
            </div>

            <router-view />

            <div class="auth-footer">
                <p>© 2025 元数据隐私保护资源分配系统</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Lock } from '@element-plus/icons-vue'
</script>

<style scoped>
.auth-layout {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
}

.auth-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #304156 0%, #3a71a8 100%);
    z-index: -1;
}

.auth-background::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
}

.auth-container {
    width: 100%;
    max-width: 500px;
    text-align: center;
    z-index: 1;
    padding: 20px;
}

.auth-logo {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.logo-icon {
    font-size: 36px;
    color: #fff;
    background-color: #409eff;
    border-radius: 50%;
    padding: 12px;
    margin-bottom: 16px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.auth-logo h1 {
    font-size: 24px;
    color: white;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.auth-footer {
    margin-top: 30px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
}
</style>
