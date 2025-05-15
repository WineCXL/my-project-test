<template>
    <div class="node-manager-container">
        <div class="page-header">
            <div class="left">
                <h2>边缘节点管理</h2>
                <p>管理系统中的边缘节点，执行注册和分组操作</p>
            </div>
            <div class="right">
                <el-button type="success" :icon="Plus" @click="handleAddNode">添加节点</el-button>
                <el-button type="primary" :icon="Refresh" @click="refreshNodes" :loading="loading">刷新</el-button>
            </div>
        </div>

        <el-card class="search-card">
            <div class="search-bar">
                <el-input v-model="searchQuery" placeholder="搜索节点" prefix-icon="Search" clearable />
            </div>
        </el-card>

        <el-card class="table-card">
            <el-table :data="filteredNodes.slice((currentPage - 1) * pageSize, currentPage * pageSize)" border
                style="width: 100%; table-layout: fixed;" v-loading="loading">
                <el-table-column prop="id" label="ID" align="center" width="60" />
                <el-table-column prop="nodeId" label="节点ID" align="center" width="110" />
                <el-table-column prop="nodeName" label="节点名称" align="center" width="110" />
                <el-table-column label="状态" align="center" width="90">
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="所属群组" align="center" width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.group" type="success">
                            {{ scope.row.group.groupName }}
                        </el-tag>
                        <span v-else>未分配</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" min-width="220">
                    <template #default="scope">
                        <div class="operation-buttons">
                            <el-button type="primary" :icon="View" size="small"
                                @click="handleViewNode(scope.row)">查看</el-button>
                            <el-button type="warning" :icon="Edit" size="small"
                                @click="handleEditNode(scope.row)">编辑</el-button>
                            <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteNode(scope.row)"
                                :disabled="scope.row.status === 'busy'">删除</el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination">
                <el-pagination background layout="prev, pager, next" :total="filteredNodes.length" :page-size="pageSize"
                    v-model:current-page="currentPage" />
            </div>
        </el-card>

        <!-- 节点表单对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%">
            <el-form ref="nodeFormRef" :model="nodeForm" :rules="rules" label-width="120px" label-position="left">
                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="节点ID" prop="nodeId">
                            <el-input v-model="nodeForm.nodeId" :disabled="isEdit" />
                        </el-form-item>
                    </el-col>

                    <el-col :span="24">
                        <el-form-item label="节点名称" prop="nodeName">
                            <el-input v-model="nodeForm.nodeName" />
                        </el-form-item>
                    </el-col>

                    <el-col :span="24">
                        <el-form-item label="私钥" prop="privateKey" v-if="isAdmin">
                            <el-input v-model="nodeForm.privateKey" type="textarea" :rows="4" placeholder="私钥将由系统自动生成"
                                disabled />
                            <div class="form-hint">私钥由系统在节点注册时自动生成，用于加密通信和验证</div>
                        </el-form-item>
                    </el-col>

                    <el-col :span="24">
                        <el-form-item label="随机数" prop="randomNumber" v-if="isAdmin">
                            <el-input v-model="nodeForm.randomNumber" type="textarea" :rows="4"
                                placeholder="随机数将由系统自动生成" disabled />
                            <div class="form-hint">随机数由系统在节点注册时自动生成，用于零知识证明</div>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitNodeForm" :loading="submitLoading">确定</el-button>
                    <el-button v-if="isEdit" type="success" @click="handleRegisterNode"
                        :loading="registerLoading">重新注册</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 节点详情对话框 -->
        <el-dialog v-model="detailsVisible" title="节点详情" width="60%">
            <el-descriptions :column="2" border v-if="currentNode">
                <el-descriptions-item label="节点ID">{{ currentNode.nodeId }}</el-descriptions-item>
                <el-descriptions-item label="节点名称">{{ currentNode.nodeName }}</el-descriptions-item>
                <el-descriptions-item label="节点状态">
                    <el-tag :type="getStatusType(currentNode.status)">
                        {{ getStatusText(currentNode.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="所属群组">
                    <template v-if="currentNode.groupId">
                        <el-tag type="success">{{ getGroupName(currentNode.groupId) }}</el-tag>
                    </template>
                    <el-tag v-else type="info">未分配</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDate(currentNode.createdAt) }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ formatDate(currentNode.updatedAt) }}</el-descriptions-item>
            </el-descriptions>

            <el-collapse v-if="currentNode && isAdmin" style="margin-top: 20px">
                <el-collapse-item title="节点私钥（敏感信息）" name="1">
                    <div class="key-container">
                        <pre>{{ currentNode.privateKey || '私钥信息保密' }}</pre>
                        <el-button v-if="currentNode.privateKey" type="primary" :icon="CopyDocument" size="small"
                            @click="copyToClipboard(currentNode.privateKey)" class="copy-button">
                            复制
                        </el-button>
                    </div>
                </el-collapse-item>
                <el-collapse-item title="节点随机数（敏感信息）" name="2" v-if="currentNode.randomNumber">
                    <div class="key-container">
                        <pre>{{ currentNode.randomNumber }}</pre>
                        <el-button type="primary" :icon="CopyDocument" size="small"
                            @click="copyToClipboard(currentNode.randomNumber)" class="copy-button">
                            复制
                        </el-button>
                    </div>
                </el-collapse-item>
            </el-collapse>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useNodeStore } from '../store/node'
import { useUserStore } from '../store/user'
import { useGroupStore } from '../store/group'
import { ElMessage, ElMessageBox } from 'element-plus'
import { registerNode } from '../api/node'
import { Plus, Edit, Delete, View, Search, Refresh, CopyDocument } from '@element-plus/icons-vue'

const emit = defineEmits(['node-updated'])
const nodeStore = useNodeStore()
const userStore = useUserStore()
const groupStore = useGroupStore()
const loading = ref(false)
const submitLoading = ref(false)
const registerLoading = ref(false)
const dialogVisible = ref(false)
const detailsVisible = ref(false)
const dialogTitle = ref('添加节点')
const isEdit = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const currentNode = ref(null)

// 判断是否为管理员
const isAdmin = computed(() => {
    return userStore.user && userStore.user.role === 'manager'
})

// 节点表单
const nodeForm = reactive({
    nodeId: '',
    nodeName: '',
    status: 'idle',
    privateKey: '',
    randomNumber: '',
    groupId: null
})

// 表单验证规则
const rules = {
    nodeId: [
        { required: true, message: '请输入节点ID', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在2到50个字符之间' }
    ],
    nodeName: [
        { required: true, message: '请输入节点名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在2到50个字符之间' }
    ]
}

const nodeFormRef = ref(null)

// 过滤后的节点列表
const filteredNodes = computed(() => {
    if (!searchQuery.value) {
        return nodeStore.nodes
    }

    const query = searchQuery.value.toLowerCase()
    return nodeStore.nodes.filter(node =>
        node.nodeId.toLowerCase().includes(query) ||
        node.nodeName.toLowerCase().includes(query)
    )
})

// 加载节点列表
onMounted(async () => {
    loading.value = true;
    try {
        // 先加载群组数据，确保群组数据加载完成
        await groupStore.fetchGroups();
        // 再加载节点数据
        await nodeStore.fetchNodes();
    } catch (error) {
        console.error('初始化数据失败:', error);
        ElMessage.error('加载数据失败，请刷新页面重试');
    } finally {
        loading.value = false;
    }
})

// 刷新节点列表
const refreshNodes = async () => {
    loading.value = true
    try {
        await nodeStore.fetchNodes()
    } catch (error) {
        console.error('获取节点列表失败:', error)
    } finally {
        loading.value = false
    }
}

// 打开添加节点对话框
const handleAddNode = () => {
    resetForm()
    dialogTitle.value = '添加节点'
    isEdit.value = false
    dialogVisible.value = true
}

// 查看节点详情
const handleViewNode = (node) => {
    currentNode.value = node
    detailsVisible.value = true
}

// 编辑节点
const handleEditNode = (node) => {
    resetForm()

    // 填充表单
    nodeForm.id = node.id
    nodeForm.nodeId = node.nodeId
    nodeForm.nodeName = node.nodeName
    nodeForm.status = node.status
    nodeForm.groupId = node.groupId

    // 管理员可以看到私钥和随机数
    if (isAdmin.value) {
        nodeForm.privateKey = node.privateKey
        nodeForm.randomNumber = node.randomNumber
    }

    dialogTitle.value = '编辑节点'
    isEdit.value = true
    dialogVisible.value = true
}

// 删除节点
const handleDeleteNode = (node) => {
    if (node.status === 'busy') {
        ElMessage.warning('无法删除忙碌状态的节点')
        return
    }

    ElMessageBox.confirm(
        `确定要删除节点 "${node.nodeName}" 吗？`,
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        try {
            // 尝试删除节点
            const result = await nodeStore.removeNode(node.id);

            // 删除成功，显示成功消息并刷新节点列表
            ElMessage.success("节点删除成功");
            refreshNodes();
        } catch (error) {
            // 手动显示错误消息
            console.error('删除节点失败:', error);
            ElMessage.error(error.message || "删除节点失败，可能是因为节点属于群组或处于忙碌状态");

            // 不刷新节点列表，因为删除失败
        }
    }).catch(() => {
        // 用户取消删除
    })
}

// 提交节点表单
const submitNodeForm = async () => {
    if (!nodeFormRef.value) return

    await nodeFormRef.value.validate(async (valid) => {
        if (valid) {
            submitLoading.value = true
            try {
                if (isEdit.value) {
                    // 更新节点
                    await nodeStore.updateNode(nodeForm.id, {
                        nodeName: nodeForm.nodeName,
                        status: nodeForm.status
                    })
                    ElMessage.success('节点更新成功')
                } else {
                    // 新增节点
                    try {
                        // 确保nodeId是字符串
                        const nodeIdStr = typeof nodeForm.nodeId === 'object' ?
                            (nodeForm.nodeId.toString ? nodeForm.nodeId.toString() : String(nodeForm.nodeId)) :
                            nodeForm.nodeId;

                        const response = await registerNode({
                            nodeId: nodeIdStr,
                            nodeName: nodeForm.nodeName,
                            status: nodeForm.status
                        });

                        // 直接检查response是否包含success字段
                        if (response && response.success) {
                            ElMessage.success('节点添加成功');
                            dialogVisible.value = false;
                            await refreshNodes();
                            emit('node-updated');
                        } else {
                            // 验证节点是否已添加成功
                            await nodeStore.fetchNodes();

                            const nodeExists = nodeStore.nodes.some(node =>
                                node.nodeId === nodeForm.nodeId
                            );

                            if (nodeExists) {
                                ElMessage.success('节点实际已成功添加');
                                dialogVisible.value = false;
                                emit('node-updated');
                            } else {
                                ElMessage.error(response?.message || '节点添加失败');
                            }
                        }
                    } catch (error) {
                        console.error('节点注册失败:', error);

                        // API调用出错，尝试检查节点是否已成功添加
                        try {
                            await nodeStore.fetchNodes();

                            // 检查节点是否已存在于数据库中
                            const nodeExists = nodeStore.nodes.some(node =>
                                node.nodeId === nodeForm.nodeId
                            );

                            if (nodeExists) {
                                // 节点实际上已成功添加
                                ElMessage.success('节点已成功注册，但返回数据有误');
                                dialogVisible.value = false;
                                emit('node-updated');
                            } else {
                                // 确实是注册失败
                                if (error.response && error.response.status === 409) {
                                    ElMessage.error('节点ID已存在，请使用其他ID');
                                } else {
                                    ElMessage.error('节点注册失败: ' + (error.message || '未知错误'));
                                }
                            }
                        } catch (fetchError) {
                            // 获取节点列表失败
                            console.error('获取节点列表失败:', fetchError);
                            ElMessage.error('节点注册失败，无法验证结果: ' + (error.message || '未知错误'));
                        }
                    }
                }

                dialogVisible.value = false
                refreshNodes()
                emit('node-updated')
            } catch (error) {
                console.error('保存节点失败:', error)
                ElMessage.error('保存节点失败: ' + error.message)
            } finally {
                submitLoading.value = false
            }
        }
    })
}

// 重新注册节点（调用加密引擎重新生成密钥和随机数）
const handleRegisterNode = async () => {
    registerLoading.value = true
    try {
        // 调用节点注册API
        const response = await registerNode({
            nodeId: nodeForm.nodeId,
            nodeName: nodeForm.nodeName
        })

        if (response.data && response.data.success) {
            ElMessage.success('节点重新注册成功')
            dialogVisible.value = false
            refreshNodes()
            emit('node-updated')
        } else {
            ElMessage.error(response.data?.message || '节点重新注册失败')
        }
    } catch (error) {
        console.error('节点重新注册失败:', error)
        ElMessage.error('节点重新注册失败')
    } finally {
        registerLoading.value = false
    }
}

// 重置表单
const resetForm = () => {
    // 重置表单字段
    nodeForm.id = ''
    nodeForm.nodeId = ''
    nodeForm.nodeName = ''
    nodeForm.status = 'idle'
    nodeForm.privateKey = ''
    nodeForm.randomNumber = ''
    nodeForm.groupId = null

    // 重置表单验证
    if (nodeFormRef.value) {
        nodeFormRef.value.resetFields()
    }
}

// 格式化日期
const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleString()
}

// 获取状态类型
const getStatusType = (status) => {
    switch (status) {
        case 'idle': return 'success'
        case 'busy': return 'warning'
        case 'error': return 'danger'
        default: return 'info'
    }
}

// 获取状态文本
const getStatusText = (status) => {
    switch (status) {
        case 'idle': return '空闲'
        case 'busy': return '占用'
        case 'error': return '异常'
        default: return '未知'
    }
}

// 获取群组名称
const getGroupName = (groupId) => {
    const group = groupStore.groups.find(g => g.id === groupId)
    return group ? group.groupName : '未知群组'
}

// 复制到剪贴板
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            ElMessage.success('已复制到剪贴板')
        })
        .catch(err => {
            console.error('复制失败:', err)
            ElMessage.error('复制失败')
        })
}
</script>

<style scoped>
.node-manager-container {
    padding: 0 0 20px 0;
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

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.form-hint {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
    margin-top: 5px;
}

.key-container {
    position: relative;
    background: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    font-family: monospace;
    max-height: 250px;
    overflow-y: auto;
}

.key-container pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
}

.copy-button {
    position: absolute;
    top: 10px;
    right: 10px;
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
</style>
