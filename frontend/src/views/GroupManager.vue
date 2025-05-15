<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted, computed } from 'vue'
import { useGroupStore } from '../store/group'
import { useNodeStore } from '../store/node'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGroupMembers, addGroupMember, removeGroupMember } from '../api/group'
import GroupManagerComponent from '../components/GroupManagerComponent.vue'
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
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    PieChart,
    CanvasRenderer,
    LabelLayout
])

const groupStore = useGroupStore()
const nodeStore = useNodeStore()
const loading = ref(false)
const membersLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加群组')
const isEdit = ref(false)
const searchQuery = ref('')
const currentGroupId = ref(null)
const currentGroupMembers = ref([])
const memberDialogVisible = ref(false)
const selectedNodeId = ref('')
const refreshing = ref(false)
const groupStatistics = ref(null)
const pieChartRef = ref(null)
let pieChart = null

// 群组表单
const groupForm = reactive({
    name: '',
    type: 'standard',
    status: 'active',
    maxMembers: 10
})

// 表单验证规则
const rules = {
    name: [
        { required: true, message: '请输入群组名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在2到50个字符之间', trigger: 'blur' }
    ],
    maxMembers: [
        { required: true, message: '请输入最大成员数', trigger: 'blur' },
        { type: 'number', min: 1, max: 100, message: '成员数必须在1到100之间', trigger: 'blur' }
    ]
}

const groupFormRef = ref(null)

// 过滤后的群组列表
const filteredGroups = computed(() => {
    if (!searchQuery.value) {
        return groupStore.groups
    }

    const query = searchQuery.value.toLowerCase()
    return groupStore.groups.filter(group =>
        group.name.toLowerCase().includes(query) ||
        group.type.toLowerCase().includes(query)
    )
})

// 可选节点列表（排除已是成员的节点）
const availableNodes = computed(() => {
    // 获取当前群组成员的节点ID列表
    const memberIds = currentGroupMembers.value.map(member => member.node_id)

    // 过滤出未加入当前群组的节点
    return nodeStore.nodes.filter(node => !memberIds.includes(node.id))
})

// 初始化饼图
const initPieChart = () => {
    if (!pieChartRef.value) return

    // 如果已经存在图表实例，先销毁
    if (pieChart) {
        pieChart.dispose()
    }

    // 创建新的图表实例
    pieChart = echarts.init(pieChartRef.value)

    // 更新图表数据
    updatePieChart()
}

// 更新饼图数据
const updatePieChart = () => {
    if (!pieChart || !groupStatistics.value) return

    const { totalGroups, idleGroups, busyGroups, errorGroups } = groupStatistics.value

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: 'bottom',
            itemWidth: 14,
            itemHeight: 14,
            data: ['空闲群组', '占用群组', '异常群组']
        },
        series: [
            {
                name: '群组状态',
                type: 'pie',
                radius: ['40%', '70%'], // 环形图内外半径
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    position: 'outside',
                    formatter: '{b}: {c} ({d}%)',
                    fontSize: 14
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 18,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: true,
                    length: 15,
                    length2: 10
                },
                data: [
                    { value: idleGroups, name: '空闲群组', itemStyle: { color: '#67C23A' } },
                    { value: busyGroups, name: '占用群组', itemStyle: { color: '#E6A23C' } },
                    { value: errorGroups, name: '异常群组', itemStyle: { color: '#F56C6C' } }
                ]
            }
        ]
    }

    pieChart.setOption(option)
}

// 加载群组列表
onMounted(async () => {
    loading.value = true
    try {
        await Promise.all([
            groupStore.fetchGroups(),
            nodeStore.fetchNodes()
        ])
        await refreshStatistics()

        // 初始化图表
        nextTick(() => {
            initPieChart()
        })

        // 监听窗口大小变化
        window.addEventListener('resize', handleResize)
    } catch (error) {
        console.error('获取数据失败:', error)
    } finally {
        loading.value = false
    }
})

// 组件卸载前清理资源
onUnmounted(() => {
    // 移除事件监听
    window.removeEventListener('resize', handleResize)

    // 销毁图表实例
    if (pieChart) {
        pieChart.dispose()
        pieChart = null
    }
})

// 监听窗口大小变化，调整图表大小
const handleResize = () => {
    if (pieChart) {
        pieChart.resize()
    }
}

// 打开添加群组对话框
const handleAddGroup = () => {
    resetForm()
    dialogTitle.value = '添加群组'
    isEdit.value = false
    dialogVisible.value = true
}

// 打开编辑群组对话框
const handleEditGroup = (group) => {
    resetForm()
    dialogTitle.value = '编辑群组'
    isEdit.value = true

    // 填充表单数据
    Object.assign(groupForm, {
        name: group.name,
        type: group.type,
        status: group.status,
        maxMembers: group.maxMembers
    })

    dialogVisible.value = true
}

// 处理删除群组
const handleDeleteGroup = async (group) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除群组"${group.name}"吗？`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        loading.value = true
        const success = await groupStore.removeGroup(group.id)
        if (success) {
            ElMessage({
                message: '删除群组成功',
                type: 'success'
            })
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除群组失败:', error)
        }
    } finally {
        loading.value = false
    }
}

// 提交群组表单
const submitGroupForm = async () => {
    if (!groupFormRef.value) return

    await groupFormRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                let result
                if (isEdit.value) {
                    // 编辑群组
                    const groupId = groupStore.currentGroup.id
                    result = await groupStore.updateGroup(groupId, groupForm)
                    if (result) {
                        ElMessage({
                            message: '更新群组成功',
                            type: 'success'
                        })
                    }
                } else {
                    // 添加群组
                    result = await groupStore.createGroup(groupForm)
                    if (result) {
                        ElMessage({
                            message: '添加群组成功',
                            type: 'success'
                        })
                    }
                }

                if (result) {
                    dialogVisible.value = false
                }
            } catch (error) {
                console.error(isEdit.value ? '更新群组失败:' : '添加群组失败:', error)
            } finally {
                loading.value = false
            }
        }
    })
}

// 重置表单
const resetForm = () => {
    if (groupFormRef.value) {
        groupFormRef.value.resetFields()
    }

    // 重置表单数据
    Object.assign(groupForm, {
        name: '',
        type: 'standard',
        status: 'active',
        maxMembers: 10
    })
}

// 管理群组成员
const handleManageMembers = async (group) => {
    currentGroupId.value = group.id
    membersLoading.value = true

    try {
        const response = await getGroupMembers(group.id)
        currentGroupMembers.value = response.data || []
    } catch (error) {
        console.error('获取群组成员失败:', error)
        ElMessage({
            message: '获取群组成员失败',
            type: 'error'
        })
    } finally {
        membersLoading.value = false
        memberDialogVisible.value = true
    }
}

// 添加成员到群组
const handleAddMember = async () => {
    if (!selectedNodeId.value || !currentGroupId.value) {
        ElMessage({
            message: '请选择要添加的节点',
            type: 'warning'
        })
        return
    }

    membersLoading.value = true
    try {
        await addGroupMember(currentGroupId.value, selectedNodeId.value)
        ElMessage({
            message: '添加群组成员成功',
            type: 'success'
        })

        // 重新获取群组成员
        const response = await getGroupMembers(currentGroupId.value)
        currentGroupMembers.value = response.data || []

        // 重置选择
        selectedNodeId.value = ''
    } catch (error) {
        console.error('添加群组成员失败:', error)
        ElMessage({
            message: '添加群组成员失败',
            type: 'error'
        })
    } finally {
        membersLoading.value = false
    }
}

// 从群组移除成员
const handleRemoveMember = async (member) => {
    try {
        await ElMessageBox.confirm(
            `确定要从群组中移除该成员吗？`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        membersLoading.value = true
        await removeGroupMember(currentGroupId.value, member.node_id)
        ElMessage({
            message: '移除群组成员成功',
            type: 'success'
        })

        // 重新获取群组成员
        const response = await getGroupMembers(currentGroupId.value)
        currentGroupMembers.value = response.data || []
    } catch (error) {
        if (error !== 'cancel') {
            console.error('移除群组成员失败:', error)
            ElMessage({
                message: '移除群组成员失败',
                type: 'error'
            })
        }
    } finally {
        membersLoading.value = false
    }
}

// 获取群组状态标签类型
const getStatusTagType = (status) => {
    switch (status) {
        case 'active':
            return 'success'
        case 'inactive':
            return 'info'
        case 'error':
            return 'danger'
        default:
            return ''
    }
}

// 获取群组类型显示文本
const getGroupTypeText = (type) => {
    switch (type) {
        case 'standard':
            return '标准群组'
        case 'special':
            return '特殊群组'
        default:
            return type
    }
}

// 刷新群组统计信息
const refreshStatistics = async () => {
    refreshing.value = true
    try {
        // 先获取所有群组
        await groupStore.fetchGroups()
        await nodeStore.fetchNodes()

        // 计算统计信息
        const groups = groupStore.groups || []
        const totalGroups = groups.length
        const idleGroups = groups.filter(group => group.status === 'idle').length
        const busyGroups = groups.filter(group => group.status === 'busy').length
        const errorGroups = groups.filter(group => group.status === 'error').length

        // 更新统计数据
        groupStatistics.value = {
            totalGroups,
            idleGroups,
            busyGroups,
            errorGroups
        }

        // 更新图表
        nextTick(() => {
            updatePieChart()
        })
    } catch (error) {
        console.error('获取群组统计信息失败:', error)
        ElMessage.error('获取群组统计信息失败')
    } finally {
        refreshing.value = false
    }
}

// 群组更新事件处理
const handleGroupUpdated = () => {
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

<template>
    <div class="group-manager-view">
        <el-row :gutter="20">
            <el-col :span="24">
                <h1>群组管理</h1>
            </el-col>
        </el-row>

        <el-row :gutter="20">
            <el-col :span="24">
                <el-tabs>
                    <!-- 群组统计（放在第一位，作为默认显示页） -->
                    <el-tab-pane label="群组统计">
                        <el-card class="stats-card" shadow="hover">
                            <template #header>
                                <div class="card-header">
                                    <span>群组统计信息</span>
                                    <div class="total-nodes">
                                        <span>群组总数：</span>
                                        <span class="total-count">{{ groupStatistics?.totalGroups || 0 }}</span>
                                    </div>
                                    <el-button type="primary" size="small" @click="refreshStatistics"
                                        :loading="refreshing">刷新</el-button>
                                </div>
                            </template>

                            <div class="chart-container" v-if="groupStatistics">
                                <el-row>
                                    <el-col :span="24">
                                        <div ref="pieChartRef" style="width: 100%; height: 300px;"></div>
                                    </el-col>
                                </el-row>
                            </div>

                            <el-divider v-if="groupStatistics">状态详情</el-divider>

                            <el-row :gutter="20" v-if="groupStatistics" class="mt-4">
                                <el-col :span="8">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>空闲群组</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ groupStatistics.idleGroups || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(groupStatistics.idleGroups, groupStatistics.totalGroups)"
                                                status="success"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>

                                <el-col :span="8">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>占用群组</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ groupStatistics.busyGroups || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(groupStatistics.busyGroups, groupStatistics.totalGroups)"
                                                status="warning"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>

                                <el-col :span="8">
                                    <el-card shadow="hover" class="metric-card">
                                        <template #header>
                                            <div class="metric-header">
                                                <span>异常群组</span>
                                            </div>
                                        </template>
                                        <div class="metric-value">
                                            <span class="metric-number">{{ groupStatistics.errorGroups || 0 }}</span>
                                            <el-progress
                                                :percentage="getPercentage(groupStatistics.errorGroups, groupStatistics.totalGroups)"
                                                status="exception"></el-progress>
                                        </div>
                                    </el-card>
                                </el-col>
                            </el-row>

                            <el-empty v-else description="暂无群组统计数据" />
                        </el-card>
                    </el-tab-pane>

                    <!-- 群组列表 -->
                    <el-tab-pane label="群组列表">
                        <GroupManagerComponent @group-updated="handleGroupUpdated" />
                    </el-tab-pane>
                </el-tabs>
            </el-col>
        </el-row>
    </div>
</template>

<style scoped>
.group-manager-view {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
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

.el-divider {
    margin: 30px 0 20px;
}

h1 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #303133;
}

.mt-4 {
    margin-top: 16px;
}
</style>
