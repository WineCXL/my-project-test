<template>
    <div class="node-manager-view">
        <el-row :gutter="20">
            <el-col :span="24">
                <h1>节点管理</h1>
            </el-col>
        </el-row>

        <el-row :gutter="20">
            <el-col :span="24">
                <el-tabs>
                    <!-- 节点统计 -->
                    <el-tab-pane label="节点统计">
                        <el-card class="stats-card" shadow="hover">
                            <template #header>
                                <div class="card-header">
                                    <span>节点统计信息</span>
                                    <div class="total-nodes">
                                        <span>节点总数：</span>
                                        <span class="total-count">{{ nodeStatistics?.totalNodes || 0 }}</span>
                                    </div>
                                    <el-button type="primary" size="small" @click="refreshStatistics"
                                        :loading="refreshing">刷新</el-button>
                                </div>
                            </template>

                            <!-- 环形图 -->
                            <div class="chart-container" v-if="nodeStatistics">
                                <el-row>
                                    <el-col :span="24">
                                        <div ref="pieChartRef" style="width: 100%; height: 300px;"></div>
                                    </el-col>
                                </el-row>
                            </div>

                            <div class="status-detail-divider">
                                <span>状态详情</span>
                            </div>

                            <!-- 节点状态卡片 -->
                            <el-row :gutter="20" v-if="nodeStatistics" class="mt-4">
                                <el-col :span="8">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>空闲节点</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ nodeStatistics.idleNodes || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(nodeStatistics.idleNodes, nodeStatistics.totalNodes)"
                                                status="success"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>

                                <el-col :span="8">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>占用节点</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ nodeStatistics.busyNodes || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(nodeStatistics.busyNodes, nodeStatistics.totalNodes)"
                                                status="warning"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>

                                <el-col :span="8">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>异常节点</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ nodeStatistics.errorNodes || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(nodeStatistics.errorNodes, nodeStatistics.totalNodes)"
                                                status="exception"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>
                            </el-row>

                            <el-empty v-else description="暂无节点统计数据" />
                        </el-card>
                    </el-tab-pane>

                    <!-- 节点列表 -->
                    <el-tab-pane label="节点列表">
                        <NodeManagerComponent @node-updated="handleNodeUpdated" />
                    </el-tab-pane>
                </el-tabs>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useNodeStore } from '../store/node'
import NodeManagerComponent from '../components/NodeManagerComponent.vue'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent
} from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
    PieChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    CanvasRenderer,
    LabelLayout
])

const nodeStore = useNodeStore()
const refreshing = ref(false)
const nodeStatistics = ref(null)
const pieChartRef = ref(null)
let pieChart = null

// 载入页面时获取数据
onMounted(async () => {
    await refreshStatistics()
})

// 组件卸载时销毁图表实例
onUnmounted(() => {
    if (pieChart) {
        pieChart.dispose()
        pieChart = null
    }
})

// 刷新节点统计信息
const refreshStatistics = async () => {
    refreshing.value = true
    try {
        // 先获取所有节点
        await nodeStore.fetchNodes()

        // 计算统计信息
        const nodes = nodeStore.nodes || []
        const totalNodes = nodes.length
        const idleNodes = nodes.filter(node => node.status === 'idle').length
        const busyNodes = nodes.filter(node => node.status === 'busy').length
        const errorNodes = nodes.filter(node => node.status === 'error').length
        const assignedNodes = nodes.filter(node => node.groupId).length
        const verifiedNodes = nodes.filter(node => node.zkpIdentity && node.zkpIdentity.length > 0).length

        // 更新统计数据
        nodeStatistics.value = {
            totalNodes,
            idleNodes,
            busyNodes,
            errorNodes,
            assignedNodes,
            verifiedNodes
        }

        // 更新图表
        nextTick(() => {
            renderPieChart()
        })
    } catch (error) {
        console.error('获取节点统计信息失败:', error)
        ElMessage.error('获取节点统计信息失败')
    } finally {
        refreshing.value = false
    }
}

// 渲染饼图
const renderPieChart = () => {
    if (!pieChartRef.value) return;

    // 确保DOM元素已经渲染且有尺寸
    nextTick(() => {
        // 尝试获取容器的宽高
        const container = pieChartRef.value;
        if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
            console.log('图表容器尺寸为0，延迟渲染');
            // 如果尺寸为0，延迟200ms后再尝试
            setTimeout(() => renderPieChart(), 200);
            return;
        }

        // 如果已存在图表实例，先销毁
        if (pieChart) {
            pieChart.dispose();
        }

        // 初始化图表
        pieChart = echarts.init(container);

        // 准备图表数据
        const chartData = [
            { name: '空闲节点', value: nodeStatistics.value.idleNodes, itemStyle: { color: '#67C23A' } },
            { name: '占用节点', value: nodeStatistics.value.busyNodes, itemStyle: { color: '#E6A23C' } },
            { name: '异常节点', value: nodeStatistics.value.errorNodes, itemStyle: { color: '#F56C6C' } }
        ]

        // 设置图表选项
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'horizontal',
                left: 'center',
                top: 'bottom',
                data: chartData.map(item => item.name)
            },
            series: [
                {
                    name: '节点状态',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        formatter: '{b}: {c} ({d}%)'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: true
                    },
                    data: chartData
                }
            ]
        }

        // 渲染图表
        pieChart.setOption(option);

        // 响应窗口大小变化
        window.addEventListener('resize', () => {
            pieChart && pieChart.resize();
        });
    });
}

// 节点更新事件处理
const handleNodeUpdated = () => {
    refreshStatistics()
}

// 计算百分比
const getPercentage = (part, total) => {
    if (!total || total === 0) return 0
    return Math.round((part / total) * 100)
}

// 获取百分比文本
const getPercentageText = (part, total) => {
    if (!total || total === 0) return '0%'
    return `${Math.round((part / total) * 100)}%`
}
</script>

<style scoped>
.node-manager-view {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 20px;
}

.total-nodes {
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

.metric-card {
    height: 100%;
    margin-bottom: 20px;
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

.metric-label {
    font-size: 12px;
    color: #909399;
}

.chart-container {
    margin-top: 20px;
}

.mt-4 {
    margin-top: 24px;
}

.el-divider {
    margin: 30px 0 20px;
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
</style>
