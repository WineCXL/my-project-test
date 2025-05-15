const express = require("express");
const router = express.Router();
const db = require("../models");
const Group = db.Group;
const Node = db.Node;
const NodeGroup = db.NodeGroup;
const { Op } = require("sequelize");
const crypto = require('crypto'); // 添加crypto模块
const groupController = require("../controllers/core/group.controller");

// 获取所有群组
router.get("/", async (req, res) => {
    try {
        const groups = await Group.findAll({
            attributes: { exclude: ["publicKeysR", "publicKeysPhi"] }, 
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            count: groups.length,
            data: groups,
        });
    } catch (error) {
        console.error("获取群组列表失败:", error);
        // 即使出错也返回一个空数组
        return res.status(200).json({
            success: true,
            count: 0,
            data: [],
        });
    }
});

// 获取单个群组
router.get("/:id", async (req, res) => {
    try {
        const group = await Group.findByPk(req.params.id, {
            attributes: { exclude: ["publicKeysR", "publicKeysPhi"] }, // 修改：排除公钥而不是secretKey
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "群组不存在",
            });
        }

        return res.status(200).json({
            success: true,
            data: group,
        });
    } catch (error) {
        console.error("获取群组详情失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取群组详情失败",
            error: error.message,
        });
    }
});

// 创建群组 - 仍然使用groupController.createGroup处理逻辑核心
// 但在路由层添加中间件预处理，生成随机公钥
router.post("/", async (req, res, next) => {
    try {
        // 生成随机公钥，将在groupController.createGroup中使用
        // 这些随机值在理论上是通过特定算法计算得到的，但我们简化为随机生成
        req.publicKeys = {
            R: crypto.randomBytes(32).toString('hex'), // 64位十六进制
            Phi: crypto.randomBytes(16).toString('hex'), // 32位十六进制
        };
        //console.log(`加密引擎生成群组公钥: R=${req.publicKeys.R}, Phi=${req.publicKeys.Phi}`);

        // 继续处理请求
        next();
    } catch (error) {
        //console.error("加密引擎生成群组公钥失败:", error);
        return res.status(500).json({
            success: false,
            message: "加密引擎生成群组公钥失败",
            error: error.message,
        });
    }
}, groupController.createGroup);

// 更新群组
router.put("/:id", async (req, res) => {
    try {
        const { groupName, status, nodeIds } = req.body;
        const groupId = req.params.id;

        // 检查群组是否存在
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "群组不存在",
            });
        }

        // 如果需要重新生成公钥
        let publicKeysR = group.publicKeysR;
        let publicKeysPhi = group.publicKeysPhi;

        if (req.body.regenerateKeys) {
            publicKeysR = crypto.randomBytes(32).toString('hex'); // 64位十六进制
            publicKeysPhi = crypto.randomBytes(16).toString('hex'); // 32位十六进制
            console.log(`重新生成群组公钥: R=${publicKeysR}, Phi=${publicKeysPhi}`);
        }

        // 更新群组信息
        await group.update({
            groupName: groupName || group.groupName,
            publicKeysR: publicKeysR, // 使用R部分公钥
            publicKeysPhi: publicKeysPhi, // 使用Phi部分公钥
            status: status || group.status,
        });

        return res.status(200).json({
            success: true,
            message: "群组更新成功",
            data: {
                id: group.id,
                groupId: group.groupId,
                groupName: group.groupName,
                status: group.status,
            },
        });
    } catch (error) {
        console.error("更新群组失败:", error);
        return res.status(500).json({
            success: false,
            message: "更新群组失败",
            error: error.message,
        });
    }
});

// 删除群组
router.delete("/:id", async (req, res) => {
    try {
        const groupId = req.params.id;
        const group = await Group.findByPk(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "群组不存在",
            });
        }

        // 查找属于该群组的所有节点
        const nodesInGroup = await Node.findAll({
            where: { groupId: groupId }
        });

        // 更新节点状态，将节点从群组中解绑（而不是删除节点）
        if (nodesInGroup.length > 0) {
            for (const node of nodesInGroup) {
                await node.update({
                    status: 'idle',  // 将节点状态设置为空闲
                    groupId: null    // 清除群组关联
                });
            }
            console.log(`已自动解绑群组(ID:${groupId})中的${nodesInGroup.length}个节点`);
        }

        // 检查是否存在NodeGroup关联
        const nodeGroupCount = await NodeGroup.count({
            where: { groupId: groupId }
        });

        if (nodeGroupCount > 0) {
            // 删除NodeGroup关联数据
            await NodeGroup.destroy({
                where: { groupId: groupId }
            });
            console.log(`已清理群组(ID:${groupId})的${nodeGroupCount}条关联记录`);
        }

        // 删除群组
        await group.destroy();

        return res.status(200).json({
            success: true,
            message: `群组删除成功，已自动解绑${nodesInGroup.length || 0}个节点`,
        });
    } catch (error) {
        console.error("删除群组失败:", error);
        return res.status(500).json({
            success: false,
            message: "删除群组失败",
            error: error.message,
        });
    }
});

// 添加节点到群组
router.post("/:groupId/nodes/:nodeId", async (req, res) => {
    try {
        const { groupId, nodeId } = req.params;
        const { role = "member" } = req.body;

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
        const nodeGroup = await NodeGroup.findOne({
            where: {
                GroupId: groupId,
                NodeId: nodeId,
            },
        });

        if (nodeGroup) {
            // 更新角色
            await nodeGroup.update({ role });
            return res.json({
                success: true,
                message: "节点角色更新成功",
            });
        }

        // 添加节点到群组
        await group.addNode(node, { through: { role } });

        res.json({
            success: true,
            message: "节点添加到群组成功",
        });
    } catch (error) {
        console.error("添加节点到群组失败:", error);
        res.status(500).json({
            success: false,
            message: "添加节点到群组失败",
        });
    }
});

// 从群组移除节点
router.delete("/:groupId/nodes/:nodeId", async (req, res) => {
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

        // 移除节点
        await NodeGroup.destroy({
            where: {
                GroupId: groupId,
                NodeId: nodeId,
            },
        });

        res.json({
            success: true,
            message: "节点已从群组移除",
        });
    } catch (error) {
        console.error("从群组移除节点失败:", error);
        res.status(500).json({
            success: false,
            message: "从群组移除节点失败",
        });
    }
});

/**
 * 验证群组所有节点
 * POST /api/groups/:groupId/verify
 *
 * 验证群组中所有节点的随机数是否一致，检测是否有节点被攻击
 * @param {string} groupId - 群组ID
 */
router.post("/:groupId/verify", async (req, res) => {
    // 将请求转发给groupController.verifyGroup
    req.params.id = req.params.groupId;
    return groupController.verifyGroup(req, res);
});

module.exports = router;
