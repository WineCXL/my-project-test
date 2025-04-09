module.exports = app => {
    const groups = require("../controllers/group.controller.js");
    const router = require("express").Router();

    // 创建新群组
    router.post("/", groups.create);

    // 获取所有群组
    router.get("/", groups.findAll);

    // 获取单个群组
    router.get("/:id", groups.findOne);

    // 按群组ID查找群组
    router.get("/groupId/:groupId", groups.findByGroupId);

    // 更新群组
    router.put("/:id", groups.update);

    // 添加节点到群组
    router.post("/:id/nodes/:nodeId", groups.addNode);

    // 从群组移除节点
    router.delete("/:id/nodes/:nodeId", groups.removeNode);

    // 删除群组
    router.delete("/:id", groups.delete);

    app.use("/api/groups", router);
}; 