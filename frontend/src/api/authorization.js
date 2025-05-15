import http from "./http";

/**
 * 授权测试API服务 - 提供授权令牌相关操作
 */
const AuthorizationService = {
    // 生成授权令牌
    generateToken(data) {
        return http.post("/auth/token", data);
    },

    // 验证授权令牌
    verifyToken(data) {
        return http.post("/auth/verify", data);
    },

    // 获取用户的授权令牌列表
    getTokensByUser(userId) {
        return http.get(`/auth/tokens/${userId}`);
    },

    // 获取所有授权令牌
    getTokens() {
        return http.get("/auth/tokens");
    },

    // 获取单个授权令牌详情
    getToken(id) {
        return http.get(`/auth/token/${id}`);
    },

    // 撤销授权令牌
    revokeToken(id) {
        return http.put(`/auth/revoke/${id}`);
    },
};

export default AuthorizationService;
