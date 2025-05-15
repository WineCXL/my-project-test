import http from "./http";

// 获取所有群组
export function getGroups() {
    return http.get("/groups");
}

// 获取单个群组
export function getGroup(id) {
    return http.get(`/groups/${id}`);
}

// 创建群组
export function createGroup(data) {
    // 确保传递了groupId、groupName和固定的maxNodes参数
    if (!data.groupId) {
        console.error("创建群组缺少必要参数：groupId");
        throw new Error("群组ID是必须的");
    }
    if (!data.groupName) {
        console.error("创建群组缺少必要参数：groupName");
        throw new Error("群组名称是必须的");
    }

    // 设置固定的节点数为4
    const groupData = {
        ...data,
        maxNodes: 4
    };

    return http.post("/groups", groupData);
}

// 更新群组
export function updateGroup(id, data) {
    return http.put(`/groups/${id}`, data);
}

// 删除群组
export function deleteGroup(id) {
    return http.delete(`/groups/${id}`);
}

// 获取群组成员
export function getGroupMembers(groupId) {
    return http.get(`/nodes/bygroup/${groupId}`);
}

// 添加群组成员
export function addGroupMember(groupId, nodeId) {
    return http.post(`/nodes/bygroup/${groupId}`, { nodeId });
}

// 删除群组成员
export function removeGroupMember(groupId, nodeId) {
    return http.delete(`/nodes/bygroup/${groupId}/byid/${nodeId}`);
}

// 验证群组所有节点
export function verifyGroup(groupId) {
    return http.post(`/groups/${groupId}/verify`);
}
