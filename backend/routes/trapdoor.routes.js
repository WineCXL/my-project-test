/**
 * 陷门路由模块
 *
 * 负责处理陷门(Trapdoor)的创建、查询、搜索和撤销等功能
 * 陷门是一种特殊的密文，用于在不泄露关键词的情况下进行搜索
 * 实现基于《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》论文
 */
const { verifyToken, hasPermission } = require("../middleware/auth.middleware");

module.exports = (app) => {
    const trapdoors = require("../controllers/trapdoor.controller.js");
    const router = require("express").Router();

    /**
     * 创建新的陷门
     * POST /api/trapdoors
     *
     * 基于关键词和群组信息创建新的搜索陷门
     * 需要用户具有创建陷门的权限
     */
    router.post(
        "/",
        [verifyToken, hasPermission("trapdoor:create")],
        trapdoors.create
    );

    /**
     * 获取所有陷门列表
     * GET /api/trapdoors
     *
     * 返回系统中所有陷门的列表
     * 需要用户登录
     */
    router.get("/", [verifyToken], trapdoors.findAll);

    /**
     * 获取陷门统计信息
     * GET /api/trapdoors/stats
     *
     * 返回系统中陷门的统计数据，包括总数、活跃数量和按群组分类的数量
     * 需要用户登录
     */
    router.get("/stats", [verifyToken], trapdoors.getStats);

    /**
     * 获取单个陷门详情
     * GET /api/trapdoors/:id
     *
     * 返回特定陷门的详细信息
     * 需要用户登录
     * @param {string} id - 陷门ID
     */
    router.get("/:id", [verifyToken], trapdoors.findOne);

    /**
     * 使用陷门进行搜索
     * POST /api/trapdoors/:id/search
     *
     * 使用指定陷门在加密数据中搜索匹配的资源
     * 需要用户具有搜索权限
     * @param {string} id - 陷门ID
     */
    router.post(
        "/:id/search",
        [verifyToken, hasPermission("search")],
        trapdoors.search
    );

    /**
     * 撤销陷门
     * PUT /api/trapdoors/:id/revoke
     *
     * 将陷门状态更新为已撤销，使其不再可用于搜索
     * 需要用户具有创建陷门的权限
     * @param {string} id - 要撤销的陷门ID
     */
    router.put(
        "/:id/revoke",
        [verifyToken, hasPermission("trapdoor:create")],
        trapdoors.revoke
    );

    // 注册路由
    app.use("/api/trapdoors", router);
};
