import http from "./http";

/**
 * 资源分配API服务
 */
const ResourceAllocationService = {
    // 获取所有资源分配
    getAll() {
        return http.get("/resources/allocation");
    },

    // 获取单个资源分配
    get(id) {
        return http.get(`/resources/allocation/${id}`);
    },

    // 创建新的资源分配
    create(data) {
        return http.post("/resources/allocation", data);
    },

    // 创建私有资源分配（元数据隐私保护）
    createPrivate(data) {
        return http.post("/resources/allocation/private", data);
    },

    // 更新资源分配
    update(id, data) {
        return http.put(`/resources/allocation/${id}`, data);
    },

    // 删除资源分配
    delete(id) {
        return http.delete(`/resources/allocation/${id}`);
    },

    // 创建加密元数据
    createEncryptedMetadata(data) {
        return http.post("/resources/metadata", data);
    },

    // 生成陷门
    generateTrapdoor(data) {
        return http.post("/resources/trapdoor", data);
    },

    // 执行符合论文方案的资源分配
    allocateResourcesByKeywords(data) {
        return http.post("/resources/allocate-by-keywords", data);
    },

    // 获取指定用户的资源分配
    getUserAllocations(userId) {
        return http.get(`/resources/allocation/user/${userId}`);
    },

    // 获取指定边缘节点的资源分配
    getEdgeNodeAllocations(nodeId) {
        return http.get(`/resources/allocation/edge/${nodeId}`);
    },

    // 验证资源分配结果
    verifyAllocation(id, userPrivateKey) {
        return http.get(`/resources/allocation/${id}/verify/${userPrivateKey}`);
    },
};

export default ResourceAllocationService;
