<template>
    <div class="resource-allocation-component">
        <el-card class="mt-20">
            <template #header>
                <div class="card-header">
                    <div class="search-refresh">
                        <el-input v-model="searchQuery" placeholder="搜索资源分配" class="search-input" clearable>
                            <template #prefix>
                                <el-icon>
                                    <Search />
                                </el-icon>
                            </template>
                        </el-input>
                        <el-button type="info" @click="refreshAllData" :loading="refreshing">
                            <el-icon>
                                <Refresh />
                            </el-icon> 刷新
                        </el-button>
                    </div>

                    <div>
                        <el-button type="primary" @click="handleCreateResource">
                            <el-icon>
                                <Plus />
                            </el-icon> 创建资源分配
                        </el-button>
                        <el-button type="success" @click="handleAutoAllocation" :loading="autoAllocateLoading">
                            <el-icon>
                                <Connection />
                            </el-icon> 自动分配资源
                        </el-button>
                    </div>
                </div>
            </template>

            <el-tabs v-model="activeTab">
                <el-tab-pane label="待分配资源" name="pending">
                    <el-alert v-if="pendingResources.length > 0 && idleGroupsCount === 0" title="当前没有空闲节点组"
                        type="warning" :closable="false" description="系统将在节点组空闲时自动分配资源，或者您可以点击'自动分配资源'按钮尝试手动触发分配。"
                        show-icon class="mb-20" />

                    <el-table :data="pendingResources" style="width: 100%" border stripe v-loading="loading.pending">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="title" label="标题" min-width="180" />
                        <el-table-column label="关键词" min-width="120">
                            <template #default="{ row }">
                                {{ formatKeywords(row.keywords) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="120">
                            <template #default="{ row }">
                                <el-tag type="info">等待中</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="创建时间" min-width="150">
                            <template #default="{ row }">
                                {{ formatDateTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="220" fixed="right">
                            <template #default="{ row }">
                                <el-button-group>
                                    <el-button type="primary" size="small" @click="handleViewResource(row)">
                                        <el-icon>
                                            <View />
                                        </el-icon> 查看
                                    </el-button>
                                    <el-button type="success" size="small" @click="handleAllocateSingle(row)"
                                        :disabled="idleGroupsCount === 0">
                                        分配
                                    </el-button>
                                    <el-button type="danger" size="small" @click="handleDeleteResource(row)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty v-if="pendingResources.length === 0" description="暂无待分配资源" />
                </el-tab-pane>

                <el-tab-pane label="执行中资源" name="executing">
                    <el-table :data="executingResources" style="width: 100%" border stripe
                        v-loading="loading.executing">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="title" label="标题" min-width="180" />
                        <el-table-column label="分配群组" min-width="120">
                            <template #default="{ row }">
                                <el-tag type="success" v-if="row.Group">
                                    {{ row.Group.groupName }}
                                </el-tag>
                                <el-tag type="info" v-else>未分配</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="120">
                            <template #default="{ row }">
                                <el-tag type="warning">执行中</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="剩余时间" width="120">
                            <template #default="{ row }">
                                <countdown-timer :start-time="row.updatedAt" :duration="120"
                                    @timeout="refreshAllData(false)" />
                            </template>
                        </el-table-column>
                        <el-table-column label="开始时间" min-width="150">
                            <template #default="{ row }">
                                {{ formatDateTime(row.updatedAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="180" fixed="right">
                            <template #default="{ row }">
                                <el-button-group>
                                    <el-button type="primary" size="small" @click="handleViewResource(row)">
                                        <el-icon>
                                            <View />
                                        </el-icon> 查看
                                    </el-button>
                                    <el-button type="success" size="small" @click="handleCompleteResource(row)">
                                        完成
                                    </el-button>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty v-if="executingResources.length === 0" description="暂无执行中资源" />
                </el-tab-pane>

                <el-tab-pane label="已完成资源" name="completed">
                    <el-table :data="completedResources" style="width: 100%" border stripe
                        v-loading="loading.completed">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="title" label="标题" min-width="180" />
                        <el-table-column label="处理群组" min-width="120">
                            <template #default="{ row }">
                                <el-tag type="success" v-if="row.Group">
                                    {{ row.Group.groupName }}
                                </el-tag>
                                <el-tag type="info" v-else>未知</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="120">
                            <template #default="{ row }">
                                <el-tag type="success">已完成</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="完成时间" min-width="150">
                            <template #default="{ row }">
                                {{ formatDateTime(row.updatedAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" fixed="right">
                            <template #default="{ row }">
                                <el-button type="primary" size="small" @click="handleViewResource(row)">
                                    <el-icon>
                                        <View />
                                    </el-icon> 查看
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty v-if="completedResources.length === 0" description="暂无已完成资源" />
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <!-- 创建资源分配对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%" :close-on-click-modal="false">
            <el-form ref="resourceFormRef" :model="resourceForm" :rules="rules" label-position="top">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="resourceForm.title" placeholder="请输入资源标题" />
                </el-form-item>

                <el-form-item label="内容" prop="content">
                    <el-input v-model="resourceForm.content" type="textarea" :rows="8" placeholder="请输入资源内容" />
                </el-form-item>

                <el-form-item label="关键词" prop="keywords">
                    <el-input v-model="resourceForm.keywords" placeholder="多个关键词用逗号分隔" />
                    <div class="form-hint">多个关键词请用逗号分隔，如：边缘计算,资源分配,安全</div>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitResourceForm" :loading="submitLoading">确定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 资源详情对话框 -->
        <el-dialog v-model="detailsVisible" title="资源详情" width="70%">
            <el-descriptions :column="2" border v-if="currentResource">
                <el-descriptions-item label="ID">{{ currentResource.id }}</el-descriptions-item>
                <el-descriptions-item label="标题">{{ currentResource.title }}</el-descriptions-item>
                <el-descriptions-item label="关键词">{{ formatKeywords(currentResource.keywords) }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(currentResource.status)">
                        {{ getStatusText(currentResource.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item
                    label="创建时间">{{ formatDateTime(currentResource.createdAt) }}</el-descriptions-item>
                <el-descriptions-item
                    label="更新时间">{{ formatDateTime(currentResource.updatedAt) }}</el-descriptions-item>
                <el-descriptions-item label="分配节点组" v-if="currentResource.groupId">
                    {{ getGroupName(currentResource.groupId) }}
                </el-descriptions-item>
                <el-descriptions-item label="内容" :span="2">
                    <div class="resource-content">{{ currentResource.content }}</div>
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useGroupStore } from '../store/group'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import {
    Search,
    Plus,
    Edit,
    Delete,
    View,
    Check,
    Refresh,
    Connection
} from '@element-plus/icons-vue'
import CountdownTimer from './CountdownTimer.vue'

// 数据加载状态
const loading = reactive({
    pending: false,
    executing: false,
    completed: false
})

const submitLoading = ref(false)
const autoAllocateLoading = ref(false)
const refreshing = ref(false)
const dialogVisible = ref(false)
const detailsVisible = ref(false)
const dialogTitle = ref('创建资源分配')
const searchQuery = ref('')
const activeTab = ref('pending')

// 资源数据
const pendingResources = ref([])
const executingResources = ref([])
const completedResources = ref([])
const currentResource = ref(null)
const groupStore = useGroupStore()

// 表单数据
const resourceForm = reactive({
    title: '',
    content: '',
    keywords: ''
})

// 表单验证规则
const rules = {
    title: [
        { required: true, message: '请输入资源标题', trigger: 'blur' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符之间', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入资源内容', trigger: 'blur' }
    ]
}

const resourceFormRef = ref(null)

// 计算空闲节点组数量
const idleGroupsCount = computed(() => {
    return groupStore.groups.filter(group => group.status === 'idle').length
})

// 监听tab切换，加载相应数据
watch(activeTab, (newValue) => {
    if (newValue === 'pending') {
        fetchPendingResources()
    } else if (newValue === 'executing') {
        fetchExecutingResources()
    } else if (newValue === 'completed') {
        fetchCompletedResources()
    }
})

// 自动刷新定时器
let autoRefreshTimer = null

// 在script部分添加这些变量和函数
const lastRefreshTime = ref(new Date());
const prevExecutingCount = ref(0);
const prevCompletedCount = ref(0);

// 初始化
onMounted(async () => {
    // 加载群组数据
    await groupStore.fetchGroups()

    // 加载待处理资源
    await refreshAllData()

    // 设置自动刷新 (每30秒)
    autoRefreshTimer = setInterval(() => {
        refreshAllData(false) // 静默刷新，不显示加载指示器
    }, 30000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
    }
})

// 刷新所有数据
const refreshAllData = async (showLoading = true) => {
    if (showLoading) {
        refreshing.value = true
    }

    try {
        await groupStore.fetchGroups()

        // 保存刷新前的计数
        prevExecutingCount.value = executingResources.value.length;
        prevCompletedCount.value = completedResources.value.length;

        // 根据当前激活的标签页加载数据
        if (activeTab.value === 'pending') {
            await fetchPendingResources()
        } else if (activeTab.value === 'executing') {
            await fetchExecutingResources()
        } else if (activeTab.value === 'completed') {
            await fetchCompletedResources()
        }

        // 检测状态变化并显示通知
        checkStatusChanges();

        // 更新最后刷新时间
        lastRefreshTime.value = new Date();
    } catch (error) {
        console.error('刷新数据失败:', error)
        if (showLoading) {
            ElMessage.error('刷新数据失败')
        }
    } finally {
        if (showLoading) {
            refreshing.value = false
        }
    }
}

// 获取待分配资源
const fetchPendingResources = async () => {
    loading.pending = true
    try {
        const response = await axios.get('/api/resources/pending')
        pendingResources.value = response.data.data || []
    } catch (error) {
        console.error('获取待分配资源失败:', error)
        ElMessage.error('获取待分配资源失败')
    } finally {
        loading.pending = false
    }
}

// 获取执行中资源
const fetchExecutingResources = async () => {
    loading.executing = true
    try {
        const response = await axios.get('/api/resources/executing')
        executingResources.value = response.data.data || []
    } catch (error) {
        console.error('获取执行中资源失败:', error)
        ElMessage.error('获取执行中资源失败')
    } finally {
        loading.executing = false
    }
}

// 获取已完成资源
const fetchCompletedResources = async () => {
    loading.completed = true
    try {
        const response = await axios.get('/api/resources/completed')
        completedResources.value = response.data.data || []
    } catch (error) {
        console.error('获取已完成资源失败:', error)
        ElMessage.error('获取已完成资源失败')
    } finally {
        loading.completed = false
    }
}

// 打开创建资源对话框
const handleCreateResource = () => {
    resetResourceForm()
    dialogTitle.value = '创建资源分配'
    dialogVisible.value = true
}

// 查看资源详情
const handleViewResource = (resource) => {
    currentResource.value = resource
    detailsVisible.value = true
}

// 删除资源
const handleDeleteResource = (resource) => {
    ElMessageBox.confirm(
        `确定要删除资源 "${resource.title}" 吗？`,
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        try {
            await axios.delete(`/api/resources/document/${resource.id}`)
            ElMessage.success('资源删除成功')
            refreshAllData()
        } catch (error) {
            console.error('删除资源失败:', error)
            ElMessage.error('删除资源失败')
        }
    }).catch(() => {
        // 用户取消
    })
}

// 手动分配单个资源
const handleAllocateSingle = async (resource) => {
    if (idleGroupsCount.value === 0) {
        ElMessage.warning('当前没有空闲节点组，无法分配资源')
        return
    }

    try {
        const response = await axios.post(`/api/resources/allocate-single/${resource.id}`)

        if (response.data.success) {
            ElMessage.success('资源分配成功')
            refreshAllData()
        } else {
            ElMessage.warning(response.data.message || '资源分配失败，没有可用的空闲节点组')
        }
    } catch (error) {
        console.error('资源分配失败:', error)
        ElMessage.error(error.response?.data?.message || '资源分配失败')
    }
}

// 自动分配所有待处理资源
const handleAutoAllocation = async () => {
    if (pendingResources.value.length === 0) {
        ElMessage.info('没有待分配的资源')
        return
    }

    if (idleGroupsCount.value === 0) {
        ElMessage.warning('当前没有空闲节点组，无法分配资源')
        return
    }

    autoAllocateLoading.value = true
    try {
        const response = await axios.post('/api/resources/auto-allocate')

        ElMessage.success(`自动分配成功：${response.data.data?.allocated || 0}个资源已分配`)
        refreshAllData()
    } catch (error) {
        console.error('自动分配失败:', error)
        ElMessage.error(error.response?.data?.message || '自动分配失败')
    } finally {
        autoAllocateLoading.value = false
    }
}

// 手动完成资源处理
const handleCompleteResource = (resource) => {
    ElMessageBox.confirm(
        `确定要将资源 "${resource.title}" 标记为已完成吗？`,
        '完成确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
        }
    ).then(async () => {
        try {
            await axios.post(`/api/resources/document/${resource.id}/complete`)
            ElMessage.success('资源已标记为完成')
            refreshAllData()
        } catch (error) {
            console.error('完成资源处理失败:', error)
            ElMessage.error(error.response?.data?.message || '完成资源处理失败')
        }
    }).catch(() => {
        // 用户取消
    })
}

// 提交资源表单
const submitResourceForm = async () => {
    if (!resourceFormRef.value) return

    await resourceFormRef.value.validate(async (valid) => {
        if (valid) {
            submitLoading.value = true
            try {
                const response = await axios.post('/api/resources/document', {
                    title: resourceForm.title,
                    content: resourceForm.content,
                    keywords: resourceForm.keywords
                })

                ElMessage.success('资源创建成功')
                dialogVisible.value = false
                refreshAllData()
            } catch (error) {
                console.error('创建资源失败:', error)
                ElMessage.error(error.response?.data?.message || '创建资源失败')
            } finally {
                submitLoading.value = false
            }
        }
    })
}

// 重置资源表单
const resetResourceForm = () => {
    resourceForm.title = ''
    resourceForm.content = ''
    resourceForm.keywords = ''

    if (resourceFormRef.value) {
        resourceFormRef.value.resetFields()
    }
}

// 格式化日期时间
const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString()
}

// 格式化关键词
const formatKeywords = (keywords) => {
    if (!keywords) return '-'

    // 如果是数组，拼接成字符串
    if (Array.isArray(keywords)) {
        return keywords.join(', ')
    }

    // 如果是字符串，直接返回
    return keywords
}

// 获取状态类型
const getStatusType = (status) => {
    switch (status) {
        case 'pending': return 'info'
        case 'executing': return 'warning'
        case 'completed': return 'success'
        default: return 'info'
    }
}

// 获取状态文本
const getStatusText = (status) => {
    switch (status) {
        case 'pending': return '等待中'
        case 'executing': return '执行中'
        case 'completed': return '已完成'
        default: return '未知'
    }
}

// 获取节点组名称
const getGroupName = (groupId) => {
    if (!groupId) return '未分配'
    const group = groupStore.groups.find(g => g.id === groupId)
    return group ? group.groupName : `未知群组(ID: ${groupId})`
}

// 添加状态变化检测函数
const checkStatusChanges = () => {
    // 检查新完成的资源
    const newCompletedCount = completedResources.value.length - prevCompletedCount.value;
    if (newCompletedCount > 0) {
        ElMessage.success(`${newCompletedCount} 个资源已完成处理`);
    }

    // 检查执行状态变化
    const executingDiff = executingResources.value.length - prevExecutingCount.value;
    if (executingDiff > 0) {
        ElMessage.info(`${executingDiff} 个新资源开始执行`);
    }
}
</script>

<style scoped>
.resource-allocation-component {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-refresh {
    display: flex;
    align-items: center;
    gap: 10px;
}

.search-input {
    width: 300px;
}

.form-hint {
    font-size: 12px;
    color: #606266;
    margin-top: 5px;
}

.resource-content {
    white-space: pre-wrap;
    background-color: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
}

.mb-20 {
    margin-bottom: 20px;
}
</style>
