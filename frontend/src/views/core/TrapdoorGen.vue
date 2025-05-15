<template>
    <div class="trapdoor-gen-container">
        <el-card class="trapdoor-card">
            <template #header>
                <div class="card-header">
                    <h2>陷门生成 (TrapdoorGen)</h2>
                    <p>实现论文中的TrapdoorGen算法，为关键词搜索生成陷门</p>
                </div>
            </template>

            <div class="trapdoor-form">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="生成陷门" name="generate">
                        <el-form :model="form" ref="formRef" :rules="rules" label-width="120px">
                            <el-form-item label="选择群组" prop="groupId">
                                <el-select v-model="form.groupId" placeholder="选择要使用的群组" @change="handleGroupChange"
                                    style="width: 100%">
                                    <el-option v-for="group in groups" :key="group.groupId" :label="group.groupName"
                                        :value="group.groupId" />
                                </el-select>
                            </el-form-item>

                            <el-form-item label="搜索关键词" prop="keyword">
                                <el-input v-model="form.keyword" placeholder="输入要搜索的关键词" />
                            </el-form-item>

                            <el-form-item label="搜索描述" prop="description">
                                <el-input type="textarea" v-model="form.description" :rows="3" placeholder="输入搜索目的描述" />
                            </el-form-item>

                            <el-form-item>
                                <el-button type="primary" @click="generateTrapdoor" :loading="loading">
                                    生成陷门
                                </el-button>
                                <el-button @click="resetForm">重置</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane label="历史陷门" name="list">
                        <div class="trapdoors-list" v-if="trapdoors.length > 0">
                            <el-table :data="trapdoors" stripe style="width: 100%">
                                <el-table-column prop="trapdoorId" label="陷门ID" width="100" />
                                <el-table-column prop="keyword" label="关键词" width="150" />
                                <el-table-column prop="groupId" label="所属群组">
                                    <template #default="scope">
                                        {{ getGroupName(scope.row.groupId) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="创建时间">
                                    <template #default="scope">
                                        {{ formatDate(scope.row.createdAt) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作" width="250">
                                    <template #default="scope">
                                        <el-button size="small" @click="viewTrapdoorDetails(scope.row)">
                                            查看
                                        </el-button>
                                        <el-button size="small" type="primary" @click="searchWithTrapdoor(scope.row)">
                                            搜索
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                        <el-empty v-else description="暂无历史陷门" />
                    </el-tab-pane>

                    <el-tab-pane label="搜索结果" name="results" v-if="searchResults.length > 0">
                        <div class="search-results">
                            <div class="search-info" v-if="currentTrapdoor">
                                <el-alert type="success" :closable="false" show-icon>
                                    <template #title>
                                        使用关键词 "{{ currentTrapdoor.keyword }}" 在群组
                                        "{{ getGroupName(currentTrapdoor.groupId) }}" 中的搜索结果
                                    </template>
                                </el-alert>
                            </div>

                            <el-table :data="searchResults" stripe style="width: 100%; margin-top: 20px;">
                                <el-table-column prop="resourceId" label="资源ID" width="100" />
                                <el-table-column prop="resourceName" label="资源名称" width="180" />
                                <el-table-column prop="fileName" label="文件名" />
                                <el-table-column label="操作">
                                    <template #default="scope">
                                        <el-button size="small" @click="viewResourceDetails(scope.row)">
                                            查看
                                        </el-button>
                                        <el-button size="small" type="primary" @click="downloadResource(scope.row)">
                                            下载
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </el-tab-pane>
                </el-tabs>

                <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="true"
                    @close="errorMessage = ''" show-icon />
            </div>

            <!-- 陷门详情对话框 -->
            <el-dialog v-model="dialogVisible" title="陷门详情" width="60%">
                <el-descriptions border :column="1" v-if="selectedTrapdoor">
                    <el-descriptions-item label="陷门ID">{{ selectedTrapdoor.trapdoorId }}</el-descriptions-item>
                    <el-descriptions-item label="关键词">{{ selectedTrapdoor.keyword }}</el-descriptions-item>
                    <el-descriptions-item
                        label="所属群组">{{ getGroupName(selectedTrapdoor.groupId) }}</el-descriptions-item>
                    <el-descriptions-item label="描述">{{ selectedTrapdoor.description }}</el-descriptions-item>
                    <el-descriptions-item label="陷门值">
                        <el-input type="textarea" :rows="3" v-model="selectedTrapdoor.trapdoorValue" readonly />
                    </el-descriptions-item>
                    <el-descriptions-item
                        label="创建时间">{{ formatDate(selectedTrapdoor.createdAt) }}</el-descriptions-item>
                </el-descriptions>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">关闭</el-button>
                        <el-button type="primary" @click="searchWithTrapdoor(selectedTrapdoor)">
                            使用此陷门搜索
                        </el-button>
                    </span>
                </template>
            </el-dialog>

            <!-- 资源详情对话框 -->
            <el-dialog v-model="resourceDialogVisible" title="资源详情" width="60%">
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
                    <el-descriptions-item
                        label="创建时间">{{ formatDate(selectedResource.createdAt) }}</el-descriptions-item>
                </el-descriptions>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="resourceDialogVisible = false">关闭</el-button>
                        <el-button type="primary" @click="downloadResource(selectedResource)" :loading="downloading">
                            下载资源
                        </el-button>
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
    name: 'TrapdoorGenView',

    setup() {
        const activeTab = ref('generate');
        const trapdoors = ref([]);
        const groups = ref([]);
        const searchResults = ref([]);
        const loading = ref(false);
        const downloading = ref(false);
        const errorMessage = ref('');
        const dialogVisible = ref(false);
        const resourceDialogVisible = ref(false);
        const selectedTrapdoor = ref(null);
        const selectedResource = ref(null);
        const currentTrapdoor = ref(null);

        const form = reactive({
            groupId: '',
            keyword: '',
            description: ''
        });

        const rules = {
            groupId: [
                { required: true, message: '请选择群组', trigger: 'change' }
            ],
            keyword: [
                { required: true, message: '请输入搜索关键词', trigger: 'blur' }
            ]
        };

        const formRef = ref(null);

        // 获取所有陷门
        const fetchTrapdoors = async () => {
            loading.value = true;

            try {
                const response = await axios.get('/api/trapdoors');

                if (response.data.success) {
                    trapdoors.value = response.data.data;
                } else {
                    errorMessage.value = response.data.message || '获取陷门列表失败';
                }
            } catch (error) {
                console.error('获取陷门列表时发生错误:', error);
                errorMessage.value = error.response?.data?.message || '获取陷门列表失败，请稍后重试';
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

        // 生成陷门
        const generateTrapdoor = async () => {
            // 表单验证
            if (!formRef.value) return;

            await formRef.value.validate(async (valid) => {
                if (!valid) {
                    return false;
                }

                loading.value = true;
                errorMessage.value = '';

                try {
                    const response = await axios.post('/api/trapdoors', form);

                    if (response.data.success) {
                        ElMessage.success('陷门生成成功');
                        // 重新获取陷门列表
                        fetchTrapdoors();
                        // 切换到列表标签页
                        activeTab.value = 'list';
                        // 重置表单
                        resetForm();
                    } else {
                        errorMessage.value = response.data.message || '陷门生成失败';
                    }
                } catch (error) {
                    console.error('生成陷门时发生错误:', error);
                    errorMessage.value = error.response?.data?.message || '陷门生成失败，请稍后重试';
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
        };

        // 查看陷门详情
        const viewTrapdoorDetails = (trapdoor) => {
            selectedTrapdoor.value = trapdoor;
            dialogVisible.value = true;
        };

        // 使用陷门搜索
        const searchWithTrapdoor = async (trapdoor) => {
            if (!trapdoor) return;

            loading.value = true;
            errorMessage.value = '';
            currentTrapdoor.value = trapdoor;

            try {
                const response = await axios.post(`/api/trapdoors/${trapdoor.trapdoorId}/search`);

                if (response.data.success) {
                    searchResults.value = response.data.data;
                    // 切换到结果标签页
                    activeTab.value = 'results';
                    // 关闭对话框
                    dialogVisible.value = false;

                    if (searchResults.value.length === 0) {
                        ElMessage.info('未找到匹配的资源');
                    } else {
                        ElMessage.success(`找到 ${searchResults.value.length} 个匹配资源`);
                    }
                } else {
                    errorMessage.value = response.data.message || '搜索失败';
                }
            } catch (error) {
                console.error('使用陷门搜索时发生错误:', error);
                errorMessage.value = error.response?.data?.message || '搜索失败，请稍后重试';
            } finally {
                loading.value = false;
            }
        };

        // 查看资源详情
        const viewResourceDetails = (resource) => {
            selectedResource.value = resource;
            resourceDialogVisible.value = true;
        };

        // 下载资源
        const downloadResource = async (resource) => {
            if (!resource) return;

            downloading.value = true;

            try {
                const response = await axios.get(`/api/resources/${resource.resourceId}/download`, {
                    responseType: 'blob'
                });

                // 创建下载链接
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', resource.fileName || 'resource');
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

        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return '';

            const date = new Date(timestamp);
            return date.toLocaleString();
        };

        // 组件挂载时获取陷门和群组列表
        onMounted(() => {
            fetchTrapdoors();
            fetchGroups();
        });

        return {
            activeTab,
            trapdoors,
            groups,
            searchResults,
            loading,
            downloading,
            errorMessage,
            form,
            rules,
            formRef,
            dialogVisible,
            resourceDialogVisible,
            selectedTrapdoor,
            selectedResource,
            currentTrapdoor,
            generateTrapdoor,
            resetForm,
            viewTrapdoorDetails,
            searchWithTrapdoor,
            viewResourceDetails,
            downloadResource,
            handleGroupChange,
            getGroupName,
            formatDate
        };
    }
};
</script>

<style scoped>
.trapdoor-gen-container {
    padding: 20px;
}

.trapdoor-card {
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

.trapdoor-form {
    margin-top: 20px;
}

.trapdoors-list {
    margin-top: 20px;
}

.search-results {
    margin-top: 20px;
}

.search-info {
    margin-bottom: 20px;
}
</style>
