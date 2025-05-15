<template>
    <div class="edge-node-container">
        <el-card class="edge-node-card">
            <template #header>
                <div class="card-header">
                    <h2>边缘节点注册 (EdgeNodeReg)</h2>
                    <p>实现论文中的EdgeNodeReg算法，为边缘节点生成专用密钥</p>
                </div>
            </template>

            <div class="node-list" v-if="nodes.length > 0">
                <h3>已注册节点</h3>
                <el-table :data="nodes" stripe style="width: 100%">
                    <el-table-column prop="nodeId" label="节点ID" width="180" />
                    <el-table-column prop="nodeName" label="节点名称" width="180" />
                    <el-table-column prop="status" label="状态">
                        <template #default="scope">
                            <el-tag :type="getStatusType(scope.row.status)">
                                {{ getStatusText(scope.row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="nodeLocation" label="位置" />
                    <el-table-column label="操作">
                        <template #default="scope">
                            <el-button size="small" @click="viewNodeDetails(scope.row)">
                                查看
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <el-divider v-if="nodes.length > 0" />

            <div class="register-form">
                <h3>注册新节点</h3>
                <el-form :model="nodeForm" ref="nodeFormRef" :rules="rules" label-width="120px">
                    <el-form-item label="节点ID" prop="nodeId">
                        <el-input v-model="nodeForm.nodeId" placeholder="输入唯一节点标识符" />
                    </el-form-item>

                    <el-form-item label="节点名称" prop="nodeName">
                        <el-input v-model="nodeForm.nodeName" placeholder="输入节点名称" />
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="registerNode" :loading="loading">
                            注册节点
                        </el-button>
                        <el-button @click="resetForm">重置</el-button>
                    </el-form-item>
                </el-form>

                <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="true"
                    @close="errorMessage = ''" show-icon />
            </div>

            <!-- 节点详情对话框 -->
            <el-dialog v-model="dialogVisible" title="节点详情" width="50%">
                <el-descriptions border :column="1" v-if="selectedNode">
                    <el-descriptions-item label="节点ID">{{ selectedNode.nodeId }}</el-descriptions-item>
                    <el-descriptions-item label="节点名称">{{ selectedNode.nodeName }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusType(selectedNode.status)">
                            {{ getStatusText(selectedNode.status) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ formatDate(selectedNode.createdAt) }}</el-descriptions-item>
                </el-descriptions>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">关闭</el-button>
                    </span>
                </template>
            </el-dialog>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

export default {
    name: 'EdgeNodeRegView',

    setup() {
        const nodes = ref([]);
        const loading = ref(false);
        const errorMessage = ref('');
        const dialogVisible = ref(false);
        const selectedNode = ref(null);

        const nodeForm = reactive({
            nodeId: '',
            nodeName: '',
        });

        const rules = {
            nodeId: [
                { required: true, message: '请输入节点ID', trigger: 'blur' },
                { min: 3, max: 20, message: '长度在3到20个字符之间', trigger: 'blur' }
            ],
            nodeName: [
                { required: true, message: '请输入节点名称', trigger: 'blur' }
            ]
        };

        const nodeFormRef = ref(null);

        // 获取所有节点
        const fetchNodes = async () => {
            loading.value = true;

            try {
                const response = await axios.get('/api/nodes');

                if (response.data.success) {
                    nodes.value = response.data.data;
                } else {
                    errorMessage.value = response.data.message || '获取节点列表失败';
                }
            } catch (error) {
                console.error('获取节点列表时发生错误:', error);
                errorMessage.value = error.response?.data?.message || '获取节点列表失败，请稍后重试';
            } finally {
                loading.value = false;
            }
        };

        // 注册新节点
        const registerNode = async () => {
            // 表单验证
            if (!nodeFormRef.value) return;

            await nodeFormRef.value.validate(async (valid) => {
                if (!valid) {
                    return false;
                }

                loading.value = true;
                errorMessage.value = '';

                try {
                    const response = await axios.post('/api/nodes', nodeForm);

                    if (response.data.success) {
                        ElMessage.success('节点注册成功');
                        // 重新获取节点列表
                        fetchNodes();
                        // 重置表单
                        resetForm();
                    } else {
                        errorMessage.value = response.data.message || '节点注册失败';
                    }
                } catch (error) {
                    console.error('注册节点时发生错误:', error);
                    errorMessage.value = error.response?.data?.message || '节点注册失败，请稍后重试';
                } finally {
                    loading.value = false;
                }
            });
        };

        // 重置表单
        const resetForm = () => {
            if (nodeFormRef.value) {
                nodeFormRef.value.resetFields();
            }
        };

        // 查看节点详情
        const viewNodeDetails = (node) => {
            selectedNode.value = node;
            dialogVisible.value = true;
        };

        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return '';

            const date = new Date(timestamp);
            return date.toLocaleString();
        };

        // 获取状态标签类型
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

        // 组件挂载时获取节点列表
        onMounted(() => {
            fetchNodes();
        });

        return {
            nodes,
            loading,
            errorMessage,
            nodeForm,
            rules,
            nodeFormRef,
            dialogVisible,
            selectedNode,
            registerNode,
            resetForm,
            viewNodeDetails,
            formatDate,
            getStatusType,
            getStatusText
        };
    }
};
</script>

<style scoped>
.edge-node-container {
    padding: 20px;
}

.edge-node-card {
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

.node-list {
    margin-top: 20px;
}

.node-list h3 {
    margin-bottom: 16px;
    color: #303133;
}

.register-form {
    margin-top: 20px;
}

.register-form h3 {
    margin-bottom: 16px;
    color: #303133;
}
</style>
