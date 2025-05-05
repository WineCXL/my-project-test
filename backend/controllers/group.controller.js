/**
 * 群组控制器
 * 负责群组管理等功能
 * 内部实现调用core/group.controller.js
 */

// 导入核心算法控制器
const groupCoreController = require('./core/group.controller');

// 创建新群组
exports.create = groupCoreController.createGroup;

// 获取所有群组
exports.findAll = groupCoreController.getAllGroups;

// 获取单个群组
exports.findOne = (req, res) => {
    // 将req.params.id转换为适合groupCoreController.getGroupById的格式
    req.params.id = req.params.id;
    return groupCoreController.getGroupById(req, res);
};

// 按群组ID查找
exports.findByGroupId = (req, res) => {
    // 将req.params.groupId设置为req.params.id以便调用groupCoreController.getGroupById
    req.params.id = req.params.groupId;
    return groupCoreController.getGroupById(req, res);
};

// 更新群组
exports.update = (req, res) => {
    // 提取节点IDs
    const nodeIds = req.body.nodeIds;

    // 如果包含节点ID，调用updateGroupMembers
    if (nodeIds && Array.isArray(nodeIds)) {
        req.params.id = req.params.id;
        req.body = { nodeIds }; // 只传递节点ID数组
        return groupCoreController.updateGroupMembers(req, res);
    } else {
        // 其他属性更新暂不支持
        return res.status(400).json({
            success: false,
            message: '只支持更新群组成员，其他属性更新不符合核心算法。'
        });
    }
};

// 添加节点到群组（通过调用更新群组成员）
exports.addNode = (req, res) => {
    const groupId = req.params.id;
    const nodeId = req.params.nodeId;

    // 首先获取当前群组
    req.params.id = groupId;

    // 使用中间件模式传递当前请求到下一个处理函数
    return groupCoreController.getGroupById(req, {
        status: (code) => ({
            json: (data) => {
                if (code === 200 && data.success) {
                    // 获取当前群组成员
                    const currentNodeIds = data.data.memberNodeIds || [];

                    // 检查节点是否已在群组中
                    if (currentNodeIds.includes(nodeId)) {
                        return res.status(400).json({
                            success: false,
                            message: '节点已经是群组成员'
                        });
                    }

                    // 添加新节点
                    const updatedNodeIds = [...currentNodeIds, nodeId];

                    // 调用更新群组成员接口
                    req.body = { nodeIds: updatedNodeIds };
                    return groupCoreController.updateGroupMembers(req, res);
                } else {
                    // 返回原始响应
                    return res.status(code).json(data);
                }
            },
            send: (data) => res.status(code).send(data)
        })
    });
};

// 从群组移除节点（通过调用更新群组成员）
exports.removeNode = (req, res) => {
    const groupId = req.params.id;
    const nodeId = req.params.nodeId;

    // 首先获取当前群组
    req.params.id = groupId;

    // 使用中间件模式传递当前请求到下一个处理函数
    return groupCoreController.getGroupById(req, {
        status: (code) => ({
            json: (data) => {
                if (code === 200 && data.success) {
                    // 获取当前群组成员
                    const currentNodeIds = data.data.memberNodeIds || [];

                    // 检查节点是否在群组中
                    if (!currentNodeIds.includes(nodeId)) {
                        return res.status(400).json({
                            success: false,
                            message: '节点不是群组成员'
                        });
                    }

                    // 移除节点
                    const updatedNodeIds = currentNodeIds.filter(id => id !== nodeId);

                    // 调用更新群组成员接口
                    req.body = { nodeIds: updatedNodeIds };
                    return groupCoreController.updateGroupMembers(req, res);
                } else {
                    // 返回原始响应
                    return res.status(code).json(data);
                }
            },
            send: (data) => res.status(code).send(data)
        })
    });
};

// 删除群组（保留但标记为废弃，因为核心算法中没有对应的删除操作）
exports.delete = (req, res) => {
    return res.status(400).json({
        success: false,
        message: '删除群组操作与核心算法不符，已被废弃。请使用更新状态功能将群组标记为非活动。'
    });
};
