module.exports = app => {
    const resources = require("../controllers/resource.controller.js");
    const router = require("express").Router();

    // 获取所有待处理的文档
    router.get("/pending", resources.findPendingDocuments);

    // 获取所有正在执行的文档
    router.get("/executing", resources.findExecutingDocuments);

    // 将文档分配给节点组
    router.post("/document/:documentId/allocate/:groupId", resources.allocateDocumentToGroup);

    // 手动完成文档处理
    router.post("/document/:documentId/complete", resources.completeDocument);

    // 自动匹配文档和空闲群组
    router.post("/auto-allocate", resources.autoAllocate);

    app.use("/api/resources", router);
};
