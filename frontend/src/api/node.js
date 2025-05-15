import http from "./http";

// 获取所有节点
export function getNodes() {
    return http.get("/nodes");
}

// 获取单个节点
export function getNode(id) {
    return http.get(`/nodes/${id}`);
}

// 创建节点
export function createNode(data) {
    return http.post("/nodes", data);
}

// 更新节点
export function updateNode(id, data) {
    return http.put(`/nodes/${id}`, data);
}

// 删除节点
export function deleteNode(id) {
    return http.delete(`/nodes/${id}`);
}

// 注册节点
export function registerNode(data) {
    return http.post("/nodes/register", data);
}
