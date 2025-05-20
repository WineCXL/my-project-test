module.exports = (app) => {
    const router = require("express").Router();
    const db = require("../models");
    const multer = require("multer");
    const path = require("path");
    const fs = require("fs");
    const crypto = require("crypto");
    const BN = require("bn.js");
    const cryptoEngine = require("../lib/crypto_engine_js"); // 导入加密引擎
    const authMiddleware = require("../middleware/auth.middleware");

    /**
     * 生成陷门值
     * X和扩展Y之间的直接数学运算
     * @param {string} keywordX - 64位16进制数
     * @param {string} keywordY - 32位16进制数
     * @returns {string} - 64位16进制陷门值
     */
    function generateTrapdoor(keywordX, keywordY) {
        // 将Y扩展到64位
        const extendedY = keywordY.padEnd(64, keywordY);

        // 逐位进行异或运算，直接生成陷门
        let trapdoor = "";
        for (let i = 0; i < 64; i++) {
            // 16进制字符异或操作
            const xChar = parseInt(keywordX.charAt(i), 16);
            const yChar = parseInt(extendedY.charAt(i), 16);
            trapdoor += (xChar ^ yChar).toString(16);
        }

        return trapdoor;
    }

    /**
     * 验证关键词匹配
     * 只比较陷门值是否一致
     * @param {string} keywordX - X值
     * @param {string} keywordY - Y值
     * @param {string} trapdoor - 陷门值
     * @returns {boolean} - 是否匹配
     */
    function verifyKeywordMatch(keywordX, keywordY, trapdoor) {
        try {
            // 重新计算预期的陷门值
            const expectedTrapdoor = generateTrapdoor(keywordX, keywordY);

            // 检查陷门是否匹配
            return expectedTrapdoor === trapdoor;
        } catch (error) {
            console.error("关键词验证过程出错:", error);
            return false;
        }
    }

    // 将验证函数导出为全局函数
    global.verifyKeywordMatch = verifyKeywordMatch;

    // 配置文件上传
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, "../uploads");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const timestamp = Date.now();
            const ext = path.extname(file.originalname);
            cb(null, `${timestamp}-${file.originalname}`);
        },
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
        fileFilter: function (req, file, cb) {
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext === ".txt" || file.mimetype === "text/plain") {
                cb(null, true);
            } else {
                cb(new Error("只能上传文本文件"));
            }
        },
    }).single("file");

    // 生成随机原始关键词接口
    router.get("/keyword/generate", async (req, res) => {
        try {
            // 使用加密引擎生成随机原始关键词
            const keyword = cryptoEngine.generateOriginalKeyword();

            return res.json({
                success: true,
                data: { keyword },
            });
        } catch (error) {
            console.error("生成关键词失败:", error);
            return res.status(500).json({
                success: false,
                message: "生成关键词失败",
            });
        }
    });

    // 生成格式化的ID
    async function generateFormattedId(prefix, model) {
        const maxRetries = 3; // 最大重试次数
        let retryCount = 0;

        while (retryCount < maxRetries) {
            // 开始事务
            const t = await db.sequelize.transaction();

            try {
                // 查询该前缀的最大ID
                let query = {};
                let idField = "id";

                // 针对不同模型使用不同的字段
                if (prefix === "keyWord") {
                    idField = "keywordId";
                    query = {
                        where: {
                            keywordId: {
                                [db.Sequelize.Op.like]: `${prefix}-%`,
                            },
                        },
                        lock: t.LOCK.UPDATE, // 添加行锁
                    };
                } else if (prefix === "document") {
                    idField = "documentId";
                    query = {
                        where: {
                            documentId: {
                                [db.Sequelize.Op.like]: `${prefix}-%`,
                            },
                        },
                        lock: t.LOCK.UPDATE, // 添加行锁
                    };
                }

                const items = await model.findAll({
                    ...query,
                    order: [[idField, "DESC"]],
                    limit: 1,
                    transaction: t,
                });

                // 获取编号
                let number = 1;
                if (items && items.length > 0) {
                    const lastItem = items[0];
                    const lastId = lastItem[idField];
                    if (lastId) {
                        const matches = lastId.toString().match(/-(\d+)$/);
                        if (matches && matches[1]) {
                            number = parseInt(matches[1], 10) + 1;
                        }
                    }
                }

                // 提交事务
                await t.commit();

                // 返回格式化的ID
                return `${prefix}-${number}`;
            } catch (error) {
                // 回滚事务
                await t.rollback();

                // 如果是唯一约束错误，增加重试次数
                if (error.name === "SequelizeUniqueConstraintError") {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        // 等待一小段时间后重试
                        await new Promise((resolve) =>
                            setTimeout(resolve, 100 * retryCount)
                        );
                        continue;
                    }
                }

                console.error(`生成${prefix} ID失败:`, error);

                // 使用UUID作为备选方案
                const uuid = crypto.randomBytes(16).toString("hex");
                return `${prefix}-${uuid}`;
            }
        }
    }

    // 文档上传处理
    router.post("/upload", authMiddleware.verifyToken, async (req, res) => {
        try {
            // 处理文件上传
            upload(req, res, async function (err) {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message,
                    });
                }

                try {
                    // 确保文件已上传
                    if (!req.file) {
                        return res.status(400).json({
                            success: false,
                            message: "请上传文件",
                        });
                    }

                    // 从请求中获取标题和原始关键词
                    const title = req.body.title;
                    //const originalKeyword = req.body.keyword;

                    // 读取文件内容
                    const filePath = req.file.path;
                    const content = fs.readFileSync(filePath, "utf8");

                    // 对内容进行SHA256哈希处理
                    const contentHash = crypto
                        .createHash("sha256")
                        .update(content)
                        .digest("hex");

                    // 清理临时文件
                    fs.unlinkSync(filePath);

                    // 不再要求空闲群组，而是从所有群组中随机选择一个
                    const groups = await db.Group.findAll();

                    if (!groups || groups.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: "系统中没有可用的节点组",
                        });
                    }

                    // 随机选择一个群组
                    const randomIndex = Math.floor(
                        Math.random() * groups.length
                    );
                    const selectedGroup = groups[randomIndex];

                    // 生成X和Y
                    const keywordX = crypto.randomBytes(32).toString("hex");
                    const keywordY = crypto.randomBytes(16).toString("hex");

                    // 使用我们的函数生成陷门
                    const trapdoorValue = generateTrapdoor(keywordX, keywordY);

                    console.log(`生成加密关键字: X=${keywordX}, Y=${keywordY}`);

                    // 生成格式化的关键词ID
                    const keywordId = await generateFormattedId(
                        "keyWord",
                        db.Keyword
                    );

                    // 创建关键词记录
                    const keyword = await db.Keyword.create({
                        keywordId: keywordId,
                        keywordX,
                        keywordY,
                        trapdoorValue,
                        groupId: selectedGroup.id,
                    });

                    // 生成格式化的文档ID
                    const documentId = await generateFormattedId(
                        "document",
                        db.Document
                    );

                    // 创建文档记录
                    const document = await db.Document.create({
                        documentId: documentId,
                        title,
                        content: contentHash,
                        keywordId: keyword.id,
                        userId: req.userId,
                    });

                    // 创建DocumentKeyword记录
                    await db.DocumentKeyword.create({
                        documentId: document.id,
                        keywordId: keyword.id,
                        keywordMatched: null, // 设置为null，等待验证
                        status: "pending",
                        assignedGroupId: null,
                    });

                    return res.status(200).json({
                        success: true,
                        message: "文档上传成功",
                        data: {
                            id: document.id,
                            title: document.title,
                        },
                    });
                } catch (innerError) {
                    console.error("文档处理过程中出错:", innerError);
                    return res.status(500).json({
                        success: false,
                        message:
                            "文档处理失败: " +
                            (innerError.message || "未知错误"),
                    });
                }
            });
        } catch (error) {
            console.error("文档上传处理失败:", error);
            return res.status(500).json({
                success: false,
                message: "文档上传失败: " + (error.message || "未知错误"),
            });
        }
    });

    // 获取用户文档
    router.get("/user", authMiddleware.verifyToken, async (req, res) => {
        try {
            const userId = req.userId;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "用户ID不存在，请确保您已登录",
                });
            }

            // 获取用户的所有文档和相关信息
            const documents = await db.Document.findAll({
                where: { userId: userId },
                include: [
                    {
                        model: db.DocumentKeyword,
                        attributes: [
                            "keywordMatched",
                            "status",
                            "assignedGroupId",
                            "createdAt",
                            "updatedAt",
                        ],
                    },
                    {
                        model: db.Keyword,
                        attributes: ["keywordId"],
                    },
                ],
                order: [["createdAt", "DESC"]],
            });

            // 格式化返回数据
            const formattedDocuments = documents.map((doc) => {
                const docJson = doc.toJSON();
                return {
                    id: docJson.id,
                    documentId: docJson.documentId,
                    title: docJson.title,
                    createdAt: docJson.createdAt,
                    keywords: docJson.Keyword
                        ? docJson.Keyword.keywordId
                        : null,
                    executionStatus: docJson.DocumentKeyword
                        ? docJson.DocumentKeyword.status
                        : "pending",
                    keywordMatched: docJson.DocumentKeyword
                        ? docJson.DocumentKeyword.keywordMatched
                        : false,
                    assignedGroupId: docJson.DocumentKeyword
                        ? docJson.DocumentKeyword.assignedGroupId
                        : null,
                };
            });

            return res.json({
                success: true,
                data: formattedDocuments,
            });
        } catch (error) {
            console.error("获取用户文档失败:", error);
            return res.status(500).json({
                success: false,
                message: "获取用户文档失败: " + error.message,
            });
        }
    });

    // 注册路由
    app.use("/api/documents", router);

    // 返回路由
    return router;
};
