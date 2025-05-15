const express = require("express");
const bodyParser = require("body-parser");
const cryptoEngine = require("./lib/crypto");

const app = express();
const port = process.env.PORT || 3000;

// 初始化加密系统
const initialized = cryptoEngine.systemSetup(128);
if (!initialized) {
    console.error("加密系统初始化失败");
    process.exit(1);
}

// 存储注册的节点和群组信息
const registeredNodes = {};
const groups = {};

// 中间件
app.use(bodyParser.json());

// 允许CORS (开发环境)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

// 路由：服务健康检查
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "加密服务运行中" });
});

// 路由：注册节点
app.post("/api/nodes", (req, res) => {
    try {
        const { nodeId } = req.body;

        if (!nodeId) {
            return res.status(400).json({ error: "请提供有效的节点ID" });
        }

        if (registeredNodes[nodeId]) {
            return res.status(409).json({ error: "节点ID已存在" });
        }

        const nodeInfo = cryptoEngine.nodeRegistration(nodeId);
        registeredNodes[nodeId] = nodeInfo;

        res.status(201).json({
            message: "节点注册成功",
            nodeId,
            nodeInfo,
        });
    } catch (error) {
        console.error("节点注册错误:", error);
        res.status(500).json({ error: "节点注册失败", details: error.message });
    }
});

// 路由：获取所有注册节点
app.get("/api/nodes", (req, res) => {
    res.json({ nodes: registeredNodes });
});

// 路由：创建群组
app.post("/api/groups", (req, res) => {
    try {
        const { nodeIds, groupName } = req.body;

        if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
            return res.status(400).json({ error: "请提供有效的节点ID数组" });
        }

        if (!groupName) {
            return res.status(400).json({ error: "请提供有效的群组名称" });
        }

        if (groups[groupName]) {
            return res.status(409).json({ error: "群组名称已存在" });
        }

        // 验证所有节点是否已注册
        const invalidNodes = nodeIds.filter((id) => !registeredNodes[id]);
        if (invalidNodes.length > 0) {
            return res.status(400).json({
                error: "包含未注册的节点ID",
                invalidNodes,
            });
        }

        const groupKey = cryptoEngine.groupGeneration(nodeIds);
        groups[groupName] = {
            key: groupKey,
            members: nodeIds,
            createdAt: new Date(),
        };

        res.status(201).json({
            message: "群组创建成功",
            groupName,
            members: nodeIds,
        });
    } catch (error) {
        console.error("群组创建错误:", error);
        res.status(500).json({ error: "群组创建失败", details: error.message });
    }
});

// 路由：获取所有群组
app.get("/api/groups", (req, res) => {
    // 返回群组信息，但不包含密钥
    const safeGroups = Object.entries(groups).reduce((acc, [name, group]) => {
        acc[name] = {
            members: group.members,
            createdAt: group.createdAt,
        };
        return acc;
    }, {});

    res.json({ groups: safeGroups });
});

// 路由：加密数据
app.post("/api/encrypt", (req, res) => {
    try {
        const { plaintext, groupName } = req.body;

        if (!plaintext) {
            return res.status(400).json({ error: "请提供要加密的数据" });
        }

        if (!groupName || !groups[groupName]) {
            return res.status(400).json({ error: "请提供有效的群组名称" });
        }

        // 使用封装关键词的方法代替直接加密
        const ciphertext = cryptoEngine.encapsulateKeyword(
            plaintext,
            groupName
        );

        res.json({
            message: "加密成功",
            ciphertext,
        });
    } catch (error) {
        console.error("加密错误:", error);
        res.status(500).json({ error: "加密失败", details: error.message });
    }
});

// 路由：解密数据
app.post("/api/decrypt", (req, res) => {
    try {
        const { ciphertext, groupName } = req.body;

        if (!ciphertext) {
            return res.status(400).json({ error: "请提供要解密的数据" });
        }

        if (!groupName || !groups[groupName]) {
            return res.status(400).json({ error: "请提供有效的群组名称" });
        }

        const plaintext = cryptoEngine.decrypt(ciphertext, groupName);

        res.json({
            message: "解密成功",
            plaintext,
        });
    } catch (error) {
        console.error("解密错误:", error);
        res.status(500).json({ error: "解密失败", details: error.message });
    }
});

// 路由：生成搜索令牌
app.post("/api/search-token", (req, res) => {
    try {
        const { keyword, groupName } = req.body;

        if (!keyword) {
            return res.status(400).json({ error: "请提供搜索关键词" });
        }

        if (!groupName || !groups[groupName]) {
            return res.status(400).json({ error: "请提供有效的群组名称" });
        }

        const searchToken = cryptoEngine.searchTokenGeneration(
            keyword,
            groupName
        );

        res.json({
            message: "搜索令牌生成成功",
            searchToken,
        });
    } catch (error) {
        console.error("搜索令牌生成错误:", error);
        res.status(500).json({
            error: "搜索令牌生成失败",
            details: error.message,
        });
    }
});

// 路由：执行搜索
app.post("/api/search", (req, res) => {
    try {
        const { searchToken, encryptedData } = req.body;

        if (!searchToken) {
            return res.status(400).json({ error: "请提供搜索令牌" });
        }

        if (
            !encryptedData ||
            !Array.isArray(encryptedData) ||
            encryptedData.length === 0
        ) {
            return res.status(400).json({ error: "请提供加密数据数组" });
        }

        const results = cryptoEngine.search(searchToken, encryptedData);

        res.json({
            message: "搜索完成",
            matchCount: results.length,
            results,
        });
    } catch (error) {
        console.error("搜索错误:", error);
        res.status(500).json({ error: "搜索失败", details: error.message });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`加密服务已启动，监听端口: ${port}`);
    console.log(`健康检查地址: http://localhost:${port}/api/health`);
});

// 添加未捕获异常处理器
process.on("uncaughtException", (err) => {
    console.error("未捕获的异常，但服务器不会崩溃:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("未处理的Promise拒绝，但服务器不会崩溃:", reason);
});

// 如果要干净地关闭服务器，可以在接收到终止信号时关闭
process.on("SIGTERM", () => {
    console.info("SIGTERM信号收到，关闭服务器");
    server.close(() => {
        console.log("服务器已关闭");
        process.exit(0);
    });
});
