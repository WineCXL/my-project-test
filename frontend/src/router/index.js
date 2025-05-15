import { createRouter, createWebHistory } from "vue-router";
import AuthLayout from "../layouts/AuthLayout.vue";
import Login from "../views/auth/Login.vue";
import AppLayout from "../components/AppLayout.vue";
import AuthChecker from "../layouts/AuthChecker.vue";

// 导入视图组件
const EdgeDashboard = () => import("../views/EdgeDashboard.vue");
const TerminalDashboard = () => import("../views/TerminalDashboard.vue");
const NodeManager = () => import("../views/NodeManager.vue");
const GroupManager = () => import("../views/GroupManager.vue");
const ResourceAllocation = () => import("../views/ResourceAllocation.vue");
const SearchOperation = () => import("../views/SearchOperation.vue");

const routes = [
    {
        path: "/",
        component: AuthChecker,
    },
    {
        path: "/auth",
        component: AuthLayout,
        children: [
            {
                path: "login",
                name: "Login",
                component: Login,
                meta: { title: "登录" },
            },
        ],
    },
    {
        path: "/app",
        component: AppLayout,
        children: [
            {
                path: "dashboard",
                name: "Dashboard",
                component: EdgeDashboard,
                meta: {
                    title: "可搜索加密资源分配系统——边缘层",
                    requiresAuth: true,
                    role: "manager",
                },
            },
            {
                path: "terminal",
                name: "TerminalDashboard",
                component: TerminalDashboard,
                meta: {
                    title: "可搜索加密资源分配系统——终端层",
                    requiresAuth: true,
                    role: "user",
                },
            },
            {
                path: "node-manager",
                name: "NodeManager",
                component: NodeManager,
                meta: { title: "节点管理", requiresAuth: true },
            },
            {
                path: "group-manager",
                name: "GroupManager",
                component: GroupManager,
                meta: { title: "群组管理", requiresAuth: true },
            },
            {
                path: "resource-allocation",
                name: "ResourceAllocation",
                component: ResourceAllocation,
                meta: { title: "资源分配", requiresAuth: true },
            },
            {
                path: "search-operation",
                name: "SearchOperation",
                component: SearchOperation,
                meta: { title: "搜索操作", requiresAuth: true },
            },
        ],
    },
    // 通配符路由，捕获所有未匹配的路径
    {
        path: "/:pathMatch(.*)*",
        redirect: { name: "Login" },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 全局前置守卫，用于设置页面标题和认证检查
router.beforeEach((to, from, next) => {
    // 设置页面标题
    document.title = to.meta.title
        ? `${to.meta.title}`
        : "元数据隐私保护资源分配系统";

    // 检查用户是否需要登录
    const isAuthenticated =
        localStorage.getItem("token") || sessionStorage.getItem("token");
    const userRole =
        localStorage.getItem("userRole") ||
        sessionStorage.getItem("userRole") ||
        "user";

    // 判断是否是管理员账号
    const userName = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))?.username
        : sessionStorage.getItem("user")
        ? JSON.parse(sessionStorage.getItem("user"))?.username
        : "";

    const isAdmin = userRole === "manager" || userName === "admin";

    // 只在开发环境输出调试信息
    if (import.meta.env.MODE !== "production") {
        console.log(
            "路由导航: ",
            to.path,
            "认证状态:",
            isAuthenticated ? "已登录" : "未登录",
            "用户角色:",
            userRole,
            "用户名:",
            userName,
            "是管理员:",
            isAdmin
        );
    }

    if (to.meta.requiresAuth && !isAuthenticated) {
        console.log("需要认证但用户未登录，重定向到登录页");
        next({ name: "Login" });
    } else if (to.path === "/" || to.path === "") {
        // 根路径重定向到对应角色的仪表板(已登录)或登录页(未登录)
        if (isAuthenticated) {
            if (isAdmin) {
                next({ name: "Dashboard" });
            } else {
                next({ name: "TerminalDashboard" });
            }
        } else {
            next({ name: "Login" });
        }
    } else if (to.path === "/auth/login" && isAuthenticated) {
        // 如果已登录，访问登录页时重定向到对应角色的仪表板
        if (isAdmin) {
            next({ name: "Dashboard" });
        } else {
            next({ name: "TerminalDashboard" });
        }
    } else if (to.meta.role && to.meta.role === "manager" && !isAdmin) {
        // 如果页面需要管理员角色但用户不是管理员，重定向到用户仪表板
        next({ name: "TerminalDashboard" });
    } else if (to.meta.role && to.meta.role === "user" && isAdmin) {
        // 如果页面需要普通用户角色但用户是管理员，重定向到管理员仪表板
        next({ name: "Dashboard" });
    } else if (to.path.includes("/app") && !isAuthenticated) {
        // 如果访问应用页面但未登录，重定向到登录页
        next({ name: "Login" });
    } else {
        next();
    }
});

export default router;
