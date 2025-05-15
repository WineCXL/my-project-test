<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'
import {
    Setting,
    Grid,
    Monitor,
    Collection,
    SwitchButton,
    Search,
    Connection,
    Unlock,
    Key,
    Lock,
    Check,
    Link,
    DArrowRight,
    DArrowLeft
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const username = computed(() => userStore.userInfo.username || '用户')
const userRole = computed(() => userStore.userInfo.role || '用户')
const isDevelopment = ref(false) //import.meta.env.MODE !== 'production'

// 菜单项
const menuItems = computed(() => {
    if (userStore.isManager) {
        return [
            { path: '/app/dashboard', title: '边缘层仪表板', icon: 'Grid' },
            { path: '/app/node-manager', title: '节点管理', icon: 'Monitor' },
            { path: '/app/group-manager', title: '群组管理', icon: 'Collection' },
            { path: '/app/resource-allocation', title: '资源分配', icon: 'SwitchButton' },
        ]
    } else {
        // 普通用户菜单项
        return [
            { path: '/app/terminal', title: '终端层仪表板', icon: 'Grid' },
            { path: '/app/resource-allocation', title: '我的文档', icon: 'SwitchButton' }
        ]
    }
})

// 获取当前激活的菜单项
const activeMenu = ref(route.path)

// 处理菜单项点击
function handleMenuSelect(index) {
    router.push(index)
}

// 处理设置按钮点击
function handleSettings() {
    ElMessageBox.alert(
        '系统设置面板将在未来版本中提供更多功能。',
        '系统设置',
        {
            confirmButtonText: '确定',
            type: 'info',
        }
    )
}

// 退出登录
async function logout() {
    try {
        await ElMessageBox.confirm(
            '确定要退出登录吗？',
            '退出确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        // 使用store的登出方法
        await userStore.logout()
    } catch (error) {
        // 用户取消操作
        console.log('用户取消登出操作')
    }
}

// 在组件挂载时检查认证状态
onMounted(async () => {
    // 检查是否已登录
    if (!userStore.isLoggedIn) {
        router.push('/auth/login')
        return
    }

    // 如果已登录但没有用户信息，尝试获取用户信息
    if (userStore.isLoggedIn && !userStore.userInfo.id) {
        const success = await userStore.getUserInfo()
        if (!success) {
            ElMessage.warning('无法获取用户信息，请重新登录')
            await userStore.logout()
        }
    }
})
</script>

<template>
    <div class="app-container">
        <!-- 侧边栏 -->
        <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
            <div class="logo-container">
                <h2 v-if="!isCollapse"></h2>
                <el-icon v-else>
                    <Lock />
                </el-icon>
            </div>

            <el-menu :default-active="activeMenu" class="el-menu-vertical" :collapse="isCollapse"
                @select="handleMenuSelect" router background-color="#304156" text-color="#bfcbd9"
                active-text-color="#409EFF">
                <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
                    <el-icon>
                        <component :is="item.icon" />
                    </el-icon>
                    <template #title>{{ item.title }}</template>
                </el-menu-item>
            </el-menu>

            <div class="collapse-btn" @click="isCollapse = !isCollapse">
                <el-button type="primary" :icon="isCollapse ? 'DArrowRight' : 'DArrowLeft'" circle></el-button>
            </div>
        </el-aside>

        <!-- 主内容区 -->
        <el-container>
            <el-header class="header">
                <div class="header-left">
                    <h2>可搜索加密资源分配系统</h2>
                </div>
                <div class="header-right">
                    <span class="user-info">
                        欢迎，{{ username }} <el-tag size="small" effect="dark"
                            type="info">{{ { 'manager': '管理员', 'user': '普通用户' }[userRole] || userRole }}</el-tag>
                    </span>
                    <el-dropdown trigger="click">
                        <el-button class="settings-btn" type="primary" circle>
                            <el-icon>
                                <Setting />
                            </el-icon>
                        </el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item v-if="userStore.isManager" @click="handleSettings">
                                    <el-icon>
                                        <Setting />
                                    </el-icon>系统设置
                                </el-dropdown-item>
                                <el-dropdown-item @click="logout" :divided="userStore.isManager">
                                    <el-icon>
                                        <SwitchButton />
                                    </el-icon>退出登录
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>

            <el-main class="main">
                <!-- 内容区域 -->
                <div class="debug-info" v-if="isDevelopment">
                    <p>当前路径: {{ route.path }}</p>
                    <p>登录状态: {{ userStore.isLoggedIn ? '已登录' : '未登录' }}</p>
                    <p>用户名: {{ userStore.userInfo.username }}</p>
                </div>

                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </el-main>

            <el-footer class="footer">
                <p>© 2025 元数据隐私保护资源分配系统</p>
            </el-footer>
        </el-container>
    </div>
</template>

<style scoped>
.app-container {
    height: 100vh;
    display: flex;
    overflow: hidden;
}

.aside {
    background-color: #304156;
    color: #fff;
    transition: width 0.3s;
    position: relative;
    box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.logo-container {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 18px;
    background-color: #2b3649;
}

.el-menu-vertical {
    border-right: none;
}

.el-menu-vertical .el-menu-item.is-active {
    background-color: #263445 !important;
}

.el-menu-vertical .el-menu-item:hover {
    background-color: #263445 !important;
}

.header {
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 60px !important;
}

.header-left h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
}

.header-right {
    display: flex;
    align-items: center;
}

.user-info {
    margin-right: 15px;
    font-size: 14px;
}

.main {
    background-color: #f0f2f5;
    padding: 20px;
    height: calc(100vh - 120px);
    overflow-y: auto;
}

.footer {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f2f5;
    color: #909399;
    font-size: 14px;
    border-top: 1px solid #e4e7ed;
}

.collapse-btn {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
}

.debug-info {
    background: #eaeaea;
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 4px;
    font-size: 12px;
    color: #333;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
