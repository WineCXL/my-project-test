// 创建授权测试页面
<template>
    <div class="author-test">
        <el-card class="auth-card">
            <template #header>
                <div class="card-header">
                    <h2>授权测试（Authorization Test）</h2>
                    <span class="subtitle">
                        验证用户是否有权限访问特定加密内容
                    </span>
                </div>
            </template>

            <el-tabs v-model="activeTab">
                <!-- 生成授权令牌 -->
                <el-tab-pane label="生成授权令牌" name="generate">
                    <el-form ref="tokenForm" :model="tokenForm" :rules="tokenRules" label-width="100px">
                        <el-row :gutter="20">
                            <el-col :span="24">
                                <el-alert title="授权令牌用于验证用户是否有权限访问加密内容" type="info"
                                    description="通过安全的配对算法生成陷门值，确保授权过程不泄露元数据内容" :closable="false" class="mb-20" />
                            </el-col>

                            <el-col :span="12">
                                <el-form-item label="用户ID" prop="userId">
                                    <el-select v-model="tokenForm.userId" placeholder="选择用户" style="width: 100%"
                                        filterable clearable>
                                        <el-option v-for="user in users" :key="user.id"
                                            :label="`${user.username} (${user.id})`" :value="user.id" />
                                    </el-select>
                                </el-form-item>
                            </el-col>

                            <el-col :span="12">
                                <el-form-item label="群组ID" prop="groupId">
                                    <el-select v-model="tokenForm.groupId" placeholder="选择群组" style="width: 100%"
                                        filterable clearable>
                                        <el-option v-for="group in groups" :key="group.id"
                                            :label="`${group.name || group.id}`" :value="group.id" />
                                    </el-select>
                                </el-form-item>
                            </el-col>

                            <el-col :span="12">
                                <el-form-item label="关键词" prop="keyword">
                                    <el-input v-model="tokenForm.keyword" placeholder="输入要授权的关键词" />
                                </el-form-item>
                            </el-col>

                            <el-col :span="12">
                                <el-form-item>
                                    <el-button type="primary" :loading="loading" @click="generateToken">
                                        生成授权令牌
                                    </el-button>
                                    <el-button @click="resetTokenForm">重置</el-button>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-form>
                </el-tab-pane>

                <!-- 授权验证 -->
                <el-tab-pane label="授权验证" name="verify">
                    <el-form ref="verifyForm" :model="verifyForm" :rules="verifyRules" label-width="100px">
                        <el-row :gutter="20">
                            <el-col :span="24">
                                <el-alert title="授权验证可检查用户是否有权限访问特定加密数据" type="info"
                                    description="边缘节点无需知道关键词内容，也能验证用户是否有权限" :closable="false" class="mb-20" />
                            </el-col>

                            <el-col :span="12">
                                <el-form-item label="授权令牌" prop="tokenId">
                                    <el-select v-model="verifyForm.tokenId" placeholder="选择授权令牌" style="width: 100%"
                                        filterable clearable>
                                        <el-option v-for="token in tokens" :key="token.id"
                                            :label="`${token.keyword} (${token.id})`" :value="token.id" />
                                    </el-select>
                                </el-form-item>
                            </el-col>

                            <el-col :span="12">
                                <el-form-item label="边缘节点" prop="edgeNodeId">
                                    <el-select v-model="verifyForm.edgeNodeId" placeholder="选择边缘节点" style="width: 100%"
                                        filterable clearable>
                                        <el-option v-for="node in nodes" :key="node.nodeId"
                                            :label="`${node.nodeName || node.nodeId}`" :value="node.nodeId" />
                                    </el-select>
                                </el-form-item>
                            </el-col>

                            <el-col :span="12">
                                <el-form-item label="加密数据" prop="encryptedData">
                                    <el-input v-model="verifyForm.encryptedData" type="textarea" :rows="4"
                                        placeholder="输入需要验证的加密数据" />
                                </el-form-item>
                            </el-col>

                            <el-col :span="12">
                                <el-form-item>
                                    <el-button type="primary" :loading="loading" @click="verifyAuthorization">
                                        验证授权
                                    </el-button>
                                    <el-button @click="resetVerifyForm">重置</el-button>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </el-form>
                </el-tab-pane>

                <!-- 授权令牌列表 -->
                <el-tab-pane label="授权令牌列表" name="list">
                    <el-row :gutter="20">
                        <el-col :span="24">
                            <el-input v-model="tokenSearch" placeholder="搜索关键词" prefix-icon="el-icon-search" clearable
                                class="mb-20" />
                        </el-col>

                        <el-col :span="24">
                            <el-table :data="filteredTokens" border style="width: 100%" row-key="id">
                                <el-table-column prop="id" label="ID" width="80" />
                                <el-table-column prop="userId" label="用户ID" width="100" />
                                <el-table-column prop="groupId" label="群组ID" width="100" />
                                <el-table-column prop="keyword" label="关键词" width="120" />
                                <el-table-column prop="createdAt" label="创建时间" width="180">
                                    <template #default="scope">
                                        {{ formatDate(scope.row.createdAt) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="expiresAt" label="过期时间" width="180">
                                    <template #default="scope">
                                        {{ formatDate(scope.row.expiresAt) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="status" label="状态" width="100">
                                    <template #default="scope">
                                        <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                                            {{ scope.row.status === 'active' ? '有效' : '已撤销' }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作">
                                    <template #default="scope">
                                        <el-button v-if="scope.row.status === 'active'" type="danger" size="small"
                                            @click="revokeToken(scope.row.id)">
                                            撤销
                                        </el-button>
                                        <el-button type="primary" size="small" @click="viewTokenDetail(scope.row)">
                                            详情
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-col>
                    </el-row>
                </el-tab-pane>
            </el-tabs>

            <!-- 授权验证结果 -->
            <div v-if="authResult" class="auth-result">
                <h3>授权验证结果</h3>
                <el-alert :title="authResult.authorized ? '授权验证成功' : '授权验证失败'"
                    :type="authResult.authorized ? 'success' : 'error'" :description="authResult.message || ''"
                    show-icon :closable="false" class="mb-20" />
            </div>

            <!-- 令牌详情对话框 -->
            <el-dialog v-model="dialogVisible" title="授权令牌详情" width="50%">
                <div v-if="selectedToken">
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="令牌ID">{{ selectedToken.id }}</el-descriptions-item>
                        <el-descriptions-item label="用户ID">{{ selectedToken.userId }}</el-descriptions-item>
                        <el-descriptions-item label="群组ID">{{ selectedToken.groupId }}</el-descriptions-item>
                        <el-descriptions-item label="关键词">{{ selectedToken.keyword }}</el-descriptions-item>
                        <el-descriptions-item
                            label="创建时间">{{ formatDate(selectedToken.createdAt) }}</el-descriptions-item>
                        <el-descriptions-item
                            label="过期时间">{{ formatDate(selectedToken.expiresAt) }}</el-descriptions-item>
                        <el-descriptions-item label="状态">
                            <el-tag :type="selectedToken.status === 'active' ? 'success' : 'danger'">
                                {{ selectedToken.status === 'active' ? '有效' : '已撤销' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="令牌值">
                            <el-input v-model="selectedToken.token" type="textarea" :rows="4" readonly />
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <template #footer>
                    <el-button @click="dialogVisible = false">关闭</el-button>
                    <el-button v-if="selectedToken && selectedToken.status === 'active'" type="danger"
                        @click="revokeToken(selectedToken.id)">
                        撤销令牌
                    </el-button>
                </template>
            </el-dialog>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import authService from '@/api/authorization';
import userService from '@/api/user';
import groupService from '@/api/group';
import nodeService from '@/api/node';

export default {
    name: 'AuthorTest',

    setup() {
        // 激活的标签页
        const activeTab = ref('generate');

        // 生成授权令牌表单
        const tokenForm = reactive({
            userId: '',
            groupId: '',
            keyword: '',
        });

        // 验证授权表单
        const verifyForm = reactive({
            tokenId: '',
            edgeNodeId: '',
            encryptedData: '',
        });

        // 表单规则
        const tokenRules = {
            userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
            groupId: [{ required: true, message: '请选择群组', trigger: 'change' }],
            keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }],
        };

        const verifyRules = {
            tokenId: [{ required: true, message: '请选择授权令牌', trigger: 'change' }],
            edgeNodeId: [{ required: true, message: '请选择边缘节点', trigger: 'change' }],
            encryptedData: [{ required: true, message: '请输入加密数据', trigger: 'blur' }],
        };

        const tokenFormRef = ref(null);
        const verifyFormRef = ref(null);
        const loading = ref(false);
        const users = ref([]);
        const groups = ref([]);
        const nodes = ref([]);
        const tokens = ref([]);
        const tokenSearch = ref('');
        const authResult = ref(null);
        const dialogVisible = ref(false);
        const selectedToken = ref(null);

        // 过滤后的令牌列表
        const filteredTokens = computed(() => {
            if (!tokenSearch.value) return tokens.value;

            return tokens.value.filter(token =>
                token.keyword.toLowerCase().includes(tokenSearch.value.toLowerCase())
            );
        });

        // 初始化
        onMounted(async () => {
            try {
                loading.value = true;
                await Promise.all([
                    loadUsers(),
                    loadGroups(),
                    loadNodes(),
                    loadTokens(),
                ]);
            } catch (error) {
                ElMessage.error('加载数据失败: ' + error.message);
            } finally {
                loading.value = false;
            }
        });

        // 加载用户列表
        const loadUsers = async () => {
            try {
                const response = await userService.getAllUsers();
                users.value = response.data.data || [];
            } catch (error) {
                console.error('加载用户列表失败:', error);
                ElMessage.error('加载用户列表失败');
            }
        };

        // 加载群组列表
        const loadGroups = async () => {
            try {
                const response = await groupService.getAllGroups();
                groups.value = response.data.data || [];
            } catch (error) {
                console.error('加载群组列表失败:', error);
                ElMessage.error('加载群组列表失败');
            }
        };

        // 加载边缘节点列表
        const loadNodes = async () => {
            try {
                const response = await nodeService.getAllNodes();
                nodes.value = response.data.data.filter(node => node.nodeType === 'edge') || [];
            } catch (error) {
                console.error('加载边缘节点列表失败:', error);
                ElMessage.error('加载边缘节点列表失败');
            }
        };

        // 加载授权令牌列表
        const loadTokens = async () => {
            try {
                const response = await authService.getTokens();
                tokens.value = response.data.data || [];
            } catch (error) {
                console.error('加载授权令牌列表失败:', error);
                ElMessage.error('加载授权令牌列表失败');
            }
        };

        // 生成授权令牌
        const generateToken = async () => {
            if (!tokenFormRef.value) return;

            await tokenFormRef.value.validate(async (valid) => {
                if (!valid) return;

                try {
                    loading.value = true;
                    const response = await authService.generateToken({
                        userId: tokenForm.userId,
                        groupId: tokenForm.groupId,
                        keyword: tokenForm.keyword,
                    });

                    ElMessage({
                        type: 'success',
                        message: '授权令牌生成成功'
                    });

                    // 刷新令牌列表
                    await loadTokens();

                    // 重置表单
                    resetTokenForm();

                    // 切换到令牌列表标签页
                    activeTab.value = 'list';

                } catch (error) {
                    console.error('生成授权令牌失败:', error);
                    ElMessage.error('生成授权令牌失败: ' + (error.response?.data?.message || error.message));
                } finally {
                    loading.value = false;
                }
            });
        };

        // 验证授权
        const verifyAuthorization = async () => {
            if (!verifyFormRef.value) return;

            await verifyFormRef.value.validate(async (valid) => {
                if (!valid) return;

                try {
                    loading.value = true;
                    const response = await authService.verifyToken({
                        tokenId: verifyForm.tokenId,
                        edgeNodeId: verifyForm.edgeNodeId,
                        encryptedData: verifyForm.encryptedData,
                    });

                    authResult.value = {
                        authorized: response.data.data.authorized,
                        message: response.data.message,
                        details: response.data.data,
                    };

                    ElMessage({
                        type: authResult.value.authorized ? 'success' : 'warning',
                        message: response.data.message
                    });

                } catch (error) {
                    console.error('验证授权失败:', error);
                    ElMessage.error('验证授权失败: ' + (error.response?.data?.message || error.message));

                    authResult.value = {
                        authorized: false,
                        message: error.response?.data?.message || error.message,
                    };
                } finally {
                    loading.value = false;
                }
            });
        };

        // 重置生成令牌表单
        const resetTokenForm = () => {
            if (tokenFormRef.value) {
                tokenFormRef.value.resetFields();
            }
        };

        // 重置验证表单
        const resetVerifyForm = () => {
            if (verifyFormRef.value) {
                verifyFormRef.value.resetFields();
            }
            authResult.value = null;
        };

        // 撤销令牌
        const revokeToken = async (tokenId) => {
            try {
                await ElMessageBox.confirm(
                    '确定要撤销此授权令牌吗？撤销后将无法恢复。',
                    '撤销授权令牌',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                );

                loading.value = true;
                const response = await authService.revokeToken(tokenId);

                ElMessage({
                    type: 'success',
                    message: '授权令牌已成功撤销'
                });

                // 刷新令牌列表
                await loadTokens();

                // 关闭对话框
                dialogVisible.value = false;

            } catch (error) {
                if (error !== 'cancel') {
                    console.error('撤销授权令牌失败:', error);
                    ElMessage.error('撤销授权令牌失败: ' + (error.response?.data?.message || error.message));
                }
            } finally {
                loading.value = false;
            }
        };

        // 查看令牌详情
        const viewTokenDetail = async (token) => {
            try {
                loading.value = true;
                const response = await authService.getToken(token.id);
                selectedToken.value = response.data.data;
                dialogVisible.value = true;
            } catch (error) {
                console.error('获取令牌详情失败:', error);
                ElMessage.error('获取令牌详情失败: ' + (error.response?.data?.message || error.message));
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
            activeTab,
            tokenForm,
            verifyForm,
            tokenRules,
            verifyRules,
            tokenFormRef,
            verifyFormRef,
            loading,
            users,
            groups,
            nodes,
            tokens,
            tokenSearch,
            filteredTokens,
            authResult,
            dialogVisible,
            selectedToken,
            generateToken,
            verifyAuthorization,
            resetTokenForm,
            resetVerifyForm,
            revokeToken,
            viewTokenDetail,
            formatDate,
        };
    }
};
</script>

<style scoped>
.author-test {
    padding: 20px;
}

.auth-card {
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

.auth-result {
    margin-top: 30px;
    padding: 20px;
    border-top: 1px solid #ebeef5;
}
</style>
