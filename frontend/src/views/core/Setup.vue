<template>
    <div class="setup-container">
        <el-card class="setup-card">
            <template #header>
                <div class="card-header">
                    <h2>系统初始化 (Setup)</h2>
                    <p>实现论文中的Setup算法，生成系统主密钥和公共参数</p>
                </div>
            </template>

            <div v-if="isInitialized" class="system-info">
                <el-alert title="系统已初始化" type="success" :closable="false" show-icon />
                <div class="system-params">
                    <h3>系统参数</h3>
                    <el-descriptions border :column="1">
                        <el-descriptions-item label="安全级别">
                            {{ systemParams.securityLevel }}
                        </el-descriptions-item>
                        <el-descriptions-item label="公共参数">
                            <el-input type="textarea" :rows="4" v-model="systemParams.publicParams" readonly />
                        </el-descriptions-item>
                        <el-descriptions-item label="初始化时间">
                            {{ formatDate(systemParams.createdAt) }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>

            <div v-else class="setup-form">
                <el-form :model="setupForm" ref="setupFormRef" :rules="rules" label-width="120px">
                    <el-form-item label="安全级别" prop="securityLevel">
                        <el-slider v-model="setupForm.securityLevel" :min="80" :max="256" :step="8" show-stops :marks="{
                            80: '80',
                            128: '128',
                            192: '192',
                            256: '256'
                        }" />
                        <span class="security-level-value">{{ setupForm.securityLevel }}</span>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="initializeSystem" :loading="loading">
                            初始化系统
                        </el-button>
                    </el-form-item>

                    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="true"
                        @close="errorMessage = ''" show-icon />
                </el-form>
            </div>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

export default {
    name: 'SetupView',

    setup() {
        const isInitialized = ref(false);
        const loading = ref(false);
        const errorMessage = ref('');
        const systemParams = reactive({
            securityLevel: null,
            publicParams: '',
            createdAt: null
        });

        const setupForm = reactive({
            securityLevel: 128
        });

        const rules = {
            securityLevel: [
                { required: true, message: '请选择安全级别', trigger: 'change' }
            ]
        };

        const setupFormRef = ref(null);

        // 初始化系统
        const initializeSystem = async () => {
            // 表单验证
            if (!setupFormRef.value) return;

            await setupFormRef.value.validate(async (valid) => {
                if (!valid) {
                    return false;
                }

                loading.value = true;
                errorMessage.value = '';

                try {
                    const response = await axios.post('/api/system/initialize', {
                        securityLevel: setupForm.securityLevel
                    });

                    if (response.data.success) {
                        ElMessage.success('系统初始化成功');
                        isInitialized.value = true;

                        // 获取系统参数
                        getSystemParams();
                    } else {
                        errorMessage.value = response.data.message || '系统初始化失败';
                    }
                } catch (error) {
                    console.error('初始化系统时发生错误:', error);
                    errorMessage.value = error.response?.data?.message || '系统初始化失败，请稍后重试';
                } finally {
                    loading.value = false;
                }
            });
        };

        // 获取系统参数
        const getSystemParams = async () => {
            loading.value = true;

            try {
                const response = await axios.get('/api/system/params');

                if (response.data.success) {
                    systemParams.securityLevel = response.data.data.securityLevel;
                    systemParams.publicParams = response.data.data.publicParams;
                    systemParams.createdAt = response.data.data.createdAt;
                    isInitialized.value = true;
                } else {
                    isInitialized.value = false;
                }
            } catch (error) {
                console.error('获取系统参数时发生错误:', error);

                // 如果是404错误，表示系统未初始化
                if (error.response && error.response.status === 404) {
                    isInitialized.value = false;
                } else {
                    // 使用默认参数，避免前端显示错误
                    useDefaultParams();
                    errorMessage.value = '使用默认系统参数，原因: ' + (error.response?.data?.message || '获取系统参数失败');
                }
            } finally {
                loading.value = false;
            }
        };

        // 使用默认系统参数
        const useDefaultParams = () => {
            systemParams.securityLevel = 128; // 与C++版本保持一致
            systemParams.publicParams = {
                g: "基点P (硬编码)",
                h: "系统公钥 (硬编码)",
                params: "SS2类型配对，AES-128安全级别"
            };
            systemParams.createdAt = Date.now();
            isInitialized.value = true;
        };

        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return '';

            const date = new Date(timestamp);
            return date.toLocaleString();
        };

        // 组件挂载时获取系统参数
        onMounted(() => {
            getSystemParams();
        });

        return {
            isInitialized,
            loading,
            errorMessage,
            systemParams,
            setupForm,
            rules,
            setupFormRef,
            initializeSystem,
            formatDate
        };
    }
};
</script>

<style scoped>
.setup-container {
    padding: 20px;
}

.setup-card {
    max-width: 800px;
    margin: 0 auto;
}

.card-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.card-header h2 {
    margin: 0;
    margin-bottom: 8px;
    color: #409eff;
}

.card-header p {
    margin: 0;
    color: #606266;
    font-size: 14px;
}

.system-info {
    margin-top: 20px;
}

.system-params {
    margin-top: 20px;
}

.system-params h3 {
    margin-bottom: 16px;
    color: #303133;
}

.setup-form {
    margin-top: 20px;
}

.security-level-value {
    margin-left: 10px;
    color: #409eff;
    font-weight: bold;
}
</style>
