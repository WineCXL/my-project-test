import http from "./http";

/**
 * 匹配验证API服务 - 提供匹配验证和资源分配相关操作
 */
const MatchService = {
    // 验证匹配
    verifyMatch(data) {
        return http.post("/match/verify", data);
    },

    // 获取匹配结果列表
    getMatchResults(params) {
        return http.get("/match/results", { params });
    },

    // 获取单个匹配结果
    getMatchResult(id) {
        return http.get(`/match/result/${id}`);
    },

    // 基于匹配结果分配资源
    allocateResource(data) {
        return http.post("/match/allocate", data);
    },

    // 获取资源分配历史
    getAllocations(params) {
        return http.get("/match/allocations", { params });
    },

    // 获取单个资源分配详情
    getAllocation(id) {
        return http.get(`/match/allocation/${id}`);
    },
};

export default MatchService;
