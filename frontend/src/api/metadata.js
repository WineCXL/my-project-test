import http from "./http";

/**
 * 元数据API服务 - 提供加密元数据相关操作
 */
const MetadataService = {
    // 创建加密元数据
    createMetadata(data) {
        return http.post("/metadata", data);
    },

    // 获取所有加密元数据
    getAllMetadata(params) {
        return http.get("/metadata", { params });
    },

    // 获取单个加密元数据
    getMetadata(id) {
        return http.get(`/metadata/${id}`);
    },

    // 按标签查询加密元数据
    getMetadataByTag(tag) {
        return http.get(`/metadata/tag/${tag}`);
    },

    // 按群组查询加密元数据
    getMetadataByGroup(groupId) {
        return http.get(`/metadata/group/${groupId}`);
    },

    // 编辑加密元数据
    updateMetadata(id, data) {
        return http.put(`/metadata/${id}`, data);
    },

    // 删除加密元数据
    deleteMetadata(id) {
        return http.delete(`/metadata/${id}`);
    },
};

export default MetadataService;
