<script setup>
import { ref, onMounted } from 'vue'
import { useSystemStore } from '../store/system'
import { useNodeStore } from '../store/node'
import { useGroupStore } from '../store/group'
import { useResourceAllocationStore } from '../store/resourceAllocation'
import { ElMessage } from 'element-plus'
// 导入必要的图标组件
import {
    Monitor,
    Collection,
    SwitchButton,
    Connection,
    Unlock,
    Lock,
    Key
} from '@element-plus/icons-vue'

const systemStore = useSystemStore()
const nodeStore = useNodeStore()
const groupStore = useGroupStore()
const resourceStore = useResourceAllocationStore()

// 获取系统状态和数据
const loading = ref(true)

// 统计数据
const stats = ref({
    totalNodes: 0,
    idleNodes: 0,
    busyNodes: 0,
    errorNodes: 0,
    totalGroups: 0,
    totalAllocations: 0,
    totalKeywords: 0,
    totalTrapdoors: 0
})

onMounted(async () => {
    loading.value = true

    try {
        // 并行加载数据
        await Promise.all([
            systemStore.fetchSystemParams().catch(err => console.error('加载系统参数失败:', err)),
            nodeStore.fetchNodes().catch(err => console.error('加载节点数据失败:', err)),
            groupStore.fetchGroups().catch(err => console.error('加载群组数据失败:', err)),
            resourceStore.fetchAllocations().catch(err => console.error('加载资源分配数据失败:', err)),
            fetchCoreStats()
        ])

        // 计算统计数据
        stats.value = {
            ...stats.value,
            totalNodes: nodeStore.nodes.length || 0,
            idleNodes: (nodeStore.nodes.filter(node => node.status === 'idle') || []).length,
            busyNodes: (nodeStore.nodes.filter(node => node.status === 'busy') || []).length,
            errorNodes: (nodeStore.nodes.filter(node => node.status === 'error') || []).length,
            totalGroups: groupStore.groups.length || 0,
            totalAllocations: resourceStore.allocations.length || 0
        }
    } catch (error) {
        console.error('加载仪表板数据失败:', error)
        ElMessage.warning('部分数据加载失败，请刷新页面重试')
    } finally {
        loading.value = false
    }
})

// 获取核心组件统计数据
async function fetchCoreStats() {
    try {
        // 暂时使用模拟数据，实际情况应该调用后端API
        stats.value.totalKeywords = 0;
        stats.value.totalTrapdoors = 0;
    } catch (error) {
        console.error('获取核心组件统计信息失败:', error)
    }
}

</script>

<template>
    <div class="dashboard-container">
        <el-row :gutter="20">
            <el-col :span="24">
                <h1>可搜索加密资源分配系统——边缘层</h1>
            </el-col>
        </el-row>

        <el-row v-loading="loading" :gutter="20">
            <!-- 统计卡片 -->
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
                <el-card class="stat-card">
                    <div class="stat-card-inner">
                        <el-icon class="stat-icon">
                            <Monitor />
                        </el-icon>
                        <div class="stat-content">
                            <div class="stat-title">总节点数</div>
                            <div class="stat-value">{{ stats.totalNodes }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6" :lg="4">
                <el-card class="stat-card">
                    <div class="stat-card-inner">
                        <el-icon class="stat-icon success">
                            <Monitor />
                        </el-icon>
                        <div class="stat-content">
                            <div class="stat-title">空闲节点</div>
                            <div class="stat-value">{{ stats.idleNodes }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6" :lg="4">
                <el-card class="stat-card">
                    <div class="stat-card-inner">
                        <el-icon class="stat-icon warning">
                            <Monitor />
                        </el-icon>
                        <div class="stat-content">
                            <div class="stat-title">占用节点</div>
                            <div class="stat-value">{{ stats.busyNodes }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6" :lg="4">
                <el-card class="stat-card">
                    <div class="stat-card-inner">
                        <el-icon class="stat-icon danger">
                            <Monitor />
                        </el-icon>
                        <div class="stat-content">
                            <div class="stat-title">异常节点</div>
                            <div class="stat-value">{{ stats.errorNodes }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6" :lg="4">
                <el-card class="stat-card">
                    <div class="stat-card-inner">
                        <el-icon class="stat-icon info">
                            <Collection />
                        </el-icon>
                        <div class="stat-content">
                            <div class="stat-title">群组数量</div>
                            <div class="stat-value">{{ stats.totalGroups }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6" :lg="4">
                <el-card class="stat-card">
                    <div class="stat-card-inner">
                        <el-icon class="stat-icon info">
                            <SwitchButton />
                        </el-icon>
                        <div class="stat-content">
                            <div class="stat-title">资源分配</div>
                            <div class="stat-value">{{ stats.totalAllocations }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-20">
            <el-col :span="24" :lg="16">
                <el-card>
                    <template #header>
                        <div class="card-header">
                            <span>系统状态</span>
                        </div>
                    </template>
                    <div v-if="systemStore.systemParams">
                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="系统名称">元数据隐私保护资源分配系统</el-descriptions-item>
                            <el-descriptions-item label="系统状态">
                                <el-tag type="success">运行中</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item
                                label="安全参数">{{ systemStore.systemParams.securityParam || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="系统版本">v1.0</el-descriptions-item>
                            <el-descriptions-item
                                label="更新时间">{{ systemStore.systemParams.updatedAt ? new Date(systemStore.systemParams.updatedAt).toLocaleString() : '-' }}</el-descriptions-item>
                        </el-descriptions>
                    </div>
                    <el-empty v-else description="暂无系统参数数据"></el-empty>
                </el-card>
            </el-col>

            <el-col :span="24" :lg="8">
                <el-card>
                    <template #header>
                        <div class="card-header">
                            <span>快速操作</span>
                        </div>
                    </template>
                    <div class="quick-actions">
                        <!-- 系统管理操作 -->
                        <h3>系统管理</h3>
                        <div class="action-group">
                            <el-button type="primary" @click="$router.push('/app/node-manager')">管理节点</el-button>
                            <el-button type="primary" @click="$router.push('/app/group-manager')">管理群组</el-button>
                            <el-button type="primary" @click="$router.push('/app/resource-allocation')">分配资源</el-button>
                            <el-button type="primary" @click="$router.push('/app/search-operation')">执行搜索</el-button>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<style scoped>
.dashboard-container {
    padding: 0;
}

.stat-card {
    margin-bottom: 20px;
}

.stat-card-inner {
    display: flex;
    align-items: center;
}

.stat-icon {
    font-size: 48px;
    margin-right: 20px;
    color: #409EFF;
}

.stat-icon.primary {
    color: #409EFF;
}

.stat-icon.success {
    color: #67C23A;
}

.stat-icon.warning {
    color: #E6A23C;
}

.stat-icon.danger {
    color: #F56C6C;
}

.stat-icon.info {
    color: #909399;
}

.stat-content {
    flex-grow: 1;
}

.stat-title {
    font-size: 16px;
    color: #909399;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mt-10 {
    margin-top: 10px;
}

.mt-20 {
    margin-top: 20px;
}

.quick-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.action-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
}

.core-stat-card {
    position: relative;
    display: flex;
    flex-direction: column;
}

h2 {
    margin-top: 10px;
    margin-bottom: 20px;
    font-size: 18px;
    color: #606266;
}

h3 {
    margin-bottom: 10px;
    font-size: 16px;
    color: #606266;
}
</style>
