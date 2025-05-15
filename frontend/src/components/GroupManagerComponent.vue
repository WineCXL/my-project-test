<template>
    <div class="group-manager-component">
        <div class="page-header">
            <div class="left">
                <h2>群组管理</h2>
                <p>管理系统中的群组，执行创建和成员分配操作</p>
            </div>
            <div class="right">
                <el-button type="success" :icon="Plus" @click="handleAddGroup">添加群组</el-button>
                <el-button type="primary" :icon="Refresh" @click="refreshGroups" :loading="loading">刷新</el-button>
            </div>
        </div>

        <el-card class="search-card">
            <div class="search-bar">
                <el-input v-model="searchQuery" placeholder="搜索群组" prefix-icon="Search" clearable />
            </div>
        </el-card>

        <el-card class="table-card">
            <el-table :data="filteredGroups" style="width: 100%; table-layout: fixed;" border stripe
                v-loading="loading">
                <el-table-column prop="id" label="ID" width="60" align="center" />
                <el-table-column prop="groupId" label="节点组ID" width="110" align="center" />
                <el-table-column prop="groupName" label="节点组名称" min-width="120" align="center" />
                <el-table-column prop="status" label="状态" width="90" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">
                            {{ getStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" min-width="220">
                    <template #default="scope">
                        <div class="operation-buttons">
                            <el-button type="primary" :icon="Edit" size="small" @click="handleEditGroup(scope.row)">
                                编辑
                            </el-button>
                            <el-button type="info" :icon="User" size="small" @click="handleManageMembers(scope.row)">
                                成员
                            </el-button>
                            <el-button type="success" :icon="Check" size="small" @click="handleVerifyGroup(scope.row)">
                                验证
                            </el-button>
                            <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteGroup(scope.row)">
                                删除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-if="filteredGroups.length === 0" description="暂无群组数据" />
        </el-card>

        <!-- 添加/编辑群组对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%" :close-on-click-modal="false">
            <el-form ref="groupFormRef" :model="groupForm" :rules="rules" label-position="top">
                <el-row :gutter="20">
                    <el-col :md="12">
                        <el-form-item label="群组ID" prop="groupId">
                            <el-input v-model="groupForm.groupId" placeholder="请输入群组ID" :disabled="isEdit" />
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="群组名称" prop="groupName">
                            <el-input v-model="groupForm.groupName" placeholder="请输入群组名称" />
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="节点数量">
                            <el-input value="4" disabled>
                                <template #append>
                                    <el-tooltip content="系统要求每个群组固定包含4个节点" placement="top">
                                        <el-icon>
                                            <InfoFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </template>
                            </el-input>
                            <div class="form-hint">系统要求每个群组固定包含4个节点</div>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitGroupForm">{{ isEdit ? '更新' : '添加' }}</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 管理群组成员对话框 -->
        <el-dialog v-model="memberDialogVisible" title="管理群组成员" width="60%" :close-on-click-modal="false">
            <div v-loading="membersLoading">
                <!-- 添加成员 -->
                <el-card class="member-card">
                    <template #header>
                        <div class="card-header">
                            <span>添加成员</span>
                        </div>
                    </template>

                    <el-row :gutter="20">
                        <el-col :md="18">
                            <el-select v-model="selectedNodeId" placeholder="选择要添加的节点" style="width: 100%" filterable>
                                <el-option v-for="node in availableNodes" :key="node.id" :label="node.name"
                                    :value="node.id">
                                    <div style="display: flex; justify-content: space-between; align-items: center">
                                        <span>{{ node.name }}</span>
                                        <span style="color: #8492a6; font-size: 13px">{{ node.address }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                        </el-col>
                        <el-col :md="6">
                            <el-button type="primary" @click="handleAddMember" :disabled="!selectedNodeId">
                                添加成员
                            </el-button>
                        </el-col>
                    </el-row>
                </el-card>

                <!-- 成员列表 -->
                <el-card class="member-card">
                    <template #header>
                        <div class="card-header">
                            <span>群组成员列表</span>
                            <el-tag type="info">{{ currentGroupMembers.length || 0 }}个成员</el-tag>
                        </div>
                    </template>

                    <el-table :data="currentGroupMembers" style="width: 100%" border stripe>
                        <el-table-column label="节点ID" prop="node_id" width="100" />
                        <el-table-column label="节点名称" min-width="150">
                            <template #default="{ row }">
                                {{ getNodeName(row.node_id) }}
                            </template>
                        </el-table-column> <el-table-column label="加入时间" min-width="150">
                            <template #default="{ row }">
                                {{ row.joinedAt ? new Date(row.joinedAt).toLocaleString() : '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="120">
                            <template #default="{ row }">
                                <el-button type="danger" size="small" @click="handleRemoveMember(row)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon> 移除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>

                    <el-empty v-if="currentGroupMembers.length === 0" description="暂无群组成员" />
                </el-card>
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="memberDialogVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useGroupStore } from '../store/group'
import { useNodeStore } from '../store/node'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGroupMembers, addGroupMember, removeGroupMember, verifyGroup } from '../api/group'
import { InfoFilled, Search, Plus, Edit, Delete, User, Check, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

const emit = defineEmits(['group-updated'])

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

// 群组表单
const groupForm = reactive({
    groupId: '',
    groupName: '',
    status: 'idle'
})

// 表单验证规则
const rules = {
    groupId: [
        { required: true, message: '请输入群组ID' },
        { min: 3, max: 50, message: '长度在3到50个字符之间' }
    ],
    groupName: [
        { required: true, message: '请输入群组名称' },
        { min: 2, max: 50, message: '长度在2到50个字符之间' }
    ],
}

const groupFormRef = ref(null)

// 过滤后的群组列表
const filteredGroups = computed(() => {
    if (!searchQuery.value) {
        return groupStore.groups
    }

    const query = searchQuery.value.toLowerCase()
    return groupStore.groups.filter(group =>
        group.groupName.toLowerCase().includes(query)
    )
})

// 可选节点列表（排除已是成员的节点）
const availableNodes = computed(() => {
    // 获取当前群组成员的节点ID列表
    const memberIds = currentGroupMembers.value.map(member => member.node_id)

    // 过滤出未加入当前群组的节点
    return nodeStore.nodes.filter(node => !memberIds.includes(node.id))
})

// 刷新群组列表
const refreshGroups = async () => {
    loading.value = true
    try {
        await Promise.all([
            groupStore.fetchGroups(),
            nodeStore.fetchNodes()
        ])
        emit('group-updated')
    } catch (error) {
        console.error('获取数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 加载群组列表
onMounted(async () => {
    loading.value = true
    try {
        await Promise.all([
            groupStore.fetchGroups(),
            nodeStore.fetchNodes()
        ])
    } catch (error) {
        console.error('获取数据失败:', error)
    } finally {
        loading.value = false
    }
})

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
        groupId: group.groupId,
        groupName: group.groupName,
    })

    dialogVisible.value = true
}

// 处理删除群组
const handleDeleteGroup = async (group) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除群组"${group.groupName}"吗？`,
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
            emit('group-updated')
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
                    result = await groupStore.updateGroup(groupId, {
                        groupName: groupForm.groupName,
                        status: 'idle'
                    })
                    if (result) {
                        ElMessage({
                            message: '更新群组成功',
                            type: 'success'
                        })
                    }
                } else {
                    // 添加群组 - 确保传递groupId字段
                    result = await groupStore.createGroup({
                        groupId: groupForm.groupId,
                        groupName: groupForm.groupName,
                        status: 'idle',
                        maxNodes: 4  // 固定节点数量为4
                    })
                    if (result) {
                        ElMessage({
                            message: '添加群组成功',
                            type: 'success'
                        })
                    }
                }

                if (result) {
                    dialogVisible.value = false
                    emit('group-updated')
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
        groupId: '',
        groupName: '',
        status: 'idle'
    })
}

// 管理群组成员
const handleManageMembers = async (group) => {
    currentGroupId.value = group.id;
    membersLoading.value = true;

    try {
        const response = await getGroupMembers(group.id);
        // 直接赋值，不添加调试输出
        currentGroupMembers.value = response.data || [];
    } catch (error) {
        console.error("获取群组成员失败:", error);
        ElMessage({
            message: "获取群组成员失败",
            type: "error"
        });
        currentGroupMembers.value = []; // 失败时置空
    } finally {
        membersLoading.value = false;
        memberDialogVisible.value = true;
    }
};

// 添加成员到群组
const handleAddMember = async () => {
    if (!selectedNodeId.value || !currentGroupId.value) {
        ElMessage({
            message: '请选择要添加的节点',
            type: 'warning'
        })
        return
    }

    // 验证群组成员数量是否已经达到4个
    if (currentGroupMembers.value.length >= 4) {
        ElMessage({
            message: '群组成员已达上限(4个)，请先移除一些成员',
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
        emit('group-updated')

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
        emit('group-updated')
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
const getStatusType = (status) => {
    const statusMap = {
        idle: 'success',
        busy: 'warning',
        error: 'danger'
    }
    return statusMap[status] || 'info'
}

// 获取群组状态文本
const getStatusText = (status) => {
    const statusMap = {
        idle: '空闲',
        busy: '占用',
        error: '异常'
    }
    return statusMap[status] || status
}

// 获取节点名称
const getNodeName = (nodeId) => {
    const node = nodeStore.getNodeById(nodeId)
    // 返回节点名称，根据节点对象的结构选择正确的属性
    return node ? (node.nodeName || node.name || `节点-${nodeId}`) : `未知节点(ID: ${nodeId})`
}

// 验证群组节点
const handleVerifyGroup = async (group) => {
    try {
        await ElMessageBox.confirm(
            `确定要验证群组"${group.groupName}"的节点身份吗？`,
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }
        )

        loading.value = true
        try {
            console.log("要验证的群组ID:", group.id);

            // 使用原有的API函数（它已经有正确的基础URL配置）
            const response = await verifyGroup(group.id);
            console.log("验证响应数据:", response);

            // 判断验证是否成功
            // 通常，后端API会返回一个包装好的响应，其中data字段包含实际业务数据
            if (response.success && response.data && response.data.allValid) {
                ElMessage({
                    message: response.message || '群组验证成功，所有节点身份有效',
                    type: 'success'
                });
            } else {
                ElMessage({
                    message: response.message || '群组验证失败，检测到节点异常',
                    type: 'warning'
                });
            }

            // 刷新群组数据
            await groupStore.fetchGroups();
            emit('group-updated');
        } catch (error) {
            console.error('验证群组节点失败:', error);
            // 显示更详细的错误信息
            let errorMessage = '验证群组节点失败';
            if (error.response && error.response.data) {
                errorMessage += ': ' + (error.response.data.message || error.message);
            } else if (error.message) {
                errorMessage += ': ' + error.message;
            }

            ElMessage({
                message: errorMessage,
                type: 'error'
            });
        } finally {
            loading.value = false;
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('操作取消:', error);
        }
    }
}
</script>

<style scoped>
.group-manager-component {
    width: 100%;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.page-header .left h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
}

.page-header .left p {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.page-header .right {
    display: flex;
    gap: 10px;
}

.search-card {
    margin-bottom: 20px;
}

.search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-card {
    margin-bottom: 20px;
    overflow-x: auto;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-input {
    width: 300px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.member-card {
    margin-bottom: 20px;
}

.member-card:last-child {
    margin-bottom: 0;
}

.form-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}

.operation-buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    gap: 5px;
    white-space: nowrap;
}

.mt-20 {
    margin-top: 20px;
}
</style>
