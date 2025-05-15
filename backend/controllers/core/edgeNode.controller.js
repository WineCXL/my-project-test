/**
 * 边缘节点注册(EdgeNodeReg)控制器
 * 实现方案中的EdgeNodeReg算法
 *
 * 该模块负责边缘节点的注册、管理和身份验证流程
 * 主要功能包括：
 * 1. 节点注册：生成节点私钥s和随机数xi
 * 2. 节点信息管理：节点列表查询、单个节点查询、更新节点信息
 * 3. 节点状态监控：追踪节点活跃状态
 */

const CryptoEngine = require("../../lib/crypto");
const db = require("../../models");
const Node = db.Node;

/**
 * 注册新的边缘节点
 * 实现论文中的EdgeNodeReg算法，生成节点密钥和随机数
 *
 * 算法流程：
 * 1. 接收节点ID和其他必要信息
 * 2. 调用加密引擎生成节点密钥和随机数xi
 * 3. 将节点信息和随机数存储到数据库
 * 4. 返回注册成功的节点信息（不包含敏感的随机数和私钥）
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.body.nodeId - 节点唯一标识符
 *   @param {string} req.body.nodeName - 节点名称
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含新注册节点信息的JSON响应
 */
exports.registerNode = async (req, res) => {
    try {
        const { nodeId, nodeName } = req.body;

        // 验证必要参数
        if (!nodeId || !nodeName) {
            return res.status(400).json({
                success: false,
                message: "节点ID和节点名称是必须的",
            });
        }

        // 检查节点ID是否已存在
        const existingNode = await Node.findOne({ where: { nodeId: nodeId } });
        if (existingNode) {
            return res.status(409).json({
                success: false,
                message: "此节点ID已注册",
            });
        }

        // 调用加密引擎的nodeRegistration函数生成节点密钥和随机数
        const nodeResult = CryptoEngine.nodeRegistration(nodeId);

        // 从结果中获取随机数xi和私钥s
        const randomNumber = nodeResult.randomNumber;
        const privateKey = nodeResult.privateKey;

        // 创建新的边缘节点记录
        const newNode = await Node.create({
            nodeId: nodeId,
            nodeName: nodeName,
            privateKey: privateKey, // 存储节点私钥s
            randomNumber: randomNumber, // 存储随机数xi用于零知识证明
            status: "idle",
            createdAt: new Date(),
        });

        // 返回成功响应（不包含随机数xi和私钥s）
        return res.status(201).json({
            success: true,
            message: "边缘节点注册成功",
            data: {
                id: newNode.id,
                nodeId: newNode.nodeId,
                nodeName: newNode.nodeName,
                status: newNode.status,
            },
        });
    } catch (error) {
        console.error("边缘节点注册失败:", error);
        return res.status(500).json({
            success: false,
            message: "边缘节点注册失败",
            error: error.message,
        });
    }
};

/**
 * 获取所有边缘节点列表
 * 返回系统中所有注册的边缘节点信息（不包含敏感的随机数和私钥）
 *
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含节点列表的JSON响应
 */
exports.getAllNodes = async (req, res) => {
    try {
        // 查询所有边缘节点，但不返回随机数和私钥字段
        const nodes = await Node.findAll({
            attributes: { exclude: ["randomNumber", "privateKey"] },
        });

        return res.status(200).json({
            success: true,
            count: nodes.length,
            data: nodes,
        });
    } catch (error) {
        console.error("获取边缘节点列表失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取边缘节点列表失败",
            error: error.message,
        });
    }
};

/**
 * 获取特定节点的信息
 * 根据节点ID查询节点详细信息（不包含敏感的随机数和私钥）
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.params.id - 要查询的节点ID
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含节点详情的JSON响应
 */
exports.getNodeById = async (req, res) => {
    try {
        const nodeId = req.params.id;

        // 查询指定节点，但不返回随机数和私钥字段
        const node = await Node.findOne({
            where: { nodeId },
            attributes: { exclude: ["randomNumber", "privateKey"] },
        });

        if (!node) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的边缘节点",
            });
        }

        return res.status(200).json({
            success: true,
            data: node,
        });
    } catch (error) {
        console.error("获取边缘节点信息失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取边缘节点信息失败",
            error: error.message,
        });
    }
};

/**
 * 更新边缘节点信息
 * 根据节点ID更新节点的基本信息和状态
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.params.id - 要更新的节点ID
 *   @param {string} [req.body.nodeName] - 更新的节点名称
 *   @param {string} [req.body.status] - 更新的节点状态
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含更新后节点信息的JSON响应
 */
exports.updateNode = async (req, res) => {
    try {
        const nodeId = req.params.id;
        const { nodeName, status } = req.body;

        // 查找并更新节点
        const node = await Node.findOne({ where: { nodeId } });

        if (!node) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的边缘节点",
            });
        }

        // 更新字段
        if (nodeName) node.nodeName = nodeName;
        if (status) node.status = status;

        await node.save();

        return res.status(200).json({
            success: true,
            message: "边缘节点信息更新成功",
            data: {
                id: node.id,
                nodeId: node.nodeId,
                nodeName: node.nodeName,
                status: node.status,
            },
        });
    } catch (error) {
        console.error("更新边缘节点信息失败:", error);
        return res.status(500).json({
            success: false,
            message: "更新边缘节点信息失败",
            error: error.message,
        });
    }
};
