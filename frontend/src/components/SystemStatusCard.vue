<template>
    <el-card class="system-status-card">
        <template #header>
            <div class="status-header">
                <h3>系统状态概览</h3>
                <div class="refresh-info">
                    <span class="last-update">上次更新: {{ formatDateTime(lastUpdate) }}</span>
                    <el-button :icon="Refresh" circle size="small" @click="refreshStats" :loading="loading"></el-button>
                </div>
            </div>
        </template>

        <el-row :gutter="20">
            <el-col :span="8">
                <div class="stat-box">
                    <div class="stat-title">节点状态</div>
                    <div class="stat-value">{{ stats.nodeCount || 0 }}</div>
                    <div class="stat-tags">
                        <el-tag type="success">空闲: {{ stats.idleNodes || 0 }}</el-tag>
                        <el-tag type="warning">忙碌: {{ stats.busyNodes || 0 }}</el-tag>
                        <el-tag type="danger">异常: {{ stats.errorNodes || 0 }}</el-tag>
                    </div>
                </div>
            </el-col>

            <el-col :span="8">
                <div class="stat-box">
                    <div class="stat-title">群组状态</div>
                    <div class="stat-value">{{ stats.groupCount || 0 }}</div>
                    <div class="stat-tags">
                        <el-tag type="success">空闲: {{ stats.idleGroups || 0 }}</el-tag>
                        <el-tag type="warning">忙碌: {{ stats.busyGroups || 0 }}</el-tag>
                    </div>
                </div>
            </el-col>

            <el-col :span="8">
                <div class="stat-box">
                    <div class="stat-title">资源状态</div>
                    <div class="stat-value">{{ stats.resourceCount || 0 }}</div>
                    <div class="stat-tags">
                        <el-tag type="info">等待: {{ stats.pendingResources || 0 }}</el-tag>
                        <el-tag type="warning">执行中: {{ stats.executingResources || 0 }}</el-tag>
                        <el-tag type="success">已完成: {{ stats.completedResources || 0 }}</el-tag>
                    </div>
                </div>
            </el-col>
        </el-row>
    </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

const lastUpdate = ref(new Date())
const loading = ref(false)
const stats = ref({
    nodeCount: 0,
    idleNodes: 0,
    busyNodes: 0,
    errorNodes: 0,

    groupCount: 0,
    idleGroups: 0,
    busyGroups: 0,

    resourceCount: 0,
    pendingResources: 0,
    executingResources: 0,
    completedResources: 0
})

let autoRefreshTimer = null

// 格式化日期时间
const formatDateTime = (date) => {
    if (!date) return '-'
    return date.toLocaleString()
}

// 获取系统状态
const refreshStats = async () => {
    loading.value = true
    try {
        // 获取节点状态
        const nodeResponse = await axios.get('/api/nodes/stats')
        if (nodeResponse.data && nodeResponse.data.success) {
            stats.value.nodeCount = nodeResponse.data.count || 0
            stats.value.idleNodes = nodeResponse.data.idle || 0
            stats.value.busyNodes = nodeResponse.data.busy || 0
            stats.value.errorNodes = nodeResponse.data.error || 0
        }

        // 获取群组状态
        const groupResponse = await axios.get('/api/groups/stats')
        if (groupResponse.data && groupResponse.data.success) {
            stats.value.groupCount = groupResponse.data.count || 0
            stats.value.idleGroups = groupResponse.data.idle || 0
            stats.value.busyGroups = groupResponse.data.busy || 0
        }

        // 获取资源状态
        const resourceResponse = await axios.get('/api/resources/stats')
        if (resourceResponse.data && resourceResponse.data.success) {
            stats.value.resourceCount = resourceResponse.data.count || 0
            stats.value.pendingResources = resourceResponse.data.pending || 0
            stats.value.executingResources = resourceResponse.data.executing || 0
            stats.value.completedResources = resourceResponse.data.completed || 0
        }

        // 更新刷新时间
        lastUpdate.value = new Date()
    } catch (error) {
        console.error('获取系统状态失败:', error)
        ElMessage.error('获取系统状态失败')
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await refreshStats()

    // 设置自动刷新（每分钟）
    autoRefreshTimer = setInterval(refreshStats, 60000)
})

onUnmounted(() => {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
    }
})
</script>

<style scoped>
.system-status-card {
    margin-bottom: 20px;
}

.status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.status-header h3 {
    margin: 0;
}

.refresh-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.last-update {
    font-size: 12px;
    color: #909399;
}

.stat-box {
    text-align: center;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.stat-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 5px;
    color: #606266;
}

.stat-value {
    font-size: 36px;
    font-weight: bold;
    color: #303133;
    margin: 10px 0;
}

.stat-tags {
    display: flex;
    justify-content: center;
    gap: 5px;
    flex-wrap: wrap;
}
</style>
