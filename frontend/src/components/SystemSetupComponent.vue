<template>
    <div class="system-setup-component">
        <el-card class="setup-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>{{ isInitialized ? '系统参数配置' : '系统初始化' }}</span>
                    <el-tag v-if="isInitialized" type="success" size="small">已初始化</el-tag>
                    <el-tag v-else type="warning" size="small">未初始化</el-tag>
                </div>
            </template>

            <!-- 已初始化状态显示系统参数表单 -->
            <el-form v-if="isInitialized" ref="systemFormRef" :model="systemForm" :rules="rules" label-position="top">
                <el-row :gutter="20">
                    <el-col :md="12" :lg="8">
                        <el-form-item label="安全参数" prop="securityParam">
                            <el-input-number v-model="systemForm.securityParam" :min="128" :max="512" :step="64"
                                style="width: 100%" />
                            <div class="form-item-hint">安全参数影响加密强度，建议使用128位或更高</div>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12" :lg="8">
                        <el-form-item label="密钥大小" prop="keySize">
                            <el-input-number v-model="systemForm.keySize" :min="256" :max="4096" :step="128"
                                style="width: 100%" />
                            <div class="form-item-hint">密钥大小影响安全性和性能，通常为256位</div>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12" :lg="8">
                        <el-form-item label="最大节点数" prop="maxNodes">
                            <el-input-number v-model="systemForm.maxNodes" :min="10" :max="1000" :step="10"
                                style="width: 100%" />
                            <div class="form-item-hint">系统支持的最大边缘节点数量</div>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12" :lg="8">
                        <el-form-item label="最大群组数" prop="maxGroups">
                            <el-input-number v-model="systemForm.maxGroups" :min="1" :max="100" :step="1"
                                style="width: 100%" />
                            <div class="form-item-hint">系统支持的最大群组数量</div>
                        </el-form-item>
                    </el-col>

                    <el-col :span="24">
                        <el-form-item label="系统描述" prop="description">
                            <el-input v-model="systemForm.description" type="textarea" :rows="3"
                                placeholder="请输入系统描述信息" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="24" class="form-actions">
                        <el-button type="primary" @click="updateSystemParams" :loading="loading">
                            更新系统参数
                        </el-button>
                        <el-button type="danger" @click="showInitConfirm" :loading="loading">
                            重新初始化系统
                        </el-button>
                    </el-col>
                </el-row>
            </el-form>

            <!-- 未初始化状态显示初始化表单 -->
            <el-form v-else ref="initFormRef" :model="initForm" :rules="rules" label-position="top">
                <el-alert type="warning" show-icon :closable="false" style="margin-bottom: 20px">
                    <h4>系统尚未初始化</h4>
                    <p>请设置系统参数进行初始化，初始化后将生成系统主密钥和公钥。</p>
                </el-alert>

                <el-row :gutter="20">
                    <el-col :md="12" :lg="8">
                        <el-form-item label="安全参数" prop="securityParam">
                            <el-input-number v-model="initForm.securityParam" :min="128" :max="512" :step="64"
                                style="width: 100%" />
                            <div class="form-item-hint">推荐值: 128</div>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12" :lg="8">
                        <el-form-item label="密钥大小" prop="keySize">
                            <el-input-number v-model="initForm.keySize" :min="256" :max="4096" :step="128"
                                style="width: 100%" />
                            <div class="form-item-hint">推荐值: 256</div>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12" :lg="8">
                        <el-form-item label="最大节点数" prop="maxNodes">
                            <el-input-number v-model="initForm.maxNodes" :min="10" :max="1000" :step="10"
                                style="width: 100%" />
                            <div class="form-item-hint">推荐值: 100</div>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12" :lg="8">
                        <el-form-item label="最大群组数" prop="maxGroups">
                            <el-input-number v-model="initForm.maxGroups" :min="1" :max="100" :step="1"
                                style="width: 100%" />
                            <div class="form-item-hint">推荐值: 20</div>
                        </el-form-item>
                    </el-col>

                    <el-col :span="24">
                        <el-form-item label="系统描述" prop="description">
                            <el-input v-model="initForm.description" type="textarea" :rows="3"
                                placeholder="请输入系统描述信息" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="24" class="form-actions">
                        <el-button type="primary" @click="initializeSystemAction" :loading="loading">
                            初始化系统
                        </el-button>
                    </el-col>
                </el-row>
            </el-form>

            <el-divider content-position="center">系统信息</el-divider>

            <div class="system-info" v-if="isInitialized && systemStore.systemParams">
                <el-descriptions title="当前系统状态" :column="2" border>
                    <el-descriptions-item label="系统ID">
                        {{ systemStore.systemParams.id || '未知' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                        {{ formatDate(systemStore.systemParams.createdAt) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="更新时间">
                        {{ formatDate(systemStore.systemParams.updatedAt) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="公钥状态">
                        <el-tag type="success" v-if="systemStore.systemParams.publicKey">已生成</el-tag>
                        <el-tag type="danger" v-else>未生成</el-tag>
                    </el-descriptions-item>
                </el-descriptions>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineProps } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSystemStore } from '../store/system'
import { initializeSystem } from '../api/system'

const props = defineProps({
    isInitialized: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:isInitialized', 'system-updated'])

const systemStore = useSystemStore()
const loading = ref(false)

// 系统参数表单
const systemForm = reactive({
    securityParam: 128,
    keySize: 256,
    maxNodes: 100,
    maxGroups: 20,
    description: ''
})

// 系统初始化表单
const initForm = reactive({
    securityParam: 128,
    keySize: 256,
    maxNodes: 100,
    maxGroups: 20,
    description: '初始化元数据隐私保护资源分配系统'
})

// 表单验证规则
const rules = {
    securityParam: [
        { required: true, message: '请输入安全参数', trigger: 'blur' },
        { type: 'number', min: 128, max: 512, message: '安全参数必须在128到512之间', trigger: 'blur' }
    ],
    keySize: [
        { required: true, message: '请输入密钥大小', trigger: 'blur' },
        { type: 'number', min: 256, max: 4096, message: '密钥大小必须在256到4096之间', trigger: 'blur' }
    ],
    maxNodes: [
        { required: true, message: '请输入最大节点数', trigger: 'blur' },
        { type: 'number', min: 10, max: 1000, message: '最大节点数必须在10到1000之间', trigger: 'blur' }
    ],
    maxGroups: [
        { required: true, message: '请输入最大群组数', trigger: 'blur' },
        { type: 'number', min: 1, max: 100, message: '最大群组数必须在1到100之间', trigger: 'blur' }
    ]
}

const systemFormRef = ref(null)
const initFormRef = ref(null)

onMounted(async () => {
    loading.value = true
    try {
        await loadSystemParams()
    } catch (error) {
        console.error('获取系统参数失败:', error)
    } finally {
        loading.value = false
    }
})

// 加载系统参数
const loadSystemParams = async () => {
    await systemStore.fetchSystemParams()
    if (systemStore.systemParams) {
        // 复制系统参数到表单
        Object.assign(systemForm, {
            securityParam: systemStore.systemParams.securityParam || 128,
            keySize: systemStore.systemParams.keySize || 256,
            maxNodes: systemStore.systemParams.maxNodes || 100,
            maxGroups: systemStore.systemParams.maxGroups || 20,
            description: systemStore.systemParams.description || ''
        })
        emit('update:isInitialized', true)
    } else {
        emit('update:isInitialized', false)
    }
}

// 更新系统参数
const updateSystemParams = async () => {
    if (!systemFormRef.value) return

    await systemFormRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const success = await systemStore.updateSystemParams(systemForm)
                if (success) {
                    ElMessage({
                        message: '系统参数更新成功',
                        type: 'success'
                    })
                    emit('system-updated')
                }
            } catch (error) {
                console.error('更新系统参数失败:', error)
            } finally {
                loading.value = false
            }
        }
    })
}

// 显示初始化确认对话框
const showInitConfirm = async () => {
    try {
        await ElMessageBox.confirm(
            '重新初始化系统将清除所有数据，包括节点、群组和资源分配信息。此操作不可逆，确定要继续吗？',
            '危险操作',
            {
                confirmButtonText: '确定初始化',
                cancelButtonText: '取消',
                type: 'danger',
                confirmButtonClass: 'el-button--danger'
            }
        )

        // 将当前系统参数复制到初始化表单
        Object.assign(initForm, {
            securityParam: systemForm.securityParam,
            keySize: systemForm.keySize,
            maxNodes: systemForm.maxNodes,
            maxGroups: systemForm.maxGroups,
            description: systemForm.description
        })

        // 执行初始化
        initializeSystemAction()
    } catch {
        // 用户取消操作
    }
}

// 初始化系统
const initializeSystemAction = async () => {
    const formRef = props.isInitialized ? systemFormRef : initFormRef
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            const formData = props.isInitialized ? systemForm : initForm
            loading.value = true
            try {
                const response = await initializeSystem(formData)
                if (response) {
                    ElMessage({
                        message: '系统初始化成功',
                        type: 'success'
                    })

                    // 重新获取系统参数
                    await loadSystemParams()
                    emit('system-updated')
                }
            } catch (error) {
                console.error('初始化系统失败:', error)
            } finally {
                loading.value = false
            }
        }
    })
}

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return '未知'
    const date = new Date(dateString)
    return date.toLocaleString()
}
</script>

<style scoped>
.system-setup-component {
    width: 100%;
}

.setup-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.form-item-hint {
    font-size: 12px;
    color: #909399;
    line-height: 1.2;
    margin-top: 4px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.system-info {
    margin-top: 10px;
}

.el-divider {
    margin: 30px 0;
}
</style>
