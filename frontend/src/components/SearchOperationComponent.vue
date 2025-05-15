<template>
    <div class="search-operation-component">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>搜索条件</span>
                </div>
            </template>

            <el-form :model="searchForm" label-position="top">
                <el-row :gutter="20">
                    <el-col :md="12">
                        <el-form-item label="选择群组">
                            <el-select v-model="searchForm.groupId" placeholder="选择群组" style="width: 100%">
                                <el-option v-for="group in groupStore.groups" :key="group.id" :label="group.name"
                                    :value="group.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="资源类型">
                            <el-select v-model="searchForm.resourceType" style="width: 100%">
                                <el-option label="CPU" value="cpu" />
                                <el-option label="内存" value="memory" />
                                <el-option label="存储" value="storage" />
                                <el-option label="网络" value="network" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="最小资源数量">
                            <el-input-number v-model="searchForm.minResourceAmount" :min="1" style="width: 100%" />
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="最大优先级">
                            <el-slider v-model="searchForm.maxPriority" :min="1" :max="10"
                                :marks="{ 1: '1', 5: '5', 10: '10' }" show-stops />
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="开始时间">
                            <el-date-picker v-model="searchForm.timeFrom" type="datetime" placeholder="选择开始时间"
                                style="width: 100%" value-format="YYYY-MM-DD HH:mm" />
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="结束时间">
                            <el-date-picker v-model="searchForm.timeTo" type="datetime" placeholder="选择结束时间"
                                style="width: 100%" value-format="YYYY-MM-DD HH:mm" />
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="关键词">
                            <el-input v-model="searchForm.keyword" placeholder="输入关键词" clearable />
                        </el-form-item>
                    </el-col>

                    <el-col :md="12">
                        <el-form-item label="隐私保护">
                            <el-switch v-model="searchForm.isPrivate" active-text="使用元数据隐私保护" inactive-text="不使用隐私保护" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <div class="search-buttons">
                        <el-button type="primary" @click="performSearch" :loading="loading">
                            <el-icon>
                                <Search />
                            </el-icon> 执行搜索
                        </el-button>
                        <el-button @click="resetSearchForm">
                            <el-icon>
                                <RefreshRight />
                            </el-icon> 重置
                        </el-button>
                    </div>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 搜索结果 -->
        <el-card v-if="searchStore.searchResults" class="mt-20">
            <template #header>
                <div class="card-header">
                    <span>搜索结果</span>
                    <el-tag type="info">{{ searchStore.searchResults.length || 0 }}个结果</el-tag>
                </div>
            </template>

            <el-table :data="searchStore.searchResults" style="width: 100%" border stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column label="节点" min-width="120">
                    <template #default="{ row }">
                        {{ row.nodeName || `节点ID: ${row.nodeId}` }}
                    </template>
                </el-table-column>
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
                <el-table-column label="隐私保护" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.isPrivate ? 'success' : 'info'">
                            {{ row.isPrivate ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-if="!searchStore.searchResults || searchStore.searchResults.length === 0"
                description="暂无搜索结果" />
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSearchStore } from '../store/search'
import { useNodeStore } from '../store/node'
import { useGroupStore } from '../store/group'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['search-complete', 'search-error'])

const searchStore = useSearchStore()
const nodeStore = useNodeStore()
const groupStore = useGroupStore()
const loading = ref(false)

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
        emit('search-error', '获取基础数据失败')
    } finally {
        loading.value = false
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
        emit('search-complete', searchStore.searchResults)
    } catch (error) {
        console.error('执行搜索操作失败:', error)
        emit('search-error', '执行搜索操作失败')
    } finally {
        loading.value = false
    }
}

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
</script>

<style scoped>
.search-operation-component {
    width: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mt-20 {
    margin-top: 20px;
}

.search-buttons {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
}
</style>
