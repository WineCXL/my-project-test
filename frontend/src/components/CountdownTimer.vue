<template>
    <div class="countdown-timer">
        <el-tag :type="tagType">{{ displayTime }}</el-tag>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    startTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        default: 120 // 默认2分钟（120秒）
    }
})

const remainingSeconds = ref(0)
const timerInterval = ref(null)

// 计算开始时间到现在的秒数
const calculateElapsedSeconds = () => {
    const start = new Date(props.startTime).getTime()
    const now = new Date().getTime()
    return Math.floor((now - start) / 1000)
}

// 更新剩余时间
const updateRemainingTime = () => {
    const elapsed = calculateElapsedSeconds()
    remainingSeconds.value = Math.max(0, props.duration - elapsed)
}

// 格式化显示时间
const displayTime = computed(() => {
    if (remainingSeconds.value <= 0) {
        return '已完成'
    }

    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// 标签类型
const tagType = computed(() => {
    if (remainingSeconds.value <= 0) {
        return 'success'
    } else if (remainingSeconds.value < 30) {
        return 'danger'
    } else {
        return 'warning'
    }
})

// 通知父组件计时结束
const emit = defineEmits(['timeout'])

// 检查是否超时
const checkTimeout = () => {
    if (remainingSeconds.value <= 0) {
        emit('timeout')

        // 停止计时器
        if (timerInterval.value) {
            clearInterval(timerInterval.value)
            timerInterval.value = null
        }
    }
}

onMounted(() => {
    updateRemainingTime()
    timerInterval.value = setInterval(() => {
        updateRemainingTime()
        checkTimeout()
    }, 1000)
})

onUnmounted(() => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
    }
})
</script>

<style scoped>
.countdown-timer {
    display: inline-block;
}
</style>
