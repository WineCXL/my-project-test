import { defineStore } from "pinia";
import { login, getUserInfo, logout } from "../api/auth";
import { ElMessage } from "element-plus";
import router from "../router";

export const useUserStore = defineStore("user", {
    state: () => ({
        token:
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            "",
        userInfo: JSON.parse(
            localStorage.getItem("user") ||
                sessionStorage.getItem("user") ||
                "{}"
        ),
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,
        isAdmin: (state) => state.userInfo?.role === "manager",
        isManager: (state) => state.userInfo?.role === "manager",
    },

    actions: {
        // 登录
        async login(loginForm, rememberMe) {
            try {
                console.log('发送登录请求');
                const response = await login(loginForm);
                if (!response.success) {
                    console.log('登录失败:', response.message);
                    return false;
                }
                const { token, user } = response.data;

                let role = user.role;
                if (user.username === 'admin') {
                    console.log('管理员用户登录成功');
                    role = 'manager';
                }

                this.token = token;
                if (rememberMe) {
                    localStorage.setItem("token", token);
                } else {
                    sessionStorage.setItem("token", token);
                }

                this.userInfo = { ...user, role };

                if (rememberMe) {
                    localStorage.setItem("user", JSON.stringify(this.userInfo));
                    localStorage.setItem("userRole", role);
                } else {
                    sessionStorage.setItem("user", JSON.stringify(this.userInfo));
                    sessionStorage.setItem("userRole", role);
                }

                console.log('用户登录成功', { role });

                if (router.currentRoute.value.path.includes("/auth")) {
                    setTimeout(() => {
                        if (
                            role === "manager" ||
                            loginForm.username === "admin"
                        ) {
                            console.log('导航到管理员仪表板');
                            router.replace("/app/dashboard");
                        } else {
                            console.log('导航到普通用户仪表板');
                            router.replace("/app/terminal");
                        }
                    }, 300);
                }

                return true;
            } catch (error) {
                console.log('登录过程出错:', error.message);
                ElMessage.error(error.response?.data?.message || "登录失败");
                return false;
            }
        },

        // 登出
        async logout() {
            try {
                await logout();

                // 清除状态
                this.token = "";
                this.userInfo = {};

                // 清除存储
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                localStorage.removeItem("userRole");
                sessionStorage.removeItem("userRole");

                // 跳转到登录页
                router.push("/auth/login");

                ElMessage.success("已安全退出登录");
                return true;
            } catch (error) {
                console.log('登出失败:', error);
                return false;
            }
        },

        // 获取用户信息
        async getUserInfo() {
            if (!this.token) return false;

            try {
                const response = await getUserInfo();
                const { data } = response;
                this.userInfo = data;

                // 更新本地存储
                if (localStorage.getItem("token")) {
                    localStorage.setItem("user", JSON.stringify(data));
                    localStorage.setItem("userRole", data.role || "user");
                } else {
                    sessionStorage.setItem("user", JSON.stringify(data));
                    sessionStorage.setItem("userRole", data.role || "user");
                }

                return true;
            } catch (error) {
                console.log('获取用户信息失败:', error);
                return false;
            }
        },
    },
});
