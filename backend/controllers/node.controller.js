/**
 * 边缘节点控制器
 * 负责节点管理等功能
 * 内部实现调用core/edgeNode.controller.js
 */

// 导入核心算法控制器
const edgeNodeController = require('./core/edgeNode.controller');

// 创建新节点
exports.create = edgeNodeController.registerNode;

// 获取所有节点
exports.findAll = edgeNodeController.getAllNodes;

// 获取单个节点
exports.findOne = (req, res) => {
    // 将req.params.id转换为适合edgeNodeController.getNodeById的格式
    req.params.id = req.params.id;
    return edgeNodeController.getNodeById(req, res);
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

// 删除节点（保留但标记为废弃，因为核心算法中没有对应的删除操作）
exports.delete = (req, res) => {
    return res.status(400).json({
        success: false,
        message: '删除节点操作与核心算法不符，已被废弃。请使用更新状态功能将节点标记为非活动。'
    });
};
