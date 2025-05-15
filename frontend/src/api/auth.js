import http from "./http";

/**
 * 用户登录
 * @param {Object} data 登录数据
 * @returns {Promise} 返回登录结果
 */
export function login(data) {
    return http.post("/auth/signin", data);
}

/**
 * 获取当前用户信息
 * @returns {Promise} 返回用户信息
 */
export function getUserInfo() {
    return http.get("/auth/me");
}

/**
 * 退出登录
 * @returns {Promise} 退出结果
 */
export function logout() {
    // 由于后端可能没有实现logout接口，我们在前端处理登出逻辑
    return new Promise((resolve) => {
        // 清除token和用户信息
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");

        resolve({ success: true, message: "退出成功" });
    });
}
