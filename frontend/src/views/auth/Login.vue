<template>
    <div class="login-container">
        <el-card class="login-card" shadow="always">
            <template #header>
                <div class="card-header">
                    <h2>系统登录</h2>
                    <p>元数据隐私保护资源分配系统</p>
                </div>
            </template>

            <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" :clearable="true"
                        autocomplete="off" @keyup.enter="handleLogin" />
                </el-form-item>

                <el-form-item label="密码" prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock"
                        show-password autocomplete="off" @keyup.enter="handleLogin" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">
                        {{ loading ? '登录中...' : '登 录' }}
                    </el-button>
                </el-form-item>
            </el-form>

            <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="true" @close="errorMessage = ''"
                show-icon />

            <div class="login-footer">
                <p>推荐使用Chrome、Edge等现代浏览器</p>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useUserStore } from '../../store/user';

const router = useRouter();
const userStore = useUserStore();
const loginFormRef = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const isDevelopment = ref(import.meta.env.MODE !== 'production');

const loginForm = reactive({
    username: '',
    password: ''
});

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
    ]
};

const handleLogin = async () => {
    if (!loginFormRef.value) return;

    await loginFormRef.value.validate(async (valid) => {
        if (!valid) {
            return false;
        }

        loading.value = true;
        errorMessage.value = '';

        try {
            // 使用store的登录方法
            const success = await userStore.login(loginForm, false);

            if (!success) {
                errorMessage.value = '登录失败，请检查用户名和密码';
            }
        } catch (error) {
            console.error('登录时发生错误:', error);
            errorMessage.value = error.response?.data?.message || '登录失败，请稍后重试';
        } finally {
            loading.value = false;
        }
    });
};

function goToDirectTest() {
    ElMessage.info('测试页面已不存在');
}

</script>

<style scoped>
.login-container {
    width: 100%;
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-card {
    width: 400px;
    max-width: 100%;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    transition: all 0.3s ease;
}

.login-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.card-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
}

.card-header h2 {
    margin: 0;
    margin-bottom: 8px;
    color: #409eff;
    font-weight: 600;
    font-size: 24px;
}

.card-header p {
    margin: 0;
    color: #606266;
    font-size: 14px;
}

:deep(.el-form-item__label) {
    font-weight: 500;
}

:deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #409eff inset;
}

.login-button {
    width: 100%;
    height: 44px;
    font-size: 16px;
    letter-spacing: 4px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.login-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(64, 158, 255, 0.3);
}


.register-link {
    color: #409eff;
    text-decoration: none;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
}

.register-link:hover {
    color: #66b1ff;
    transform: translateX(3px);
}

.register-icon {
    margin-right: 4px;
    font-size: 14px;
}

.login-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 12px;
    color: #909399;
}

@media (max-width: 576px) {
    .login-card {
        width: 100%;
    }
}
</style>
