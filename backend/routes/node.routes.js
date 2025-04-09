module.exports = app => {
    const nodes = require("../controllers/node.controller.js");
    const router = require("express").Router();

    // 创建新节点
    router.post("/", nodes.create);

    // 获取所有节点
    router.get("/", nodes.findAll);

    // 获取单个节点
    router.get("/:id", nodes.findOne);

    // 按节点ID查找节点
    router.get("/nodeId/:nodeId", nodes.findByNodeId);

    // 更新节点
    router.put("/:id", nodes.update);

    // 删除节点
    router.delete("/:id", nodes.delete);

    app.use("/api/nodes", router);
}; 