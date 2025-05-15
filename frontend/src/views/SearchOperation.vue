<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useSearchStore } from '../store/search'
import { useNodeStore } from '../store/node'
import { useGroupStore } from '../store/group'
import { ElMessage } from 'element-plus'
import { getSearchDetail, deleteSearchRecord } from '../api/search'
import SearchOperationComponent from '../components/SearchOperationComponent.vue'

const searchStore = useSearchStore()
const nodeStore = useNodeStore()
const groupStore = useGroupStore()
const loading = ref(false)
const historyLoading = ref(false)
const searchKeyword = ref('')
const activeTab = ref('search')
const currentSearchDetail = ref(null)
const searchDetailLoading = ref(false)
const searchDetailVisible = ref(false)

// 搜索表单
const searchForm = reactive({
    groupId: '',
    resourceType: 'cpu',
    minResourceAmount: 1,
    maxPriority: 10,
    timeFrom: '',
    timeTo: '',
    isPrivate: true,
    keyword: ''
})

// 设置默认的时间范围
const now = new Date()
const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
searchForm.timeFrom = formatDate(now)
searchForm.timeTo = formatDate(oneWeekLater)

// 格式化日期为ISO字符串
function formatDate(date) {
    return date.toISOString().slice(0, 16).replace('T', ' ')
}

// 加载数据
onMounted(async () => {
    loading.value = true
    try {
        await Promise.all([
            nodeStore.fetchNodes(),
            groupStore.fetchGroups()
        ])
    } catch (error) {
        console.error('获取数据失败:', error)
    } finally {
        loading.value = false
    }

    // 如果已经选择了历史标签，加载搜索历史
    if (activeTab.value === 'history') {
        viewSearchHistory()
    }
})

// 执行搜索
const performSearch = async () => {
    loading.value = true
    searchStore.clearSearchResults()

    try {
        const requestData = { ...searchForm }

        // 处理时间格式
        if (requestData.timeFrom) {
            requestData.timeFrom = new Date(requestData.timeFrom).toISOString()
        }
        if (requestData.timeTo) {
            requestData.timeTo = new Date(requestData.timeTo).toISOString()
        }

        await searchStore.search(requestData)
    } catch (error) {
        console.error('执行搜索操作失败:', error)
    } finally {
        loading.value = false
    }
}

/*
// 查看搜索历史
const viewSearchHistory = async () => {
    if (activeTab.value === 'history' && !historyLoading.value) {
        historyLoading.value = true
        try {
            await searchStore.fetchSearchHistory()
        } catch (error) {
            console.error('获取搜索历史失败:', error)
        } finally {
            historyLoading.value = false
        }
    }
}
*/

// 查看搜索详情
const viewSearchDetail = async (searchId) => {
    searchDetailLoading.value = true
    currentSearchDetail.value = null

    try {
        const response = await getSearchDetail(searchId)
        currentSearchDetail.value = response.data
        searchDetailVisible.value = true
    } catch (error) {
        console.error('获取搜索详情失败:', error)
        ElMessage({
            message: '获取搜索详情失败',
            type: 'error'
        })
    } finally {
        searchDetailLoading.value = false
    }
}

/*
// 删除搜索记录
const handleDeleteSearchRecord = async (searchId) => {
    historyLoading.value = true
    try {
        await deleteSearchRecord(searchId)
        ElMessage({
            message: '删除搜索记录成功',
            type: 'success'
        })

        // 重新获取搜索历史
        await searchStore.fetchSearchHistory()
    } catch (error) {
        console.error('删除搜索记录失败:', error)
        ElMessage({
            message: '删除搜索记录失败',
            type: 'error'
        })
    } finally {
        historyLoading.value = false
    }
}
*/

// 重置搜索表单
const resetSearchForm = () => {
    Object.assign(searchForm, {
        groupId: '',
        resourceType: 'cpu',
        minResourceAmount: 1,
        maxPriority: 10,
        timeFrom: formatDate(now),
        timeTo: formatDate(oneWeekLater),
        isPrivate: true,
        keyword: ''
    })

    searchStore.clearSearchResults()
}

// 标签切换
const handleTabChange = (tab) => {
    if (tab.paneName === 'history') {
        viewSearchHistory()
    }
}

// 获取资源类型显示文本
const getResourceTypeText = (type) => {
    switch (type) {
        case 'cpu':
            return 'CPU'
        case 'memory':
            return '内存'
        case 'storage':
            return '存储'
        case 'network':
            return '网络'
        default:
            return type
    }
}

// 获取群组名称
const getGroupName = (groupId) => {
    const group = groupStore.getGroupById(groupId)
    return group ? group.name : `未知群组(ID: ${groupId})`
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
}

/*
// 过滤搜索历史
const filteredSearchHistory = computed(() => {
    if (!searchKeyword.value || !searchStore.searchHistory) {
        return searchStore.searchHistory || []
    }

    const keyword = searchKeyword.value.toLowerCase()
    return searchStore.searchHistory.filter(record =>
        record.query?.toLowerCase().includes(keyword) ||
        record.resourceType?.toLowerCase().includes(keyword) ||
        getGroupName(record.groupId).toLowerCase().includes(keyword)
    )
})
*/

// 搜索完成处理
const handleSearchComplete = (results) => {
    console.log('搜索完成，共找到结果:', results?.length || 0)
}

// 搜索错误处理
const handleSearchError = (errorMsg) => {
    ElMessage.error(errorMsg || '搜索操作失败')
}
</script>

<template>
    <div class="search-operation-container">
        <el-row :gutter="20">
            <el-col :span="24">
                <h1>搜索操作</h1>
            </el-col>
        </el-row>

        <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="mt-20">
            <!-- 搜索操作面板 -->
            <el-tab-pane label="执行搜索" name="search">
                <SearchOperationComponent @search-complete="handleSearchComplete" @search-error="handleSearchError" />
            </el-tab-pane>

            <!-- 搜索历史面板 -->
            <el-tab-pane label="搜索历史" name="history">
                <el-card v-loading="historyLoading">
                    <template #header>
                        <div class="card-header">
                            <el-input v-model="searchKeyword" placeholder="搜索历史记录" class="search-input" clearable>
                                <template #prefix>
                                    <el-icon>
                                        <Search />
                                    </el-icon>
                                </template>
                            </el-input>

                            <el-button @click="viewSearchHistory">
                                <el-icon>
                                    <RefreshRight />
                                </el-icon> 刷新
                            </el-button>
                        </div>
                    </template>

                    <el-table :data="filteredSearchHistory" style="width: 100%" border stripe>
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column label="群组" min-width="120">
                            <template #default="{ row }">
                                {{ getGroupName(row.groupId) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="资源类型" width="120">
                            <template #default="{ row }">
                                {{ getResourceTypeText(row.resourceType) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="搜索条件" min-width="200" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ row.query || '无搜索条件' }}
                            </template>
                        </el-table-column>
                        <el-table-column label="结果数量" width="100">
                            <template #default="{ row }">
                                {{ row.resultCount || 0 }}
                            </template>
                        </el-table-column>
                        <el-table-column label="搜索时间" min-width="150">
                            <template #default="{ row }">
                                {{ formatDateTime(row.searchTime) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200">
                            <template #default="{ row }">
                                <el-button type="primary" size="small" @click="viewSearchDetail(row.id)">
                                    <el-icon>
                                        <View />
                                    </el-icon> 详情
                                </el-button>
                                <el-button type="danger" size="small" @click="handleDeleteSearchRecord(row.id)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon> 删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>

                    <el-empty v-if="!filteredSearchHistory || filteredSearchHistory.length === 0"
                        description="暂无搜索历史记录" />
                </el-card>
            </el-tab-pane>
        </el-tabs>

        <!-- 搜索详情对话框 -->
        <el-dialog v-model="searchDetailVisible" title="搜索详情" width="70%" :close-on-click-modal="false">
            <div v-loading="searchDetailLoading">
                <el-descriptions v-if="currentSearchDetail" title="基本信息" :column="2" border>
                    <el-descriptions-item label="搜索ID">
                        {{ currentSearchDetail.id }}
                    </el-descriptions-item>
                    <el-descriptions-item label="搜索时间">
                        {{ formatDateTime(currentSearchDetail.searchTime) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="群组">
                        {{ getGroupName(currentSearchDetail.groupId) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="资源类型">
                        {{ getResourceTypeText(currentSearchDetail.resourceType) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="搜索条件" :span="2">
                        {{ currentSearchDetail.query || '无搜索条件' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="元数据隐私保护">
                        <el-tag :type="currentSearchDetail.isPrivate ? 'success' : 'info'">
                            {{ currentSearchDetail.isPrivate ? '是' : '否' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="结果数量">
                        {{ currentSearchDetail.resultCount || 0 }}
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="center">搜索结果</el-divider>

                <el-table v-if="currentSearchDetail && currentSearchDetail.results" :data="currentSearchDetail.results"
                    style="width: 100%" border stripe>
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column label="节点" min-width="120">
                        <template #default="{ row }">
                            {{ row.nodeName || `节点ID: ${row.nodeId}` }}
                        </template>
                    </el-table-column>
                    <el-table-column label="资源类型" width="120">
                        <template #default="{ row }">
                            {{ getResourceTypeText(row.resourceType) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="resourceAmount" label="资源数量" width="100" />
                    <el-table-column label="开始时间" min-width="150">
                        <template #default="{ row }">
                            {{ formatDateTime(row.startTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="结束时间" min-width="150">
                        <template #default="{ row }">
                            {{ formatDateTime(row.endTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="priority" label="优先级" width="100" />
                </el-table>

                <el-empty v-else description="暂无搜索结果数据" />
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="searchDetailVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.search-operation-container {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-input {
    width: 300px;
}

.mt-20 {
    margin-top: 20px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
