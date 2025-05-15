<template>
    <div class="match-verify">
        <el-card class="verify-card">
            <template #header>
                <div class="card-header">
                    <h2>匹配验证（Match Verify）</h2>
                    <span class="subtitle">
                        验证加密元数据是否包含指定关键词，并分配资源
                    </span>
                </div>
            </template>

            <el-form ref="verifyForm" :model="verifyForm" :rules="rules" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-alert title="匹配验证是元数据隐私保护的关键步骤" type="info" description="通过安全的配对运算验证关键词匹配，同时保持元数据内容的私密性"
                            :closable="false" class="mb-20" />
                    </el-col>

                    <el-col :span="12">
                        <el-form-item label="授权令牌" prop="tokenId">
                            <el-select v-model="verifyForm.tokenId" placeholder="选择授权令牌" style="width: 100%" filterable
                                clearable @change="getTokenDetails">
                                <el-option v-for="token in tokens" :key="token.id"
                                    :label="`${token.keyword} (${token.id})`" :value="token.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :span="12">
                        <el-form-item label="元数据" prop="metadataId">
                            <el-select v-model="verifyForm.metadataId" placeholder="选择加密元数据" style="width: 100%"
                                filterable clearable>
                                <el-option v-for="metadata in metadataList" :key="metadata.id"
                                    :label="`${metadata.tag} (${metadata.id})`" :value="metadata.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :span="12">
                        <el-form-item label="边缘节点" prop="edgeNodeId">
                            <el-select v-model="verifyForm.edgeNodeId" placeholder="选择边缘节点" style="width: 100%"
                                filterable clearable @change="getNodeDetails">
                                <el-option v-for="node in nodes" :key="node.nodeId"
                                    :label="`${node.nodeName || node.nodeId}`" :value="node.nodeId" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :span="12">
                        <el-form-item>
                            <el-button type="primary" :loading="loading" @click="verifyMatch">
                                验证匹配
                            </el-button>
                            <el-button @click="resetForm">重置</el-button>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <!-- 匹配结果展示 -->
            <div v-if="matchResults.length > 0" class="match-results">
                <h3>匹配结果</h3>
                <el-table :data="matchResults" border style="width: 100%" row-key="id">
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="tokenId" label="令牌ID" width="120" />
                    <el-table-column prop="metadataId" label="元数据ID" width="120" />
                    <el-table-column prop="edgeNodeId" label="边缘节点" width="120" />
                    <el-table-column label="匹配结果" width="120">
                        <template #default="scope">
                            <el-tag :type="scope.row.isMatched ? 'success' : 'danger'">
                                {{ scope.row.isMatched ? '匹配' : '不匹配' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="verifiedAt" label="验证时间" width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.verifiedAt) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作">
                        <template #default="scope">
                            <el-button v-if="scope.row.isMatched" type="success" size="small"
                                @click="allocateResource(scope.row)">
                                分配资源
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 资源分配结果 -->
            <div v-if="allocationResult" class="allocation-results">
                <h3>资源分配结果</h3>
                <el-alert :title="allocationResult.status === 'success' ? '资源分配成功' : '资源分配失败'"
                    :type="allocationResult.status === 'success' ? 'success' : 'error'"
                    :description="allocationResult.message || ''" show-icon :closable="false" class="mb-20" />

                <div v-if="allocationResult.allocations && allocationResult.allocations.length > 0">
                    <el-table :data="allocationResult.allocations" border style="width: 100%">
                        <el-table-column prop="metadataId" label="元数据ID" width="120" />
                        <el-table-column prop="tag" label="标签" width="120" />
                        <el-table-column prop="nodeId" label="分配节点" width="120" />
                        <el-table-column prop="timestamp" label="分配时间" width="180">
                            <template #default="scope">
                                {{ formatDate(scope.row.timestamp * 1000) }}
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import matchService from '@/api/match';
import authService from '@/api/authorization';
import nodeService from '@/api/node';
import metadataService from '@/api/metadata';

export default {
    name: 'MatchVerify',

    setup() {
        // 表单数据
        const verifyForm = reactive({
            tokenId: '',
            metadataId: '',
            edgeNodeId: '',
        });

        // 表单规则
        const rules = {
            tokenId: [{ required: true, message: '请选择授权令牌', trigger: 'change' }],
            metadataId: [{ required: true, message: '请选择加密元数据', trigger: 'change' }],
            edgeNodeId: [{ required: true, message: '请选择边缘节点', trigger: 'change' }],
        };

        const verifyFormRef = ref(null);
        const loading = ref(false);
        const tokens = ref([]);
        const metadataList = ref([]);
        const nodes = ref([]);
        const matchResults = ref([]);
        const allocationResult = ref(null);
        const selectedToken = ref(null);
        const selectedNode = ref(null);

        // 初始化
        onMounted(async () => {
            try {
                loading.value = true;
                await Promise.all([
                    loadTokens(),
                    loadMetadata(),
                    loadNodes(),
                ]);
            } catch (error) {
                ElMessage.error('加载数据失败: ' + error.message);
            } finally {
                loading.value = false;
            }
        });

        // 加载授权令牌
        const loadTokens = async () => {
            try {
                const response = await authService.getTokens();
                tokens.value = response.data.data || [];
            } catch (error) {
                console.error('加载授权令牌失败:', error);
                ElMessage.error('加载授权令牌失败');
            }
        };

        // 加载元数据
        const loadMetadata = async () => {
            try {
                const response = await metadataService.getAllMetadata();
                metadataList.value = response.data.data || [];
            } catch (error) {
                console.error('加载元数据失败:', error);
                ElMessage.error('加载元数据失败');
            }
        };

        // 加载边缘节点
        const loadNodes = async () => {
            try {
                const response = await nodeService.getAllNodes();
                nodes.value = response.data.data.filter(node => node.nodeType === 'edge') || [];
            } catch (error) {
                console.error('加载边缘节点失败:', error);
                ElMessage.error('加载边缘节点失败');
            }
        };

        // 获取令牌详情
        const getTokenDetails = async (tokenId) => {
            if (!tokenId) return;

            try {
                const response = await authService.getToken(tokenId);
                selectedToken.value = response.data.data;
            } catch (error) {
                console.error('获取令牌详情失败:', error);
                ElMessage.error('获取令牌详情失败');
            }
        };

        // 获取节点详情
        const getNodeDetails = async (nodeId) => {
            if (!nodeId) return;

            try {
                const response = await nodeService.getNode(nodeId);
                selectedNode.value = response.data.data;
            } catch (error) {
                console.error('获取节点详情失败:', error);
                ElMessage.error('获取节点详情失败');
            }
        };

        // 验证匹配
        const verifyMatch = async () => {
            if (!verifyFormRef.value) return;

            await verifyFormRef.value.validate(async (valid) => {
                if (!valid) return;

                try {
                    loading.value = true;
                    const response = await matchService.verifyMatch({
                        tokenId: verifyForm.tokenId,
                        encryptedMetadataId: verifyForm.metadataId,
                        edgeNodeId: verifyForm.edgeNodeId,
                    });

                    // 添加到匹配结果列表
                    const result = response.data.data;

                    // 检查结果是否已在列表中
                    const existingIndex = matchResults.value.findIndex(item =>
                        item.tokenId === result.tokenId &&
                        item.metadataId === result.metadataId
                    );

                    if (existingIndex >= 0) {
                        // 更新现有结果
                        matchResults.value[existingIndex] = result;
                    } else {
                        // 添加新结果
                        matchResults.value.unshift(result);
                    }

                    ElMessage({
                        type: result.isMatched ? 'success' : 'warning',
                        message: response.data.message
                    });

                } catch (error) {
                    console.error('验证匹配失败:', error);
                    ElMessage.error('验证匹配失败: ' + (error.response?.data?.message || error.message));
                } finally {
                    loading.value = false;
                }
            });
        };

        // 重置表单
        const resetForm = () => {
            if (verifyFormRef.value) {
                verifyFormRef.value.resetFields();
            }
        };

        // 分配资源
        const allocateResource = async (matchResult) => {
            try {
                loading.value = true;

                const response = await matchService.allocateResource({
                    matchResultIds: [matchResult.id],
                    resourceDetails: {
                        allocationType: 'immediate',
                        priority: 'high'
                    }
                });

                allocationResult.value = response.data.data;

                ElMessage({
                    type: 'success',
                    message: '资源分配成功'
                });
            } catch (error) {
                console.error('资源分配失败:', error);
                ElMessage.error('资源分配失败: ' + (error.response?.data?.message || error.message));
            } finally {
                loading.value = false;
            }
        };

        // 格式化日期
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString();
        };

        return {
            verifyForm,
            rules,
            verifyFormRef,
            loading,
            tokens,
            metadataList,
            nodes,
            matchResults,
            allocationResult,
            getTokenDetails,
            getNodeDetails,
            verifyMatch,
            resetForm,
            allocateResource,
            formatDate,
        };
    }
};
</script>

<style scoped>
.match-verify {
    padding: 20px;
}

.verify-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    flex-direction: column;
}

.subtitle {
    font-size: 14px;
    color: #606266;
    margin-top: 5px;
}

.mb-20 {
    margin-bottom: 20px;
}

.match-results,
.allocation-results {
    margin-top: 30px;
}
</style>
