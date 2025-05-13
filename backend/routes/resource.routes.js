module.exports = (app) => {
    const resources = require("../controllers/resource.controller.js");
    const router = require("express").Router();
    const db = app.get("db") || require("../models");

    // 获取所有待处理的文档
    router.get("/pending", resources.findPendingDocuments);

    // 获取所有正在执行的文档
    router.get("/executing", resources.findExecutingDocuments);

    // 将文档分配给节点组
    router.post(
        "/document/:documentId/allocate/:groupId",
        resources.allocateDocumentToGroup
    );

    // 手动完成文档处理
    router.post("/document/:documentId/complete", resources.completeDocument);

    // 自动匹配文档和空闲群组
    router.post("/auto-allocate", resources.autoAllocate);

    // 添加资源分配信息路由
    router.get("/allocation", async (req, res) => {
        try {
            // 查询所有已分配资源的文档
            const allocatedDocs = await db.Document.findAll({
                where: {
                    assignedGroupId: { [db.Sequelize.Op.not]: null },
                },
                include: [
                    {
                        model: db.Group,
                        attributes: ["id", "groupId", "groupName", "status"],
                    },
                ],
            });

            return res.status(200).json({
                success: true,
                count: allocatedDocs.length,
                data: allocatedDocs,
            });
        } catch (error) {
            console.error("获取资源分配信息失败:", error);
            return res.status(200).json({
                // 即使出错也返回200状态码和空数组
                success: true,
                count: 0,
                data: [],
            });
        }
    });

    app.use("/api/resources", router);
};
