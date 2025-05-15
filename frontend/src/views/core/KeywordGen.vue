<template>
    <div class="keyword-gen-container">
        <el-card class="keyword-card">
            <template #header>
                <div class="card-header">
                    <h2>关键词生成 (KeywordGen)</h2>
                    <p>实现论文中的KeywordGen算法，为资源生成加密关键词</p>
                </div>
            </template>

            <div class="keyword-form">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="生成关键词" name="generate">
                        <el-form :model="form" ref="formRef" :rules="rules" label-width="120px">
                            <el-form-item label="资源名称" prop="resourceName">
                                <el-input v-model="form.resourceName" placeholder="输入资源名称" />
                            </el-form-item>

                            <el-form-item label="选择群组" prop="groupId">
                                <el-select v-model="form.groupId" placeholder="选择要使用的群组" @change="handleGroupChange"
                                    style="width: 100%">
                                    <el-option v-for="group in groups" :key="group.groupId" :label="group.groupName"
                                        :value="group.groupId" />
                                </el-select>
                            </el-form-item>

                            <el-form-item label="关键词列表" prop="keywords">
                                <el-tag v-for="tag in dynamicTags" :key="tag" class="mx-1" closable
                                    @close="handleClose(tag)">
                                    {{ tag }}
                                </el-tag>
                                <el-input v-if="inputVisible" ref="InputRef" v-model="inputValue" class="ml-1 w-20"
                                    size="small" @keyup.enter="handleInputConfirm" @blur="handleInputConfirm" />
                                <el-button v-else class="button-new-tag ml-1" size="small" @click="showInput">
                                    + 添加关键词
                                </el-button>
                            </el-form-item>

                            <el-form-item label="资源描述" prop="description">
                                <el-input type="textarea" v-model="form.description" :rows="3" placeholder="输入资源描述" />
                            </el-form-item>

                            <el-form-item label="资源文件" prop="file">
                                <el-upload class="upload-demo" drag :auto-upload="false" :on-change="handleFileChange"
                                    :limit="1" accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png">
                                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                                    <div class="el-upload__text">
                                        拖拽文件到此处或 <em>点击上传</em>
                                    </div>
                                    <template #tip>
                                        <div class="el-upload__tip">
                                            请上传需要加密的资源文件
                                        </div>
                                    </template>
                                </el-upload>
                            </el-form-item>

                            <el-form-item>
                                <el-button type="primary" @click="generateKeywords" :loading="loading">
                                    生成加密关键词
                                </el-button>
                                <el-button @click="resetForm">重置</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane label="已加密资源" name="list">
                        <div class="resources-list" v-if="resources.length > 0">
                            <el-table :data="resources" stripe style="width: 100%">
                                <el-table-column prop="resourceId" label="资源ID" width="100" />
                                <el-table-column prop="resourceName" label="资源名称" width="180" />
                                <el-table-column prop="groupId" label="所属群组">
                                    <template #default="scope">
                                        {{ getGroupName(scope.row.groupId) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="关键词数">
                                    <template #default="scope">
                                        <el-tag type="info">
                                            {{ scope.row.encryptedKeywords?.length || 0 }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="创建时间">
                                    <template #default="scope">
                                        {{ formatDate(scope.row.createdAt) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作">
                                    <template #default="scope">
                                        <el-button size="small" @click="viewResourceDetails(scope.row)">
                                            查看
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                        <el-empty v-else description="暂无加密资源" />
                    </el-tab-pane>
                </el-tabs>

                <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="true"
                    @close="errorMessage = ''" show-icon />
            </div>

            <!-- 资源详情对话框 -->
            <el-dialog v-model="dialogVisible" title="资源详情" width="60%">
                <el-descriptions border :column="1" v-if="selectedResource">
                    <el-descriptions-item label="资源ID">{{ selectedResource.resourceId }}</el-descriptions-item>
                    <el-descriptions-item label="资源名称">{{ selectedResource.resourceName }}</el-descriptions-item>
                    <el-descriptions-item
                        label="所属群组">{{ getGroupName(selectedResource.groupId) }}</el-descriptions-item>
                    <el-descriptions-item label="描述">{{ selectedResource.description }}</el-descriptions-item>
                    <el-descriptions-item label="文件名">{{ selectedResource.fileName || '未上传文件' }}</el-descriptions-item>
                    <el-descriptions-item label="原始关键词">
                        <el-tag v-for="keyword in selectedResource.originalKeywords" :key="keyword"
                            style="margin-right: 5px; margin-bottom: 5px;">
                            {{ keyword }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="加密关键词">
                        <div class="encrypted-keywords">
                            <div v-for="(keyword, index) in selectedResource.encryptedKeywords" :key="index"
                                class="encrypted-keyword">
                                <el-tooltip :content="keyword" placement="top">
                                    <el-tag type="success">加密关键词 #{{ index + 1 }}</el-tag>
                                </el-tooltip>
                                <el-input type="textarea" :rows="2" :value="keyword" readonly size="small"
                                    style="margin-top: 5px;" />
                            </div>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item
                        label="创建时间">{{ formatDate(selectedResource.createdAt) }}</el-descriptions-item>
                </el-descriptions>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">关闭</el-button>
                        <el-button type="primary" @click="downloadResource" :loading="downloading">
                            下载资源
                        </el-button>
                    </span>
                </template>
            </el-dialog>
        </el-card>
    </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import axios from 'axios';

export default {
    name: 'KeywordGenView',
    components: {
        UploadFilled
    },

    setup() {
        const activeTab = ref('generate');
        const resources = ref([]);
        const groups = ref([]);
        const loading = ref(false);
        const downloading = ref(false);
        const errorMessage = ref('');
        const dialogVisible = ref(false);
        const selectedResource = ref(null);

        // 动态标签相关
        const dynamicTags = ref([]);
        const inputVisible = ref(false);
        const inputValue = ref('');
        const InputRef = ref(null);

        // 文件上传相关
        const selectedFile = ref(null);

        const form = reactive({
            resourceName: '',
            groupId: '',
            description: '',
            keywords: []
        });

        const rules = {
            resourceName: [
                { required: true, message: '请输入资源名称', trigger: 'blur' }
            ],
            groupId: [
                { required: true, message: '请选择群组', trigger: 'change' }
            ]
        };

        const formRef = ref(null);

        // 获取所有资源
        const fetchResources = async () => {
            loading.value = true;

            try {
                const response = await axios.get('/api/resources');

                if (response.data.success) {
                    resources.value = response.data.data;
                } else {
                    errorMessage.value = response.data.message || '获取资源列表失败';
                }
            } catch (error) {
                console.error('获取资源列表时发生错误:', error);
                errorMessage.value = error.response?.data?.message || '获取资源列表失败，请稍后重试';
            } finally {
                loading.value = false;
            }
        };

        // 获取可用的群组（空闲状态的群组）
        const fetchGroups = async () => {
            loading.value = true;

            try {
                const response = await axios.get('/api/groups');

                if (response.data.success) {
                    // 只使用空闲状态的群组
                    groups.value = response.data.data.filter(group => group.status === 'idle');
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

        // 生成加密关键词
        const generateKeywords = async () => {
            // 表单验证
            if (!formRef.value) return;

            await formRef.value.validate(async (valid) => {
                if (!valid) {
                    return false;
                }

                // 至少有一个关键词
                if (dynamicTags.value.length === 0) {
                    errorMessage.value = '请至少添加一个关键词';
                    return;
                }

                // 必须上传文件
                if (!selectedFile.value) {
                    errorMessage.value = '请上传资源文件';
                    return;
                }

                loading.value = true;
                errorMessage.value = '';

                try {
                    // 准备表单数据
                    const formData = new FormData();
                    formData.append('resourceName', form.resourceName);
                    formData.append('groupId', form.groupId);
                    formData.append('description', form.description);
                    formData.append('file', selectedFile.value);

                    // 添加关键词
                    dynamicTags.value.forEach((tag, index) => {
                        formData.append(`keywords[${index}]`, tag);
                    });

                    const response = await axios.post('/api/resources/encrypt', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    if (response.data.success) {
                        ElMessage.success('加密关键词生成成功');
                        // 重新获取资源列表
                        fetchResources();
                        // 切换到列表标签页
                        activeTab.value = 'list';
                        // 重置表单
                        resetForm();
                    } else {
                        errorMessage.value = response.data.message || '加密关键词生成失败';
                    }
                } catch (error) {
                    console.error('生成加密关键词时发生错误:', error);
                    errorMessage.value = error.response?.data?.message || '加密关键词生成失败，请稍后重试';
                } finally {
                    loading.value = false;
                }
            });
        };

        // 重置表单
        const resetForm = () => {
            if (formRef.value) {
                formRef.value.resetFields();
            }
            dynamicTags.value = [];
            selectedFile.value = null;
        };

        // 查看资源详情
        const viewResourceDetails = (resource) => {
            selectedResource.value = resource;
            dialogVisible.value = true;
        };

        // 下载资源
        const downloadResource = async () => {
            if (!selectedResource.value) return;

            downloading.value = true;

            try {
                const response = await axios.get(`/api/resources/${selectedResource.value.resourceId}/download`, {
                    responseType: 'blob'
                });

                // 创建下载链接
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', selectedResource.value.fileName || 'resource');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                ElMessage.success('资源下载成功');
            } catch (error) {
                console.error('下载资源时发生错误:', error);
                errorMessage.value = '资源下载失败，请稍后重试';
            } finally {
                downloading.value = false;
            }
        };

        // 群组变更
        const handleGroupChange = (groupId) => {
            form.groupId = groupId;
        };

        // 获取群组名称
        const getGroupName = (groupId) => {
            const group = groups.value.find(g => g.groupId === groupId);
            return group ? group.groupName : groupId;
        };

        // 处理文件变更
        const handleFileChange = (file) => {
            selectedFile.value = file.raw;
        };

        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return '';

            const date = new Date(timestamp);
            return date.toLocaleString();
        };

        // 处理标签关闭
        const handleClose = (tag) => {
            dynamicTags.value.splice(dynamicTags.value.indexOf(tag), 1);
        };

        // 显示输入框
        const showInput = () => {
            inputVisible.value = true;
            nextTick(() => {
                InputRef.value.focus();
            });
        };

        // 处理输入确认
        const handleInputConfirm = () => {
            if (inputValue.value) {
                if (!dynamicTags.value.includes(inputValue.value)) {
                    dynamicTags.value.push(inputValue.value);
                }
            }
            inputVisible.value = false;
            inputValue.value = '';
        };

        // 组件挂载时获取资源和群组列表
        onMounted(() => {
            fetchResources();
            fetchGroups();
        });

        return {
            activeTab,
            resources,
            groups,
            loading,
            downloading,
            errorMessage,
            form,
            rules,
            formRef,
            dialogVisible,
            selectedResource,
            dynamicTags,
            inputVisible,
            inputValue,
            InputRef,
            generateKeywords,
            resetForm,
            viewResourceDetails,
            downloadResource,
            handleGroupChange,
            getGroupName,
            handleFileChange,
            formatDate,
            handleClose,
            showInput,
            handleInputConfirm
        };
    }
};
</script>

<style scoped>
.keyword-gen-container {
    padding: 20px;
}

.keyword-card {
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

.keyword-form {
    margin-top: 20px;
}

.resources-list {
    margin-top: 20px;
}

.ml-1 {
    margin-left: 8px;
}

.w-20 {
    width: 100px;
}

.mx-1 {
    margin: 0 4px 4px 0;
}

.encrypted-keywords {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.encrypted-keyword {
    display: flex;
    flex-direction: column;
}
</style>
