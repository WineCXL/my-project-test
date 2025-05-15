<template>
    <div class="resource-allocation-view">
        <el-row :gutter="20">
            <el-col :span="24">
                <h1>资源分配</h1>
            </el-col>
        </el-row>

        <el-row :gutter="20">
            <el-col :span="24">
                <el-tabs>
                    <!-- 资源统计（放在第一位） -->
                    <el-tab-pane label="资源统计">
                        <el-card class="stats-card" shadow="hover">
                            <template #header>
                                <div class="card-header">
                                    <span>资源分配统计</span>
                                    <div class="total-resources">
                                        <span>资源总数：</span>
                                        <span class="total-count">{{ resourceStats?.totalResources || 0 }}</span>
                                    </div>
                                    <el-button type="primary" size="small" @click="refreshAllData"
                                        :loading="refreshing">刷新</el-button>
                                </div>
                            </template>

                            <!-- 资源分配环形图 -->
                            <div class="chart-container">
                                <div ref="pieChartRef" class="pie-chart"></div>
                            </div>

                            <!-- 直接显示状态详情 -->
                            <div class="status-detail-divider">
                                <span>状态详情</span>
                            </div>

                            <!-- 改为2x2的卡片布局 -->
                            <el-row :gutter="20" v-if="resourceStats" class="mt-4">
                                <el-col :span="12" :sm="24" :md="12" :lg="12" class="mb-4">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>等待中任务</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ resourceStats.pendingResources || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(resourceStats.pendingResources, resourceStats.totalResources)"
                                                status=""></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>

                                <el-col :span="12" :sm="24" :md="12" :lg="12" class="mb-4">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>执行中任务</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span
                                                class="metric-number">{{ resourceStats.executingResources || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(resourceStats.executingResources, resourceStats.totalResources)"
                                                status="warning"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>

                                <el-col :span="12" :sm="24" :md="12" :lg="12" class="mb-4">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>已完成任务</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span
                                                class="metric-number">{{ resourceStats.completedResources || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(resourceStats.completedResources, resourceStats.totalResources)"
                                                status="success"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>

                                <el-col :span="12" :sm="24" :md="12" :lg="12" class="mb-4">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>异常任务</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ resourceStats.errorResources || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(resourceStats.errorResources, resourceStats.totalResources)"
                                                status="exception"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>
                            </el-row>

                            <el-empty v-else description="暂无资源统计数据" />
                        </el-card>
                    </el-tab-pane>

                    <!-- 资源分配表格 -->
                    <el-tab-pane label="资源分配表">
                        <el-card class="table-card">
                            <!-- 只保留搜索和刷新功能 -->
                            <div class="search-bar">
                                <el-input v-model="searchQuery" placeholder="搜索资源" prefix-icon="Search" clearable />
                                <div class="actions">
                                    <el-button :icon="Refresh" @click="refreshAllData" :loading="loading">刷新</el-button>
                                </div>
                            </div>

                            <!-- 资源列表表格 -->
                            <el-table :data="filteredResources" border style="width: 100%" v-loading="loading">
                                <el-table-column prop="id" label="ID" width="80" />
                                <el-table-column prop="documentId" label="文档ID" width="120" />
                                <el-table-column prop="title" label="任务标题" min-width="150" />

                                <!-- 所属用户列 - 仅管理员可见 -->
                                <el-table-column label="所属用户" width="120" v-if="isAdmin">
                                    <template #default="scope">
                                        {{ scope.row.username || '未知用户' }}
                                    </template>
                                </el-table-column>

                                <!-- 处理状态 -->
                                <el-table-column label="处理状态" width="120">
                                    <template #default="scope">
                                        <el-tag :type="getStatusType(scope.row.executionStatus || scope.row.status)">
                                            {{ getStatusText(scope.row.executionStatus || scope.row.status) }}
                                        </el-tag>
                                    </template>
                                </el-table-column>

                                <el-table-column prop="createdAt" label="创建时间" width="180">
                                    <template #default="scope">
                                        {{ new Date(scope.row.createdAt).toLocaleString() }}
                                    </template>
                                </el-table-column>

                                <!-- 分配群组 -->
                                <el-table-column label="分配群组" width="120">
                                    <template #default="scope">
                                        {{ scope.row.assignedGroupName || '未分配' }}
                                    </template>
                                </el-table-column>

                                <!-- 只有管理员才能看到的匹配结果 -->
                                <el-table-column v-if="isAdmin" prop="keywordMatched" label="匹配结果" width="120">
                                    <template #default="scope">
                                        <el-tag :type="getMatchType(scope.row.keywordMatched)">
                                            {{ scope.row.keywordMatched ? '已匹配' : '未匹配' }}
                                        </el-tag>
                                    </template>
                                </el-table-column>

                                <!-- 操作列只显示"查看详情"按钮 -->
                                <el-table-column label="操作" width="120">
                                    <template #default="scope">
                                        <el-button type="info" size="small" text
                                            @click="viewDocument(scope.row)">查看详情</el-button>
                                    </template>
                                </el-table-column>
                            </el-table>

                            <!-- 分页 -->
                            <div class="pagination">
                                <el-pagination background layout="prev, pager, next" :total="totalResources"
                                    :page-size="pageSize" v-model:current-page="currentPage" />
                            </div>
                        </el-card>
                    </el-tab-pane>
                </el-tabs>
            </el-col>
        </el-row>

        <!-- 文档详情对话框 -->
        <el-dialog v-model="documentDetailDialogVisible" title="文档详情" width="650px">
            <el-descriptions :column="1" border>
                <el-descriptions-item label="ID">{{ currentDocumentDetail?.id }}</el-descriptions-item>
                <el-descriptions-item label="文档ID">{{ currentDocumentDetail?.documentId }}</el-descriptions-item>
                <el-descriptions-item label="标题">{{ currentDocumentDetail?.title }}</el-descriptions-item>
                <el-descriptions-item v-if="isAdmin" label="所属用户">{{ currentDocumentDetail?.username || '未知用户' }}</el-descriptions-item>
                <el-descriptions-item label="关键词ID">{{ currentDocumentDetail?.keywordId }}</el-descriptions-item>
                <el-descriptions-item label="关键词匹配">
                    <el-tag :type="getMatchType(currentDocumentDetail?.keywordMatched)">
                        {{ currentDocumentDetail?.keywordMatched ? '已匹配' : '未匹配' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="处理状态">
                    <el-tag :type="getStatusType(currentDocumentDetail?.status)">
                        {{ getStatusText(currentDocumentDetail?.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item
                    label="分配群组">{{ currentDocumentDetail?.groupName || '未分配' }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">
                    {{ currentDocumentDetail?.createdAt ? new Date(currentDocumentDetail.createdAt).toLocaleString() : '-' }}
                </el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="documentDetailDialogVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import http from "../api/http";
import { useUserStore } from '../store/user';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
    TitleComponent,
    LegendComponent,
    TooltipComponent,
    GridComponent
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必需的ECharts组件
echarts.use([
    PieChart,
    TitleComponent,
    LegendComponent,
    TooltipComponent,
    GridComponent,
    LabelLayout,
    CanvasRenderer
]);

// 获取用户信息
const userStore = useUserStore();
const isAdmin = computed(() => userStore.isAdmin);
const userId = computed(() => userStore.userId);

// 状态变量
const resourceStats = ref(null);
const resources = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const documentDetailDialogVisible = ref(false);
const currentDocumentDetail = ref(null);

// 群组缓存相关变量
const groupsCache = ref({});
const groupsCacheLastUpdate = ref(0);

// ECharts相关
const pieChartRef = ref(null);
let pieChart = null;

// 计算属性
const totalResources = computed(() => resources.value.length);

const filteredResources = computed(() => {
    let result = resources.value;

    // 搜索过滤，兼容多种字段名
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(r =>
            (r.title?.toLowerCase().includes(query)) ||
            (r.keywords?.toLowerCase().includes(query)) ||
            (r.keywordId?.toLowerCase().includes(query)) ||
            (r.username?.toLowerCase().includes(query))
        );
    }

    return result;
});

// 生命周期钩子
onMounted(() => {
    refreshAllData();
    initPieChart();

    // 添加窗口大小变化监听器
    window.addEventListener('resize', resizePieChart);
});

// 初始化饼图
const initPieChart = () => {
    nextTick(() => {
        if (pieChartRef.value) {
            pieChart = echarts.init(pieChartRef.value);
            updatePieChart();
        }
    });
};

// 更新饼图数据
const updatePieChart = () => {
    if (!pieChart || !resourceStats.value) return;

    const { pendingResources, executingResources, completedResources, errorResources } = resourceStats.value;

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            data: ['等待中任务', '执行中任务', '已完成任务', '异常任务']
        },
        series: [
            {
                name: '资源分配',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                label: {
                    show: true,
                    position: 'outside',
                    formatter: '{b}: {c} ({d}%)',
                    fontSize: 12
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: true,
                    length: 10,
                    length2: 15,
                    smooth: true
                },
                data: [
                    { value: pendingResources || 0, name: '等待中任务', itemStyle: { color: '#909399' } },
                    { value: executingResources || 0, name: '执行中任务', itemStyle: { color: '#E6A23C' } },
                    { value: completedResources || 0, name: '已完成任务', itemStyle: { color: '#67C23A' } },
                    { value: errorResources || 0, name: '异常任务', itemStyle: { color: '#F56C6C' } }
                ]
            }
        ]
    };

    pieChart.setOption(option);
};

// 窗口大小变化时调整图表大小
const resizePieChart = () => {
    if (pieChart) {
        pieChart.resize();
    }
};

// 监听resourceStats变化，更新图表
watch(resourceStats, () => {
    updatePieChart();
});

// 刷新所有数据的方法
const refreshAllData = async () => {
    refreshing.value = true;
    try {
        await fetchAllGroups(true);
        await fetchResourceStats();
        await fetchResources();
    } catch (error) {
        console.error('刷新数据失败:', error);
        ElMessage.error('刷新数据失败');
    } finally {
        refreshing.value = false;
        // 数据刷新后更新图表
        updatePieChart();
    }
};

// 获取所有群组并缓存
const fetchAllGroups = async (forceUpdate = false) => {
    const now = Date.now();
    // 如果距离上次更新不足30秒且不是强制更新，则跳过
    if (!forceUpdate && now - groupsCacheLastUpdate.value < 30000) {
        console.log('使用群组缓存数据，跳过获取');
        return;
    }

    try {
        console.log('获取最新群组数据');
        const response = await http.get('groups');
        if (response.data && response.success) {
            // 转换为id->group的映射
            const groups = response.data.reduce((acc, group) => {
                acc[group.id] = group;
                return acc;
            }, {});
            groupsCache.value = groups;
            groupsCacheLastUpdate.value = now; // 更新时间戳
            //console.log('群组数据更新完成，缓存数量:', Object.keys(groups).length);
        }
    } catch (error) {
        console.error('获取所有群组失败:', error);
    }
};

// 方法
// 获取资源统计数据
const fetchResourceStats = async () => {
    refreshing.value = true;
    try {
        // 从后端API获取数据
        // 判断是管理员还是普通用户，决定请求哪个接口
        const apiUrl = isAdmin.value ? 'resources/stats' : `resources/my-stats`;
        const response = await http.get(apiUrl);

        // 如果API不存在，使用聚合数据
        if (!response.data || !response.success) {
            // 计算待分配资源数
            const pendingDocs = await http.get(isAdmin.value ? 'resources/pending' : `resources/my-pending`);
            // 计算执行中资源数
            const executingDocs = await http.get(isAdmin.value ? 'resources/executing' : `resources/my-executing`);
            // 获取资源分配数据
            const allocatedDocs = await http.get(isAdmin.value ? 'resources/allocation' : `resources/my-allocation`);

            // 计算总数和已完成数
            const pending = pendingDocs?.data?.length || 0;
            const executing = executingDocs?.data?.length || 0;
            const allocated = allocatedDocs?.data?.length || 0;
            const completed = allocated - executing || 0;

            resourceStats.value = {
                totalResources: pending + allocated,
                pendingResources: pending,
                executingResources: executing,
                completedResources: completed,
                errorResources: 0 // 预设为0
            };
        } else {
            resourceStats.value = response.data;
        }
    } catch (error) {
        console.error('获取资源统计信息失败:', error);
        ElMessage.error('获取资源统计信息失败');
    } finally {
        refreshing.value = false;
    }
};

// 标准化API返回的资源数据
const normalizeResourceData = (resources) => {
    return resources.map(resource => {
        const assignedGroupId = resource.assignedGroupId;
        let groupName = '未分配';

        // 从缓存中获取群组名称
        if (assignedGroupId && groupsCache.value[assignedGroupId]) {
            groupName = groupsCache.value[assignedGroupId].groupName;
        } else if (assignedGroupId) {
            // 如果有ID但缓存中没有，显示ID
            groupName = `群组#${assignedGroupId}`;
        }

        return {
            ...resource,
            // 如果executionStatus不存在，使用status
            executionStatus: resource.executionStatus || resource.status,
            // 如果keywords不存在，使用keywordId
            keywords: resource.keywords || resource.keywordId,
            // 添加群组名称
            assignedGroupName: groupName,
            // 保留用户名
            username: resource.username || '未知用户'
        };
    });
};

// 使用此函数处理API返回的数据
const fetchResources = async () => {
    loading.value = true;
    try {
        const timestamp = new Date().getTime();
        // 判断是否为管理员，决定调用哪个接口
        let url = isAdmin.value
            ? `resources/allocation?_t=${timestamp}`
            : `resources/my-allocation?_t=${timestamp}`;

        const response = await http.get(url);

        if (response.data && response.success) {
            // 标准化数据
            resources.value = normalizeResourceData(response.data);
            console.log('资源列表加载完成，数量:', resources.value.length);
        } else {
            resources.value = [];
        }
    } catch (error) {
        console.error('获取资源列表失败:', error);
        ElMessage.error('获取资源列表失败');
    } finally {
        loading.value = false;
    }

    nextTick(() => {
        // 强制重新计算filteredResources
        searchQuery.value = searchQuery.value;
    });
};

// 查看文档详情
const viewDocument = async (resource) => {
    try {
        // 调试日志
        //console.log('文档原始数据:', JSON.stringify(resource, null, 2));

        // 构建详情数据，考虑字段名的差异
        currentDocumentDetail.value = {
            id: resource.id,
            documentId: resource.documentId || '',
            title: resource.title || '',
            // 添加用户名
            username: resource.username || '未知用户',
            // 采用关键词的多种可能字段名
            keywordId: resource.keywords || resource.keywordId || '',
            // 采用匹配结果的可能字段名
            keywordMatched: resource.keywordMatched,
            // 采用状态的多种可能字段名
            status: resource.executionStatus || resource.status,
            // 使用已规范化的群组名称
            groupName: resource.assignedGroupName || '未分配',
            createdAt: resource.createdAt
        };

        documentDetailDialogVisible.value = true;
    } catch (error) {
        console.error('获取文档详情失败:', error);
        ElMessage.error('获取文档详情失败');
    }
};

// 辅助函数
// 计算百分比
const getPercentage = (part, total) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100);
};

// 获取状态类型
const getStatusType = (status) => {
    if (!status) return 'info'; // 处理undefined或null的情况
    switch (status) {
        case 'pending': return 'info';
        case 'executing': return 'warning';
        case 'completed': return 'success';
        case 'error': return 'danger';
        default: return 'info';
    }
};

// 获取状态文本
const getStatusText = (status) => {
    if (!status) return '未知';
    return {
        'executing': '处理中',
        'completed': '已完成',
        'pending': '等待中',
        'error': '异常'
    }[status] || status;
};

// 获取匹配类型
const getMatchType = (matched) => {
    if (matched === undefined || matched === null) return 'info';
    return matched ? 'success' : 'danger';
};

// 在组件卸载时清理
onUnmounted(() => {
    if (pieChart) {
        pieChart.dispose();
        pieChart = null;
    }
    window.removeEventListener('resize', resizePieChart);
});
</script>

<style scoped>
.resource-allocation-view {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.total-resources {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16px;
    font-weight: 500;
}

.total-count {
    font-size: 18px;
    font-weight: bold;
    color: #409EFF;
}

.stats-card {
    margin-bottom: 20px;
}

.chart-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
}

.pie-chart {
    width: 100%;
    height: 300px;
}

.metric-card {
    height: 100%;
}

.metric-header {
    font-size: 14px;
    color: #606266;
}

.metric-value {
    text-align: center;
}

.metric-number {
    font-size: 36px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 10px;
    display: block;
}

.mt-4 {
    margin-top: 24px;
}

.mb-4 {
    margin-bottom: 24px;
}

h1 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #303133;
}

.status-detail-divider {
    border-bottom: 1px solid #ebeef5;
    margin: 20px 0;
    text-align: center;
    position: relative;
    color: #606266;
    font-size: 14px;
}

.status-detail-divider span {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fff;
    padding: 0 20px;
}

.table-card {
    margin-bottom: 20px;
}

.search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.search-bar .el-input {
    width: 300px;
}

.actions {
    display: flex;
    gap: 10px;
}

.resource-tabs {
    margin-bottom: 20px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.operation-buttons {
    display: flex;
    justify-content: center;
    gap: 5px;
}

.keyword-matched {
    color: #67C23A;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}

.keyword-unmatched {
    color: #F56C6C;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}
</style>
