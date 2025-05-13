/**
 * 边缘节点控制器
 * 负责节点管理等功能
 * 内部实现调用core/edgeNode.controller.js
 */

// 导入核心算法控制器
const edgeNodeController = require("./core/edgeNode.controller");
const { Node, Group } = require("../models");

// 注册节点
exports.registerNode = edgeNodeController.registerNode;

// 获取所有节点
exports.findAll = async (req, res) => {
    try {
        const nodes = await Node.findAll({
            include: [
                {
                    model: Group,
                    as: "group",
                    attributes: ["id", "groupId", "groupName"],
                },
            ],
            order: [["id", "ASC"]],
        });

        // 确保返回数据包含群组信息
        const formattedNodes = nodes.map((node) => {
            const nodeData = node.toJSON();
            return {
                ...nodeData,
                groupInfo: node.group
                    ? {
                        id: node.group.id,
                        groupId: node.group.groupId,
                        groupName: node.group.groupName,
                    }
                    : null,
            };
        });

        res.status(200).json({
            success: true,
            count: nodes.length,
            data: formattedNodes,
        });
    } catch (error) {
        console.error("获取节点列表失败:", error);
        res.status(500).json({
            success: false,
            message: "获取节点列表失败",
            error: error.message,
        });
    }
};

// 获取单个节点
exports.findOne = async (req, res) => {
    try {
        const nodeId = req.params.id;

        const node = await Node.findOne({
            where: { id },
            include: [
                {
                    model: Group,
                    as: "group",
                    attributes: ["id", "groupId", "groupName"],
                },
            ],
        });

        if (!node) {
            return res.status(404).json({
                success: false,
                message: `未找到ID为${nodeId}的节点`,
            });
        }

        res.status(200).json({
            success: true,
            data: node,
        });
    } catch (error) {
        console.error("获取节点详情失败:", error);
        res.status(500).json({
            success: false,
            message: "获取节点详情失败",
            error: error.message,
        });
    }
};

// 按节点ID查找
exports.findByNodeId = (req, res) => {
    // 将req.params.nodeId设置为req.params.id以便调用edgeNodeController.getNodeById
    req.params.id = req.params.nodeId;
    return edgeNodeController.getNodeById(req, res);
};

// 更新节点
exports.update = (req, res) => {
    // 将req.params.id设置为适合edgeNodeController.updateNode的格式
    req.params.id = req.params.id;
    return edgeNodeController.updateNode(req, res);
};

// 删除节点
exports.delete = async (req, res) => {
    try {
        const nodeId = req.params.id;

        // 查找节点
        const node = await Node.findByPk(nodeId);
        if (!node) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的节点",
            });
        }

        // 检查节点状态，如果是busy状态，则不允许删除
        if (node.status === "busy") {
            return res.status(400).json({
                success: false,
                message: "无法删除忙碌状态的节点",
            });
        }

        // 检查节点是否属于某个群组
        if (node.groupId) {
            return res.status(400).json({
                success: false,
                message: "节点已分配给群组，请先从群组中移除节点",
            });
        }

        // 删除节点
        await node.destroy();

        return res.status(200).json({
            success: true,
            message: "节点删除成功",
            data: {
                nodeId: node.nodeId,
                nodeName: node.nodeName
            }
        });
    } catch (error) {
        console.error("删除节点失败:", error);
        return res.status(500).json({
            success: false,
            message: "删除节点失败",
            error: error.message
        });
    }
};
