/**
 * 加密搜索路由模块
 *
 * 负责处理加密搜索相关的路由
 * 实现基于《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》论文
 * 允许用户在不泄露原始关键词的情况下搜索加密资源
 */
const { verifyToken, hasPermission } = require("../middleware/auth.middleware");

module.exports = (app) => {
    const searches = require("../controllers/search.controller.js");
    const router = require("express").Router();

    /**
     * 执行加密搜索
     * POST /api/searches
     *
     * 基于关键词和群组执行加密搜索操作
     * 搜索关键词会被转换为陷门后执行搜索
     * 需要用户具有搜索权限
     * @body {string} keyword - 搜索关键词
     * @body {string} groupId - 用于搜索的群组ID
     */
    router.post("/", [verifyToken, hasPermission("search")], searches.search);

    /**
     * 获取搜索历史
     * GET /api/searches
     *
     * 返回用户执行过的搜索历史记录
     * 包含搜索关键词、结果、执行时间等信息
     * 需要用户登录
     */
    /*
    router.get("/", [verifyToken], searches.findAll);
    */

    /**
     * 获取搜索统计
     * GET /api/searches/stats
     *
     * 返回系统中搜索操作的统计信息
     * 包括总搜索次数、成功率、平均执行时间等
     * 需要管理员权限
     */
    /*
    router.get(
        "/stats",
        [verifyToken, hasPermission("admin")],
        searches.getStats
    );
    */

    /**
     * 获取单个搜索详情
     * GET /api/searches/:id
     *
     * 返回特定搜索操作的详细信息
     * 包括搜索关键词、结果、执行时间等
     * 需要用户登录
     * @param {string} id - 搜索操作ID
     */
    /*
        router.get("/:id", [verifyToken], searches.findOne);
    */

    // 删除搜索记录
    /*
    router.delete("/:id", searches.delete);
    */

    // 注册路由
    app.use("/api/searches", router);
};
