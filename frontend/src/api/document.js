import http from "./http";

/**
 * 文档管理API服务
 */
const DocumentService = {
    // 获取用户文档
    getUserDocuments() {
        return http.get("documents/user");
    },

    // 生成关键词
    generateKeyword() {
        return http.get("documents/keyword/generate");
    },

    // 上传文档
    uploadDocument(formData) {
        return http.post("documents/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
};

export default DocumentService;
