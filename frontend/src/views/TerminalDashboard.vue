<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../store/user'
import { useDocumentStore } from '../store/document'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, View, Connection, RefreshRight, Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const documentStore = useDocumentStore()
const loading = ref(false)
const documentsLoading = ref(true)
const userDocuments = ref([])
const searchKeyword = ref('')

// 任务请求对话框
const taskRequestDialogVisible = ref(false)
const taskRequestConfirmVisible = ref(false)
const keywordGeneratedVisible = ref(false)
const taskTitle = ref('')
const taskContent = ref('')
const generatedKeyword = ref('')
const taskRequestStage = ref('input') // 'input' or 'encryption'
const contentMaxLength = 5000 // 限制内容最大长度
const titleMaxLength = 100 // 限制标题最大长度

// 随机生成关键词函数 (作为备用功能)
function generateRandomKeyword() {
    const keywords = [
        '安全', '隐私', '加密', '分布式', '边缘计算', '资源分配',
        '密文检索', '零知识证明', '节点', '元数据', '属性加密', '同态加密'
    ]
    return keywords[Math.floor(Math.random() * keywords.length)]
}

// 打开任务请求对话框
function openTaskRequestDialog() {
    taskTitle.value = ''
    taskContent.value = ''
    generatedKeyword.value = ''
    taskRequestStage.value = 'input'
    taskRequestDialogVisible.value = true
}

// 任务请求第一步确认
function confirmTaskRequest() {
    if (!taskContent.value.trim()) {
        ElMessage.warning('请输入文本内容')
        return
    }

    taskRequestConfirmVisible.value = true
}

// 确认并生成关键词
async function confirmAndGenerateKeyword() {
    taskRequestConfirmVisible.value = false;
    keywordGeneratedVisible.value = true;

    try {
        // 使用store获取关键词
        const keyword = await documentStore.generateKeyword();
        if (keyword) {
            generatedKeyword.value = keyword;
            console.log('从API获取的关键词:', keyword);
        } else {
            // 如果API返回失败，使用本地关键词生成
            console.error('API返回失败');
            generatedKeyword.value = generateRandomKeyword();
        }
    } catch (error) {
        console.error('调用关键词生成API出错:', error);
        // 使用本地关键词生成
        generatedKeyword.value = generateRandomKeyword();
    }

    // 修改阶段状态
    taskRequestStage.value = 'encryption';
}

// 加密并上传
async function encryptAndUpload() {
    if (!taskTitle.value.trim()) {
        ElMessage.warning('请输入任务标题')
        return
    }

    loading.value = true
    try {
        // 准备提交的数据
        const formData = new FormData()

        // 文本内容转为文件对象
        const textBlob = new Blob([taskContent.value], { type: 'text/plain' })
        const textFile = new File([textBlob], `${taskTitle.value}.txt`, { type: 'text/plain' })

        // 添加文件
        formData.append('file', textFile)

        // 添加其他字段
        formData.append('title', taskTitle.value)
        formData.append('keyword', generatedKeyword.value)
        formData.append('isTextRequest', 'true')

        try {
            // 使用store上传文档
            const response = await documentStore.uploadDocument(formData);

            if (response && response.success) {
                ElMessage.success('任务提交成功')
                taskRequestDialogVisible.value = false
                fetchUserDocuments() // 刷新文档列表
            } else {
                ElMessage.error(response?.message || '任务提交失败')
            }
        } catch (uploadError) {
            console.error('文档上传请求错误:', uploadError)
            ElMessage.error('网络连接错误，请检查后端服务是否正常运行')
        }
    } catch (error) {
        console.error('提交任务请求错误:', error)
        ElMessage.error('任务处理错误，请重试')
    } finally {
        loading.value = false
    }
}

// 获取用户的文档列表
async function fetchUserDocuments() {
    documentsLoading.value = true;

    try {
        // 使用store获取用户文档
        await documentStore.fetchUserDocuments();
        userDocuments.value = documentStore.userDocuments;

        if (documentStore.error) {
            ElMessage.warning(documentStore.error);
        }
    } catch (error) {
        console.error('获取用户文档列表错误:', error);
        userDocuments.value = [];
        ElMessage.warning('网络错误，无法获取文档');
    } finally {
        documentsLoading.value = false;
    }
}

// 刷新文档列表
function refreshDocuments() {
    fetchUserDocuments();
}

// 查看文档详情
function viewDocument(document) {
    ElMessage.info(`查看文档详情功能开发中: ${document.title}`)
    // TODO: 实现查看文档详情功能
}

// 过滤文档列表
const filteredDocuments = computed(() => {
    if (!searchKeyword.value) return userDocuments.value

    const keyword = searchKeyword.value.toLowerCase()
    return userDocuments.value.filter(doc =>
        doc.title.toLowerCase().includes(keyword) ||
        (doc.keywords && doc.keywords.toLowerCase().includes(keyword))
    )
})

// 获取文档状态标签类型
function getStatusType(status) {
    const statusMap = {
        'executing': 'warning',
        'completed': 'success',
        'failed': 'danger'
    }
    return statusMap[status] || 'info'
}

// 获取匹配状态标签类型
function getMatchType(matched) {
    return matched ? 'success' : 'info'
}

onMounted(() => {
    fetchUserDocuments()
})
</script>

<template>
    <div class="terminal-dashboard-container">
        <el-row :gutter="20">
            <el-col :span="24">
                <h1>可搜索加密资源分配系统——终端层</h1>
                <el-divider content-position="left">用户空间</el-divider>
            </el-col>
        </el-row>

        <!-- 用户欢迎卡片 -->
        <el-row :gutter="20">
            <el-col :span="24">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>欢迎，{{ userStore.userInfo.username }}</span>
                        </div>
                    </template>
                    <p>终端设备可以在此提交任务文本，并查看文本处理情况。您可以提交任务数据并监控任务进度。</p>
                </el-card>
            </el-col>
        </el-row>

        <!-- 任务请求区域 -->
        <el-row :gutter="20" class="mt-20">
            <el-col :span="24">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>提交任务请求</span>
                            <el-tooltip content="创建新的任务请求" placement="top">
                                <el-icon>
                                    <Document />
                                </el-icon>
                            </el-tooltip>
                        </div>
                    </template>

                    <div class="task-request-area">
                        <el-button type="primary" @click="openTaskRequestDialog">
                            <el-icon>
                                <Plus />
                            </el-icon> 新建任务请求
                        </el-button>
                        <div class="task-description">
                            点击上方按钮创建新的任务请求，输入文本内容并获取系统分配的关键词
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 任务请求对话框 -->
        <el-dialog v-model="taskRequestDialogVisible" :title="taskRequestStage === 'input' ? '任务请求' : '任务加密'"
            width="50%" :close-on-click-modal="false" :before-close="() => taskRequestDialogVisible = false">
            <el-form>
                <el-form-item label="任务标题" required>
                    <el-input v-model="taskTitle" placeholder="请输入任务标题" :maxlength="titleMaxLength" show-word-limit />
                </el-form-item>

                <el-form-item label="文本内容" required>
                    <el-input v-model="taskContent" type="textarea" :rows="10" placeholder="请输入文本内容"
                        :maxlength="contentMaxLength" show-word-limit :disabled="taskRequestStage === 'encryption'" />
                </el-form-item>

                <el-form-item v-if="taskRequestStage === 'encryption'" label="系统关键词">
                    <el-tag size="large">{{ generatedKeyword }}</el-tag>
                    <div class="keyword-hint">系统已为您生成关键词，将用于加密和检索</div>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="taskRequestDialogVisible = false">取消</el-button>
                    <el-button type="primary" v-if="taskRequestStage === 'input'" @click="confirmTaskRequest">
                        确定
                    </el-button>
                    <el-button type="success" v-else @click="encryptAndUpload" :loading="loading">
                        加密并上传
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 任务请求确认对话框 -->
        <el-dialog v-model="taskRequestConfirmVisible" title="确认" width="30%" :close-on-click-modal="false"
            append-to-body>
            <p>您确定要提交该任务请求吗？</p>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="taskRequestConfirmVisible = false">取消</el-button>
                    <el-button type="primary" @click="confirmAndGenerateKeyword">确定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 关键词生成对话框 -->
        <el-dialog v-model="keywordGeneratedVisible" title="系统提示" width="30%" :close-on-click-modal="false"
            append-to-body :show-close="false">
            <p>系统为您分配关键词</p>
            <template #footer>
                <span class="dialog-footer">
                    <el-button type="primary" @click="keywordGeneratedVisible = false">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.terminal-dashboard-container {
    padding: 20px;
}

.mt-20 {
    margin-top: 20px;
}

.mx-1 {
    margin: 0 4px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header-with-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-area {
    display: flex;
    align-items: center;
    gap: 8px;
}

.actions-area {
    display: flex;
    align-items: center;
}

.task-request-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px 0;
}

.task-description {
    color: #909399;
    font-size: 14px;
    text-align: center;
    margin-top: 10px;
}

.keyword-hint {
    margin-top: 8px;
    color: #909399;
    font-size: 12px;
}

.el-table {
    margin-top: 15px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
