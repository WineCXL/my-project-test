const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/database");
const nodeRoutes = require("./routes/node.routes");
const groupRoutes = require("./routes/group.routes");
const systemRoutes = require("./routes/system.routes");
const resourceRoutes = require("./routes/resource.routes");
const searchRoutes = require("./routes/search.routes");
const trapdoorRoutes = require("./routes/trapdoor.routes");
const db = require("./models/index");
const cryptoEngine = require("./lib/crypto");

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 测试数据库连接
sequelize
    .authenticate()
    .then(() => console.log("MySQL 数据库连接成功 (端口: 3306)"))
    .catch((err) => console.error("MySQL 数据库连接失败:", err));

// 将verifyKeywordMatch函数定义为全局函数，以便在setupExecutionTimer中使用
// 此函数会被document.routes.js中的同名函数覆盖
global.verifyKeywordMatch = function (keywordX, keywordY, trapdoor) {
    console.error("验证函数未正确初始化");
    return false;
};

// 路由定义，document.routes.js应该在setupExecutionTimer之前加载，以便正确导出函数
// 保持路由导入的顺序不变，但确保document.routes在启动定时任务前加载
require("./routes/auth.routes")(app);
require("./routes/system.routes")(app);
require("./routes/resource.routes")(app);
require("./routes/user.routes")(app);
require("./routes/stats.routes")(app);

// 这一部分是关键：在document.routes.js中，我们会将verifyKeywordMatch函数赋值给global对象
const documentRoutes = require("./routes/document.routes")(app);

app.use("/api/nodes", nodeRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/trapdoor", trapdoorRoutes);

// 启动文档执行状态检查定时任务
setupExecutionTimer();

// 添加健康检查路由
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "服务器正常运行" });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);

    // 设置适当的状态码，默认为500
    const statusCode = err.statusCode || 500;

    // 返回JSON格式错误
    res.status(statusCode).json({
        success: false,
        message: err.message || "服务器内部错误",
        error: process.env.NODE_ENV === "development" ? err.stack : {},
    });
});

// 处理404错误并确保返回JSON
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "未找到请求的资源",
    });
});

// API服务器端口设置为3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`后端API服务器运行在端口 ${PORT}`);
    console.log(`API 地址: http://localhost:${PORT}/api`);
});

// 定时任务：检查执行中的文档，2分钟后自动完成并释放资源
// 定时任务：1. 检查等待中的文档并进行关键词匹配 2. 检查执行中的文档完成情况
function setupExecutionTimer() {
    setInterval(async () => {
        try {
            // 第一部分：处理等待中的文档（进行关键词匹配）
            const pendingDocKeywords = await db.DocumentKeyword.findAll({
                where: {
                    status: "pending",
                    [db.Sequelize.Op.or]: [
                        { keywordMatched: null },
                        { keywordMatched: 1 },
                    ],
                },
                include: [
                    {
                        model: db.Document,
                        attributes: ["id", "title", "documentId", "content"],
                    },
                    {
                        model: db.Keyword,
                        attributes: [
                            "id",
                            "keywordId",
                            "keywordX",
                            "keywordY",
                            "trapdoorValue",
                        ],
                    },
                ],
            });

            if (pendingDocKeywords.length > 0) {
                console.log(
                    `🔍 检查到 ${pendingDocKeywords.length} 个等待中的文档任务需要进行关键词匹配`
                );

                for (const docKeyword of pendingDocKeywords) {
                    try {
                        // 获取关联的文档信息和关键词信息
                        const document = docKeyword.Document;
                        const keyword = docKeyword.Keyword;

                        if (document && keyword) {
                            // 进行关键词匹配验证
                            const keywordX = keyword.keywordX;
                            const keywordY = keyword.keywordY;
                            const trapdoor = keyword.trapdoorValue;

                            // 使用全局函数进行验证
                            const isMatched = global.verifyKeywordMatch(
                                keywordX,
                                keywordY,
                                trapdoor
                            );

                            // 更新匹配结果
                            await docKeyword.update({
                                keywordMatched: isMatched,
                            });

                            // 根据匹配结果决定下一步
                            if (isMatched) {
                                console.log(
                                    `✅ 文档 "${document.title}" (ID: ${document.documentId}) 关键词匹配成功，准备分配节点组`
                                );

                                // 查找空闲的群组
                                const idleGroup = await db.Group.findOne({
                                    where: { status: "idle" },
                                });

                                if (idleGroup) {
                                    // 如果有空闲群组，分配给文档并将状态改为执行中
                                    await docKeyword.update({
                                        assignedGroupId: idleGroup.id,
                                        status: "executing",
                                    });

                                    // 更新群组状态为忙碌
                                    await idleGroup.update({ status: "busy" });
                                    console.log(
                                        `✅ 文档 "${document.title}" (ID: ${document.documentId}) 分配给节点组 #${idleGroup.id} (${idleGroup.groupName})`
                                    );
                                } else {
                                    console.log(
                                        `⏳ 文档 "${document.title}" (ID: ${document.documentId}) 关键词匹配成功，但无空闲节点组，等待下次分配`
                                    );
                                }
                            } else {
                                // 匹配失败，设置为错误状态
                                await docKeyword.update({ status: "error" });
                                console.log(
                                    `❌ 文档 "${document.title}" (ID: ${document.documentId}) 关键词匹配失败，标记为异常状态`
                                );
                            }
                        }
                    } catch (error) {
                        console.error(
                            `❌ 处理等待中文档 #${docKeyword.id} 时出错:`,
                            error
                        );
                    }
                }
            }

            // 第二部分：处理执行中的文档（检查是否完成）
            const executingDocKeywords = await db.DocumentKeyword.findAll({
                where: {
                    status: "executing",
                    assignedGroupId: { [db.Sequelize.Op.ne]: null },
                    keywordMatched: true, // 只处理已匹配成功的文档
                },
                include: [
                    {
                        model: db.Document,
                        attributes: ["id", "title", "documentId"],
                    },
                ],
            });

            if (executingDocKeywords.length > 0) {
                console.log(
                    `🔍 检查到 ${executingDocKeywords.length} 个执行中的文档任务`
                );

                const now = Date.now();
                let completedCount = 0;

                for (const docKeyword of executingDocKeywords) {
                    try {
                        // 获取文档信息
                        const document = docKeyword.Document;

                        // 获取最后更新时间（分配给节点组的时间）
                        const updatedAt = new Date(
                            docKeyword.updatedAt
                        ).getTime();
                        // 计算时间差（毫秒）
                        const timeDiff = now - updatedAt;

                        // 如果已经超过2分钟（120秒 = 120000毫秒）
                        if (timeDiff >= 120000) {
                            // 设置为已完成
                            await docKeyword.update({ status: "completed" });
                            completedCount++;

                            const documentInfo = document
                                ? `文档 "${document.title}" (ID: ${document.documentId})`
                                : `文档任务 #${docKeyword.id}`;

                            // 释放对应的群组资源
                            if (docKeyword.assignedGroupId) {
                                const group = await db.Group.findByPk(
                                    docKeyword.assignedGroupId
                                );
                                if (group && group.status === "busy") {
                                    await group.update({ status: "idle" });
                                    console.log(
                                        `✅ ${documentInfo} 执行完成，释放群组 #${group.id} (${group.groupName})`
                                    );
                                }
                            } else {
                                console.log(
                                    `✅ ${documentInfo} 执行完成，无关联群组`
                                );
                            }
                        }
                    } catch (taskError) {
                        console.error(
                            `❌ 处理执行中文档 #${docKeyword.id} 时出错:`,
                            taskError
                        );
                    }
                }

                if (completedCount > 0) {
                    console.log(
                        `🎉 处理了 ${completedCount} 个文档任务：${completedCount}个完成`
                    );
                }
            }
        } catch (error) {
            console.error("❌ 执行状态检查失败:", error);
        }
    }, 30000); // 每30秒检查一次

    console.log("⏱️  文档执行状态自动检查定时任务已启动，每30秒检查一次");
}
