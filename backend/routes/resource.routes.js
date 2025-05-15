module.exports = (app) => {
    const resources = require("../controllers/resource.controller.js");
    const router = require("express").Router();
    const db = app.get("db") || require("../models");
    const authMiddleware = require("../middleware/auth.middleware.js");

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

    // 添加资源分配信息路由 - 使用与documents/user相同的数据格式
    router.get("/allocation", async (req, res) => {
        try {
            /*
            // 调试信息：查看数据库中的实际状态
            const dbStatus = await db.DocumentKeyword.findAll({
                attributes: [
                    "id",
                    "documentId",
                    "keywordId",
                    "keywordMatched",
                    "status",
                    "assignedGroupId",
                ],
                raw: true,
            });
            console.log(
                "数据库中的DocumentKeyword记录:",
                JSON.stringify(dbStatus, null, 2)
            );
            */

            // 获取所有文档和相关信息，包括用户数据（管理员可查看所有）
            const documents = await db.Document.findAll({
                include: [
                    {
                        model: db.DocumentKeyword,
                        attributes: [
                            "id",
                            "keywordMatched",
                            "status",
                            "assignedGroupId",
                            "createdAt",
                            "updatedAt",
                        ],
                        required: true,
                    },
                    {
                        model: db.Keyword,
                        attributes: ["keywordId"],
                    },
                    {
                        model: db.User,
                        attributes: ["username"],
                    },
                ],
                order: [["createdAt", "DESC"]],
            });

            /*
            // 打印调试信息
            if (documents.length > 0) {
                console.log(
                    "查询到的第一个文档:",
                    JSON.stringify(documents[0].toJSON(), null, 2)
                );
            }
            */

            // 格式化返回数据
            const formattedDocuments = documents.map((doc) => {
                const docJson = doc.toJSON();

                // 获取DocumentKeyword数组的第一个元素（如果存在）
                const docKeyword =
                    docJson.DocumentKeywords &&
                    docJson.DocumentKeywords.length > 0
                        ? docJson.DocumentKeywords[0]
                        : null;

                return {
                    id: docKeyword ? docKeyword.id : docJson.id,
                    documentId: docJson.documentId,
                    title: docJson.title,
                    createdAt: docJson.createdAt,
                    keywords: docJson.Keyword
                        ? docJson.Keyword.keywordId
                        : null,
                    executionStatus: docKeyword ? docKeyword.status : "pending",
                    keywordMatched: docKeyword
                        ? !!docKeyword.keywordMatched
                        : false,
                    assignedGroupId: docKeyword
                        ? docKeyword.assignedGroupId
                        : null,
                    username: docJson.User ? docJson.User.username : null,
                };
            });

            /*
            // 打印调试信息
            if (formattedDocuments.length > 0) {
                console.log(
                    "格式化后的第一个文档:",
                    JSON.stringify(formattedDocuments[0], null, 2)
                );
            }
            */

            return res.json({
                success: true,
                data: formattedDocuments,
            });
        } catch (error) {
            console.error("获取资源分配信息失败:", error);
            return res.status(500).json({
                success: false,
                message: "获取资源分配信息失败: " + error.message,
            });
        }
    });

    // 修改资源统计API以兼容DocumentKeyword表
    router.get("/stats", async (req, res) => {
        try {
            // 使用DocumentKeyword表查询资源统计
            const pendingCount = await db.DocumentKeyword.count({
                where: { status: "pending" },
            });

            const executingCount = await db.DocumentKeyword.count({
                where: { status: "executing" },
            });

            const completedCount = await db.DocumentKeyword.count({
                where: { status: "completed" },
            });

            const errorCount = await db.DocumentKeyword.count({
                where: { status: "error" },
            });

            const totalCount =
                pendingCount + executingCount + completedCount + errorCount;

            return res.status(200).json({
                success: true,
                data: {
                    totalResources: totalCount,
                    pendingResources: pendingCount,
                    executingResources: executingCount,
                    completedResources: completedCount,
                    errorResources: errorCount,
                },
            });
        } catch (error) {
            console.error("获取资源统计失败:", error);
            return res.status(500).json({
                success: false,
                message: "获取资源统计失败",
            });
        }
    });

    // 获取当前用户的资源分配
    router.get('/my-allocation', authMiddleware.verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;

            // 使用与管理员相同的查询模式，只增加WHERE条件
            const documents = await db.Document.findAll({
                where: { userId: userId }, // 只查询当前用户的文档
                include: [
                    {
                        model: db.DocumentKeyword,
                        attributes: [
                            "id",
                            "keywordMatched",
                            "status",
                            "assignedGroupId",
                            "createdAt",
                            "updatedAt"
                        ],
                        required: true,
                    },
                    {
                        model: db.Keyword,
                        attributes: ["keywordId"],
                    },
                    {
                        model: db.User,
                        attributes: ["username"],
                    }
                ],
                order: [["createdAt", "DESC"]],
            });

            // 使用与管理员相同的格式化方式
            const formattedDocuments = documents.map((doc) => {
                const docJson = doc.toJSON();

                // 获取DocumentKeyword数组的第一个元素（如果存在）
                const docKeyword =
                    docJson.DocumentKeywords &&
                    docJson.DocumentKeywords.length > 0
                        ? docJson.DocumentKeywords[0]
                        : null;

                return {
                    id: docKeyword ? docKeyword.id : docJson.id,
                    documentId: docJson.documentId,
                    title: docJson.title,
                    createdAt: docJson.createdAt,
                    keywords: docJson.Keyword
                        ? docJson.Keyword.keywordId
                        : null,
                    executionStatus: docKeyword ? docKeyword.status : "pending",
                    keywordMatched: docKeyword
                        ? !!docKeyword.keywordMatched
                        : false,
                    assignedGroupId: docKeyword
                        ? docKeyword.assignedGroupId
                        : null,
                    username: docJson.User ? docJson.User.username : null,
                };
            });

            return res.json({
                success: true,
                data: formattedDocuments,
            });
        } catch (error) {
            console.error('获取用户资源列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取用户资源列表失败',
                error: error.message
            });
        }
    });

    // 获取当前用户的资源统计
    router.get('/my-stats', authMiddleware.verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;

            // 使用关联查询和分组操作一次性获取所有状态计数
            const stats = await db.DocumentKeyword.findAll({
                attributes: [
                    'status',
                    [db.sequelize.fn('COUNT', db.sequelize.col('status')), 'count']
                ],
                include: [{
                    model: db.Document,
                    where: { userId: userId },
                    attributes: []
                }],
                group: ['status']
            });

            // 处理结果
            let pendingResources = 0;
            let executingResources = 0;
            let completedResources = 0;
            let errorResources = 0;

            stats.forEach(stat => {
                const item = stat.toJSON();
                const count = parseInt(item.count);
                switch(item.status) {
                    case 'pending': pendingResources = count; break;
                    case 'executing': executingResources = count; break;
                    case 'completed': completedResources = count; break;
                    case 'error': errorResources = count; break;
                }
            });

            const totalResources = pendingResources + executingResources + completedResources + errorResources;

            return res.json({
                success: true,
                data: {
                    totalResources,
                    pendingResources,
                    executingResources,
                    completedResources,
                    errorResources
                }
            });
        } catch (error) {
            console.error('获取用户资源统计信息失败:', error);
            res.status(500).json({
                success: false,
                message: '获取用户资源统计信息失败',
                error: error.message
            });
        }
    });

    // 获取当前用户的待处理资源
    router.get('/my-pending', authMiddleware.verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;

            // 与管理员查询相同，增加用户过滤
            const documents = await db.Document.findAll({
                where: { userId: userId },
                include: [
                    {
                        model: db.DocumentKeyword,
                        where: { status: "pending" }, // 只查询pending状态
                        attributes: [
                            "id",
                            "keywordMatched",
                            "status",
                            "assignedGroupId",
                            "createdAt",
                            "updatedAt"
                        ],
                        required: true,
                    },
                    {
                        model: db.Keyword,
                        attributes: ["keywordId"]
                    },
                    {
                        model: db.User,
                        attributes: ["username"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            // 格式化返回数据
            const formattedDocuments = documents.map((doc) => {
                const docJson = doc.toJSON();

                // 获取DocumentKeyword数组的第一个元素（如果存在）
                const docKeyword =
                    docJson.DocumentKeywords &&
                    docJson.DocumentKeywords.length > 0
                        ? docJson.DocumentKeywords[0]
                        : null;

                return {
                    id: docKeyword ? docKeyword.id : docJson.id,
                    documentId: docJson.documentId,
                    title: docJson.title,
                    createdAt: docJson.createdAt,
                    keywords: docJson.Keyword
                        ? docJson.Keyword.keywordId
                        : null,
                    executionStatus: docKeyword ? docKeyword.status : "pending",
                    keywordMatched: docKeyword
                        ? !!docKeyword.keywordMatched
                        : false,
                    assignedGroupId: docKeyword
                        ? docKeyword.assignedGroupId
                        : null,
                    username: docJson.User ? docJson.User.username : null,
                };
            });

            return res.json({
                success: true,
                data: formattedDocuments
            });
        } catch (error) {
            console.error('获取用户待处理资源失败:', error);
            res.status(500).json({
                success: false,
                message: '获取用户待处理资源失败',
                error: error.message
            });
        }
    });

    // 获取当前用户的执行中资源
    router.get('/my-executing', authMiddleware.verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;

            // 与管理员查询相同，增加用户过滤
            const documents = await db.Document.findAll({
                where: { userId: userId },
                include: [
                    {
                        model: db.DocumentKeyword,
                        where: { status: "executing" }, // 只查询executing状态
                        attributes: [
                            "id",
                            "keywordMatched",
                            "status",
                            "assignedGroupId",
                            "createdAt",
                            "updatedAt"
                        ],
                        required: true,
                    },
                    {
                        model: db.Keyword,
                        attributes: ["keywordId"]
                    },
                    {
                        model: db.User,
                        attributes: ["username"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            // 格式化返回数据
            const formattedDocuments = documents.map((doc) => {
                const docJson = doc.toJSON();

                // 获取DocumentKeyword数组的第一个元素（如果存在）
                const docKeyword =
                    docJson.DocumentKeywords &&
                    docJson.DocumentKeywords.length > 0
                        ? docJson.DocumentKeywords[0]
                        : null;

                return {
                    id: docKeyword ? docKeyword.id : docJson.id,
                    documentId: docJson.documentId,
                    title: docJson.title,
                    createdAt: docJson.createdAt,
                    keywords: docJson.Keyword
                        ? docJson.Keyword.keywordId
                        : null,
                    executionStatus: docKeyword ? docKeyword.status : "pending",
                    keywordMatched: docKeyword
                        ? !!docKeyword.keywordMatched
                        : false,
                    assignedGroupId: docKeyword
                        ? docKeyword.assignedGroupId
                        : null,
                    username: docJson.User ? docJson.User.username : null,
                };
            });

            return res.json({
                success: true,
                data: formattedDocuments
            });
        } catch (error) {
            console.error('获取用户执行中资源失败:', error);
            res.status(500).json({
                success: false,
                message: '获取用户执行中资源失败',
                error: error.message
            });
        }
    });

    app.use("/api/resources", router);
};
