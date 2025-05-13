/**
 * 文档与节点组匹配控制器
 * 将文档分配给空闲的节点组执行
 */

const db = require("../models");
const Document = db.Document;
const Group = db.Group;
const NodeGroup = db.NodeGroup;

/**
 * 获取所有待处理的文档
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.findPendingDocuments = async (req, res) => {
    try {
        // 查询所有待处理的文档
        const pendingDocs = await Document.findAll({
            where: {
                executionStatus: "pending",
                assignedGroupId: null,
            },
        });

        return res.status(200).json({
            success: true,
            count: pendingDocs.length,
            data: pendingDocs,
        });
    } catch (error) {
        console.error("获取待处理文档失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取待处理文档失败",
            error: error.message,
        });
    }
};

/**
 * 获取所有正在执行的文档
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.findExecutingDocuments = async (req, res) => {
    try {
        // 查询所有执行中的文档
        const executingDocs = await Document.findAll({
            where: {
                executionStatus: "executing",
            },
            include: [
                {
                    model: Group,
                    attributes: ["id", "groupId", "groupName", "status"],
                },
            ],
        });

        return res.status(200).json({
            success: true,
            count: executingDocs.length,
            data: executingDocs,
        });
    } catch (error) {
        console.error("获取执行中文档失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取执行中文档失败",
            error: error.message,
        });
    }
};

/**
 * 将文档分配给节点组
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.allocateDocumentToGroup = async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const groupId = req.params.groupId;

        // 查找文档
        const document = await Document.findByPk(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: `未找到ID为${documentId}的文档。`,
            });
        }

        // 检查文档是否已分配
        if (document.assignedGroupId) {
            return res.status(400).json({
                success: false,
                message: `文档#${documentId}已分配给群组#${document.assignedGroupId}。`,
            });
        }

        // 查找群组
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: `未找到ID为${groupId}的群组。`,
            });
        }

        // 检查群组是否有足够的节点（需要4个节点）
        const nodeGroups = await NodeGroup.findAll({
            where: { groupId: group.id },
        });

        if (nodeGroups.length !== 4) {
            return res.status(400).json({
                success: false,
                message: `群组#${groupId}没有正确的节点数量（需要4个节点）。`,
            });
        }

        // 检查群组状态是否为空闲
        if (group.status !== "idle") {
            return res.status(400).json({
                success: false,
                message: `群组#${groupId}状态不是空闲，无法分配任务。`,
            });
        }

        // 将文档与群组匹配并更新状态
        // 更新文档状态
        await document.update({
            executionStatus: "executing",
            assignedGroupId: group.id,
        });

        // 更新群组状态为忙碌
        await group.update({ status: "busy" });

        // 返回成功响应
        return res.status(200).json({
            success: true,
            message: `成功将文档分配给群组#${groupId}。`,
            data: {
                documentId: document.id,
                documentTitle: document.title,
                groupId: group.id,
                groupName: group.groupName,
            },
        });
    } catch (error) {
        console.error("分配文档到群组失败:", error);
        return res.status(500).json({
            success: false,
            message: "分配文档到群组失败",
            error: error.message,
        });
    }
};

/**
 * 手动完成文档处理
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.completeDocument = async (req, res) => {
    try {
        const documentId = req.params.documentId;

        // 查找文档
        const document = await Document.findByPk(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: `未找到ID为${documentId}的文档。`,
            });
        }

        // 检查文档是否正在执行
        if (document.executionStatus !== "executing") {
            return res.status(400).json({
                success: false,
                message: `文档#${documentId}不在执行状态，无法完成。`,
            });
        }

        // 找到分配的群组
        const groupId = document.assignedGroupId;
        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: `文档#${documentId}未分配给任何群组。`,
            });
        }

        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: `未找到文档分配的群组#${groupId}。`,
            });
        }

        // 更新文档状态为已完成
        await document.update({
            executionStatus: "completed",
        });

        // 释放群组资源
        await group.update({
            status: "idle",
        });

        return res.status(200).json({
            success: true,
            message: `文档#${documentId}已完成处理，群组#${groupId}已释放。`,
            data: {
                documentId: document.id,
                documentTitle: document.title,
                executionStatus: document.executionStatus,
                groupId: group.id,
                groupName: group.groupName,
                groupStatus: group.status,
            },
        });
    } catch (error) {
        console.error("完成文档处理失败:", error);
        return res.status(500).json({
            success: false,
            message: "完成文档处理失败",
            error: error.message,
        });
    }
};

/**
 * 自动匹配文档和空闲群组
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.autoAllocate = async (req, res) => {
    try {
        // 获取所有待处理的文档
        const pendingDocs = await Document.findAll({
            where: {
                executionStatus: "pending",
                assignedGroupId: null,
            },
            limit: 10, // 限制每次处理的数量
        });

        if (pendingDocs.length === 0) {
            return res.status(200).json({
                success: true,
                message: "没有待处理的文档。",
            });
        }

        // 获取所有空闲的群组
        const idleGroups = await Group.findAll({
            where: {
                status: "idle",
            },
        });

        if (idleGroups.length === 0) {
            return res.status(200).json({
                success: true,
                message: "没有空闲的群组可用于分配。",
            });
        }

        // 验证群组是否有足够的节点（需要4个节点）
        const validGroups = [];
        for (const group of idleGroups) {
            const nodeGroups = await NodeGroup.findAll({
                where: { groupId: group.id },
            });

            if (nodeGroups.length === 4) {
                validGroups.push(group);
            }
        }

        if (validGroups.length === 0) {
            return res.status(200).json({
                success: true,
                message: "没有有效的群组（需要4个节点）可用于分配。",
            });
        }

        // 分配文档到群组
        const allocations = [];
        let groupIndex = 0;

        for (const doc of pendingDocs) {
            if (groupIndex >= validGroups.length) {
                break; // 没有更多可用的群组
            }

            const group = validGroups[groupIndex];

            // 更新文档状态
            await doc.update({
                executionStatus: "executing",
                assignedGroupId: group.id,
            });

            // 更新群组状态
            await group.update({
                status: "busy",
            });

            allocations.push({
                documentId: doc.id,
                documentTitle: doc.title,
                groupId: group.id,
                groupName: group.groupName,
            });

            groupIndex++;
        }

        return res.status(200).json({
            success: true,
            message: `成功分配了 ${allocations.length} 个文档。`,
            data: allocations,
        });
    } catch (error) {
        console.error("自动分配文档失败:", error);
        return res.status(500).json({
            success: false,
            message: "自动分配文档失败",
            error: error.message,
        });
    }
};
