module.exports = (app) => {
    const stats = require("../controllers/stats.controller.js");
    const router = require("express").Router();

    // 获取节点状态统计
    router.get("/nodes", stats.getNodeStats);

    // 获取群组状态统计
    router.get("/groups", stats.getGroupStats);

    // 获取资源状态统计
    router.get("/resources", stats.getResourceStats);

    app.use("/api/stats", router);
};
