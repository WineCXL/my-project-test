module.exports = app => {
    const resources = require("../controllers/resource.controller.js");
    const router = require("express").Router();

    // 创建新资源
    router.post("/", resources.create);

    // 获取所有资源
    router.get("/", resources.findAll);

    // 获取单个资源
    router.get("/:id", resources.findOne);

    // 按资源ID查找资源
    router.get("/resourceId/:resourceId", resources.findByResourceId);

    // 按关键词搜索资源
    router.get("/search/:keyword", resources.searchByKeyword);

    // 更新资源
    router.put("/:id", resources.update);

    // 分配资源到群组
    router.post("/:id/allocate/:groupId", resources.allocateToGroup);

    // 删除资源
    router.delete("/:id", resources.delete);

    app.use("/api/resources", router);
}; 