/**
 * 系统状态统计控制器
 */

const db = require("../models");
const Node = db.Node;
const Group = db.Group;
const Document = db.Document;
const Sequelize = db.Sequelize;

/**
 * 获取节点状态统计
 */
exports.getNodeStats = async (req, res) => {
    try {
        // 获取所有节点
        const nodes = await Node.findAll();

        // 计算各状态节点数量
        const stats = {
            count: nodes.length,
            idle: nodes.filter((node) => node.status === "idle").length,
            busy: nodes.filter((node) => node.status === "busy").length,
            error: nodes.filter((node) => node.status === "error").length,
        };

        return res.status(200).json({
            success: true,
            ...stats,
        });
    } catch (error) {
        console.error("获取节点统计失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取节点统计失败",
            error: error.message,
        });
    }
};

/**
 * 获取群组状态统计
 */
exports.getGroupStats = async (req, res) => {
    try {
        // 获取所有群组
        const groups = await Group.findAll();

        // 计算各状态群组数量
        const stats = {
            count: groups.length,
            idle: groups.filter((group) => group.status === "idle").length,
            busy: groups.filter((group) => group.status === "busy").length,
        };

        return res.status(200).json({
            success: true,
            ...stats,
        });
    } catch (error) {
        console.error("获取群组统计失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取群组统计失败",
            error: error.message,
        });
    }
};

/**
 * 获取资源状态统计
 */
exports.getResourceStats = async (req, res) => {
    try {
        // 使用DocumentKeyword表获取各状态资源数量
        const pendingCount = await db.DocumentKeyword.count({
            where: { status: "pending" }
        });

        const executingCount = await db.DocumentKeyword.count({
            where: { status: "executing" }
        });

        const completedCount = await db.DocumentKeyword.count({
            where: { status: "completed" }
        });

        const stats = {
            count: pendingCount + executingCount + completedCount,
            pending: pendingCount,
            executing: executingCount,
            completed: completedCount,
        };

        return res.status(200).json({
            success: true,
            ...stats,
        });
    } catch (error) {
        console.error("获取资源统计失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取资源统计失败",
            error: error.message,
        });
    }
};