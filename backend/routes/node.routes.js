/**
 * 边缘节点路由模块
 *
 * 负责处理边缘节点的注册、查询和管理等功能
 * 实现基于《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》论文
 * 边缘节点是系统的基础计算单元，可以组织成群组执行加密计算任务
 */
const express = require("express");
const router = express.Router();
const db = require("../models");
const Node = db.Node;
const Group = db.Group;
const sequelize = db.sequelize;
const nodeController = require("../controllers/node.controller");
const NodeGroup = db.NodeGroup;

/**
 * 获取所有节点列表
 * GET /api/nodes
 *
 * 返回系统中所有注册的边缘节点
 */
router.get("/", nodeController.findAll);

/**
 * 获取单个节点详情
 * GET /api/nodes/:id
 *
 * 返回特定节点的详细信息
 * @param {string} id - 节点ID
 */
router.get("/:id", async (req, res) => {
    try {
        // 排除私钥和随机数字段
        const node = await Node.findByPk(req.params.id, {
            attributes: { exclude: ["privateKey", "randomNumber"] },
        });

        if (!node) {
            return res.status(404).json({
                success: false,
                message: "节点不存在",
            });
        }
        res.json({ success: true, data: node });
    } catch (error) {
        console.error("获取节点详情失败:", error);
        res.status(500).json({
            success: false,
            message: "获取节点详情失败",
        });
    }
});

/**
 * 创建新节点
 * POST /api/nodes
 *
 * 创建新的边缘节点记录
 * @body {string} nodeId - 节点唯一标识符
 * @body {string} nodeName - 节点名称
 * @body {string} [privateKey] - 节点私钥（可选）
 * @body {string} [randomNumber] - 节点随机数（可选）
 */
router.post("/", async (req, res) => {
    try {
        const { nodeId, nodeName, privateKey, randomNumber } = req.body;

        // 检查节点ID是否已存在
        const existingNode = await Node.findOne({ where: { nodeId } });
        if (existingNode) {
            return res.status(400).json({
                success: false,
                message: "节点ID已存在",
            });
        }

        // 创建新节点
        const newNode = await Node.create({
            nodeId,
            nodeName,
            privateKey,
            randomNumber,
            status: "idle",
        });

        // 返回节点信息，排除敏感字段
        const nodeResponse = {
            id: newNode.id,
            nodeId: newNode.nodeId,
            nodeName: newNode.nodeName,
            status: newNode.status,
            createdAt: newNode.createdAt,
            updatedAt: newNode.updatedAt,
        };

        res.status(201).json({
            success: true,
            message: "节点创建成功",
            data: nodeResponse,
        });
    } catch (error) {
        console.error("创建节点失败:", error);
        res.status(500).json({
            success: false,
            message: "创建节点失败",
        });
    }
});

/**
 * 注册节点
 * POST /api/nodes/register
 *
 * 注册新节点或更新已存在节点的信息
 * 实现论文中的EdgeNodeReg算法，生成节点密钥和随机数
 * @body {string} nodeId - 节点唯一标识符
 * @body {string} nodeName - 节点名称
 */
router.post("/register", nodeController.registerNode);

/**
 * 更新节点信息
 * PUT /api/nodes/:id
 *
 * 更新特定节点的信息
 * @param {string} id - 要更新的节点ID
 * @body {string} [nodeName] - 新的节点名称
 * @body {string} [privateKey] - 新的私钥
 * @body {string} [randomNumber] - 新的随机数
 * @body {string} [status] - 新的状态
 */
router.put("/:id", async (req, res) => {
    try {
        const node = await Node.findByPk(req.params.id);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: "节点不存在",
            });
        }

        // 更新节点信息
        await node.update(req.body);

        // 返回节点信息，排除敏感字段
        const nodeResponse = {
            id: node.id,
            nodeId: node.nodeId,
            nodeName: node.nodeName,
            status: node.status,
            createdAt: node.createdAt,
            updatedAt: node.updatedAt,
        };

        res.json({
            success: true,
            message: "节点更新成功",
            data: nodeResponse,
        });
    } catch (error) {
        console.error("更新节点失败:", error);
        res.status(500).json({
            success: false,
            message: "更新节点失败",
        });
    }
});

/**
 * 删除节点
 * DELETE /api/nodes/:id
 *
 * 从系统中删除特定节点
 * @param {string} id - 要删除的节点ID
 */
router.delete("/:id", nodeController.delete);

/**
 * 获取指定群组的所有节点
 * GET /api/nodes/bygroup/:groupId
 *
 * 返回特定群组的所有节点
 * @param {string} groupId - 群组ID
 */
router.get("/bygroup/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // 检查群组是否存在
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "群组不存在",
            });
        }

        // 1. 查询所有属于该群组的NodeGroup记录
        const nodeGroups = await NodeGroup.findAll({
            where: { groupId },
            order: [["nodeIndex", "ASC"]],
            raw: true,
        });

        // 2. 获取所有相关的节点ID
        const nodeIds = nodeGroups.map((ng) => ng.nodeId);

        // 3. 查询所有相关的节点信息
        const nodes = await Node.findAll({
            where: { id: nodeIds },
            attributes: ["id", "nodeName", "status"],
            raw: true,
        });

        // 4. 创建节点ID到节点信息的映射
        const nodeMap = nodes.reduce((map, node) => {
            map[node.id] = node;
            return map;
        }, {});

        // 5. 将节点信息关联到节点群组记录中
        const members = nodeGroups.map((ng) => ({
            id: ng.id,
            node_id: ng.nodeId,
            node_name: nodeMap[ng.nodeId] ? nodeMap[ng.nodeId].nodeName : null,
            node_status: nodeMap[ng.nodeId] ? nodeMap[ng.nodeId].status : null,
            role: "member",
            group_id: ng.groupId,
            nodeIndex: ng.nodeIndex,
            joinedAt: ng.createdAt,
        }));

        return res.status(200).json({
            success: true,
            data: members || [],
        });
    } catch (error) {
        console.error("获取群组节点失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取群组节点失败",
            error: error.message,
        });
    }
});

/**
 * 添加节点到群组
 * POST /api/nodes/bygroup/:groupId
 *
 * 将指定节点添加到特定群组
 * @param {string} groupId - 群组ID
 * @body {string} nodeId - 要添加的节点ID
 */
router.post("/bygroup/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { nodeId } = req.body;

        if (!nodeId) {
            return res.status(400).json({
                success: false,
                message: "节点ID是必须的",
            });
        }

        // 检查群组是否存在
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "群组不存在",
            });
        }

        // 检查节点是否存在
        const node = await Node.findByPk(nodeId);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: "节点不存在",
            });
        }

        // 检查节点是否已在群组中
        const existingMember = await db.NodeGroup.findOne({
            where: {
                groupId: groupId,
                nodeId: nodeId,
            },
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: "节点已经是群组成员",
            });
        }

        // 获取当前群组成员计数
        const memberCount = await db.NodeGroup.count({
            where: { groupId: groupId },
        });

        if (memberCount >= 4) {
            return res.status(400).json({
                success: false,
                message: "群组成员已达到上限(4个)",
            });
        }

        // 添加节点到群组
        const newNodeGroup = await db.NodeGroup.create({
            groupId: groupId,
            nodeId: nodeId,
            nodeIndex: memberCount + 1,
        });

        // 更新节点状态
        await node.update({
            status: "busy",
            groupId: groupId,
        });

        res.status(201).json({
            success: true,
            message: "节点成功添加到群组",
            data: {
                id: newNodeGroup.id,
                nodeId: nodeId,
                groupId: groupId,
                nodeIndex: newNodeGroup.nodeIndex,
            },
        });
    } catch (error) {
        console.error("添加节点到群组失败:", error);
        res.status(500).json({
            success: false,
            message: "添加节点到群组失败",
            error: error.message,
        });
    }
});

/**
 * 从群组移除节点
 * DELETE /api/nodes/bygroup/:groupId/byid/:nodeId
 *
 * 从特定群组中移除指定节点
 * @param {string} groupId - 群组ID
 * @param {string} nodeId - 要移除的节点ID
 */
router.delete("/bygroup/:groupId/byid/:nodeId", async (req, res) => {
    try {
        const { groupId, nodeId } = req.params;

        // 检查群组是否存在
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "群组不存在",
            });
        }

        // 检查节点是否存在
        const node = await Node.findByPk(nodeId);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: "节点不存在",
            });
        }

        // 检查节点是否在群组中
        const nodeGroup = await db.NodeGroup.findOne({
            where: {
                groupId: groupId,
                nodeId: nodeId,
            },
        });

        if (!nodeGroup) {
            return res.status(404).json({
                success: false,
                message: "节点不是群组成员",
            });
        }

        // 移除节点
        await nodeGroup.destroy();

        // 更新节点状态 - 如果是error状态则保持
        if (node.status !== "error") {
            await node.update({
                status: "idle",
                groupId: null,
            });
        } else {
            // 仅移除groupId，保持error状态
            await node.update({
                groupId: null,
            });
        }

        res.status(200).json({
            success: true,
            message: "节点已从群组移除",
        });
    } catch (error) {
        console.error("从群组移除节点失败:", error);
        res.status(500).json({
            success: false,
            message: "从群组移除节点失败",
            error: error.message,
        });
    }
});

module.exports = router;
