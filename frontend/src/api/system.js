import http from "./http";

// 获取系统参数
export function getSystemParams() {
    return http.get("/system/params");
}

// 更新系统参数
export function updateSystemParams(data) {
    return http.put("/system/params", data);
}

// 初始化系统
export function initializeSystem(data) {
    return http.post("/system/initialize", data);
}

// 获取系统状态
export function getSystemStatus() {
    return http.get("/system/status");
}
