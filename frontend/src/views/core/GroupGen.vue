<template>
    <div class="group-gen-container">
        <el-card class="group-card">
            <template #header>
                <div class="card-header">
                    <h2>群组生成 (GroupGen)</h2>
                    <p>实现论文中的GroupGen算法，为边缘节点群组生成密钥</p>
                </div>
            </template>

            <div class="group-list" v-if="groups.length > 0">
                <h3>已创建群组</h3>
                <el-table :data="groups" stripe style="width: 100%">
                    <el-table-column prop="groupId" label="群组ID" width="180" />
                    <el-table-column prop="groupName" label="群组名称" width="180" />
                    <el-table-column prop="status" label="状态">
                        <template #default="scope">
                            <el-tag :type="getStatusType(scope.row.status)">
                                {{ getStatusText(scope.row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="成员数">
                        <template #default="scope">
                            <el-tag type="info">
                                {{ scope.row.memberNodeIds?.length || 0 }}/5
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作">
                        <template #default="scope">
                            <el-button size="small" @click="viewGroupDetails(scope.row)">
                                查看
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <el-divider v-if="groups.length > 0" />

            <div class="create-form">
                <h3>创建新群组</h3>
                <el-form :model="groupForm" ref="groupFormRef" :rules="rules" label-width="120px">
                    <el-form-item label="群组ID" prop="groupId">
                        <el-input v-model="groupForm.groupId" placeholder="输入唯一群组标识符" />
                    </el-form-item>

                    <el-form-item label="群组名称" prop="groupName">
                        <el-input v-model="groupForm.groupName" placeholder="输入群组名称" />
                    </el-form-item>

                    <el-form-item label="自动选择节点">
                        <el-switch v-model="autoSelectNodes" active-text="启用" inactive-text="禁用"></el-switch>
                        <div class="form-hint" v-if="autoSelectNodes">系统将自动从空闲节点中选择4个节点组成群组</div>
                    </el-form-item>

                    <el-form-item label="群组成员" prop="nodeIds" v-if="!autoSelectNodes">
                        <el-select v-model="groupForm.nodeIds" multiple filterable :multiple-limit="4"
                            placeholder="请选择4个空闲节点作为群组成员" style="width: 100%">
                            <el-option v-for="node in availableNodes" :key="node.nodeId"
                                :label="`${node.nodeName} (${node.nodeId})`" :value="node.nodeId" />
                        </el-select>
                        <div class="form-hint">群组必须由4个节点组成</div>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="createGroup" :loading="loading">
                            创建群组
                        </el-button>
                        <el-button @click="resetForm">重置</el-button>
                    </el-form-item>
                </el-form>

                <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="true"
                    @close="errorMessage = ''" show-icon />
            </div>

            <!-- 群组详情对话框 -->
            <el-dialog v-model="dialogVisible" title="群组详情" width="60%">
                <el-descriptions border :column="1" v-if="selectedGroup">
                    <el-descriptions-item label="群组ID">{{ selectedGroup.groupId }}</el-descriptions-item>
                    <el-descriptions-item label="群组名称">{{ selectedGroup.groupName }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusType(selectedGroup.status)">
                            {{ getStatusText(selectedGroup.status) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="公钥">
                        <el-input type="textarea" :rows="3" v-model="selectedGroup.publicKey" readonly />
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ formatDate(selectedGroup.createdAt) }}</el-descriptions-item>
                    <el-descriptions-item label="成员节点">
                        <div v-if="selectedGroup.memberNodeIds && selectedGroup.memberNodeIds.length > 0">
                            <el-table :data="getGroupMemberDetails(selectedGroup.memberNodeIds)" border stripe>
                                <el-table-column prop="nodeId" label="节点ID" width="100" />
                                <el-table-column prop="nodeName" label="节点名称" />
                                <el-table-column prop="status" label="状态">
                                    <template #default="scope">
                                        <el-tag :type="getStatusType(scope.row.status)">
                                            {{ getStatusText(scope.row.status) }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="zkpIdentity" label="身份标识" show-overflow-tooltip />
                            </el-table>
                        </div>
                        <el-empty v-else description="暂无成员节点" />
                    </el-descriptions-item>
                </el-descriptions>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">关闭</el-button>
                        <el-button type="primary" @click="verifyGroupNodes" :loading="verifying">
                            验证节点身份
                        </el-button>
                    </span>
                </template>
            </el-dialog>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

export default {
    name: 'GroupGenView',

    setup() {
        const groups = ref([]);
        const availableNodes = ref([]);
        const loading = ref(false);
        const verifying = ref(false);
        const errorMessage = ref('');
        const dialogVisible = ref(false);
        const selectedGroup = ref(null);
        const autoSelectNodes = ref(true);

        const groupForm = reactive({
            groupId: '',
            groupName: '',
            nodeIds: [],
        });

        const rules = {
            groupId: [
                { required: true, message: '请输入群组ID', trigger: 'blur' },
                { min: 3, max: 20, message: '长度在3到20个字符之间', trigger: 'blur' }
            ],
            groupName: [
                { required: true, message: '请输入群组名称', trigger: 'blur' }
            ],
            nodeIds: [
                {
                    validator: (rule, value, callback) => {
                        if (!autoSelectNodes.value && (!value || value.length !== 4)) {
                            callback(new Error('请选择恰好54个节点'));
                        } else {
                            callback();
                        }
                    },
                    trigger: 'change'
                }
            ]
        };

        const groupFormRef = ref(null);

        // 获取所有群组
        const fetchGroups = async () => {
            loading.value = true;

            try {
                const response = await axios.get('/api/groups');

                if (response.data.success) {
                    groups.value = response.data.data;
                } else {
                    errorMessage.value = response.data.message || '获取群组列表失败';
                }
            } catch (error) {
                console.error('获取群组列表时发生错误:', error);
                errorMessage.value = error.response?.data?.message || '获取群组列表失败，请稍后重试';
            } finally {
                loading.value = false;
            }
        };

        // 获取所有可用节点
        const fetchNodes = async () => {
            try {
                const response = await axios.get('/api/nodes');

                if (response.data.success) {
                    availableNodes.value = response.data.data.filter(node => node.status === 'idle');
                } else {
                    errorMessage.value = response.data.message || '获取节点列表失败';
                }
            } catch (error) {
                console.error('获取节点列表时发生错误:', error);
                errorMessage.value = error.response?.data?.message || '获取节点列表失败，请稍后重试';
            }
        };

        // 创建新群组
        const createGroup = async () => {
            // 表单验证
            if (!groupFormRef.value) return;

            await groupFormRef.value.validate(async (valid) => {
                if (!valid) {
                    return false;
                }

                loading.value = true;
                errorMessage.value = '';

                try {
                    // 如果启用自动选择，从空闲节点中随机选择5个
                    let selectedNodeIds = groupForm.nodeIds;

                    if (autoSelectNodes.value) {
                        if (availableNodes.value.length < 5) {
                            errorMessage.value = '空闲节点数量不足，无法创建群组';
                            loading.value = false;
                            return;
                        }

                        // 随机选择5个节点
                        const shuffled = [...availableNodes.value].sort(() => 0.5 - Math.random());
                        selectedNodeIds = shuffled.slice(0, 5).map(node => node.nodeId);
                    } else if (selectedNodeIds.length !== 5) {
                        errorMessage.value = '请选择恰好5个节点组成群组';
                        loading.value = false;
                        return;
                    }

                    const response = await axios.post('/api/groups', {
                        ...groupForm,
                        nodeIds: selectedNodeIds
                    });

                    if (response.data.success) {
                        ElMessage.success('群组创建成功');
                        // 重新获取群组列表
                        fetchGroups();
                        // 重置表单
                        resetForm();
                    } else {
                        errorMessage.value = response.data.message || '群组创建失败';
                    }
                } catch (error) {
                    console.error('创建群组时发生错误:', error);
                    errorMessage.value = error.response?.data?.message || '群组创建失败，请稍后重试';
                } finally {
                    loading.value = false;
                }
            });
        };

        // 重置表单
        const resetForm = () => {
            if (groupFormRef.value) {
                groupFormRef.value.resetFields();
            }
            autoSelectNodes.value = true;
        };

        // 查看群组详情
        const viewGroupDetails = (group) => {
            selectedGroup.value = group;
            dialogVisible.value = true;
        };

        // 获取群组成员详细信息
        const getGroupMemberDetails = (memberIds) => {
            if (!memberIds || memberIds.length === 0) return [];

            return memberIds.map(nodeId => {
                const node = availableNodes.value.find(n => n.nodeId === nodeId) || {
                    nodeId: nodeId,
                    nodeName: '未知节点',
                    status: 'error',
                    zkpIdentity: '未知'
                };
                return node;
            });
        };

        // 验证群组节点身份
        const verifyGroupNodes = async () => {
            if (!selectedGroup.value) return;

            verifying.value = true;

            try {
                const response = await axios.post(`/api/groups/${selectedGroup.value.groupId}/verify`);

                if (response.data.success) {
                    ElMessage.success('节点身份验证成功');
                    // 刷新群组数据
                    fetchGroups();
                } else {
                    errorMessage.value = response.data.message || '节点身份验证失败';
                }
            } catch (error) {
                console.error('验证节点身份时发生错误:', error);
                errorMessage.value = error.response?.data?.message || '验证失败，请稍后重试';
            } finally {
                verifying.value = false;
                dialogVisible.value = false;
            }
        };

        // 获取节点名称
        const getNodeName = (nodeId) => {
            const node = availableNodes.value.find(n => n.nodeId === nodeId);
            return node ? `${node.nodeName} (${nodeId})` : nodeId;
        };

        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return '';

            const date = new Date(timestamp);
            return date.toLocaleString();
        };

        // 获取节点和群组状态标签类型
        const getStatusType = (status) => {
            const statusMap = {
                idle: 'success',
                busy: 'warning',
                error: 'danger'
            }
            return statusMap[status] || 'info'
        }

        // 获取状态显示文本
        const getStatusText = (status) => {
            const statusMap = {
                idle: '空闲',
                busy: '占用',
                error: '异常'
            }
            return statusMap[status] || status
        }

        // 组件挂载时获取群组和节点列表
        onMounted(() => {
            fetchGroups();
            fetchNodes();
        });

        return {
            groups,
            availableNodes,
            loading,
            verifying,
            errorMessage,
            groupForm,
            rules,
            groupFormRef,
            dialogVisible,
            selectedGroup,
            autoSelectNodes,
            createGroup,
            resetForm,
            viewGroupDetails,
            getNodeName,
            getGroupMemberDetails,
            verifyGroupNodes,
            formatDate,
            getStatusType,
            getStatusText
        };
    }
};
</script>

<style scoped>
.group-gen-container {
    padding: 20px;
}

.group-card {
    max-width: 1000px;
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

.group-list {
    margin-top: 20px;
}

.group-list h3 {
    margin-bottom: 16px;
    color: #303133;
}

.create-form {
    margin-top: 20px;
}

.create-form h3 {
    margin-bottom: 16px;
    color: #303133;
}

.form-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}
</style>
