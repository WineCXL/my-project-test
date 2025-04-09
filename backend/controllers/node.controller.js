const db = require("../models");
const Node = db.nodes;

// 创建新节点
exports.create = (req, res) => {
    // 验证请求
    if (!req.body.nodeId) {
        res.status(400).send({
            message: "节点ID不能为空！"
        });
        return;
    }

    // 创建节点对象
    const node = {
        nodeId: req.body.nodeId,
        nodeType: req.body.nodeType || 'data',
        status: req.body.status || 'active',
        publicKey: req.body.publicKey,
        privateKey: req.body.privateKey,
        location: req.body.location,
        description: req.body.description
    };

    // 保存到数据库
    Node.create(node)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "创建节点时发生错误。"
            });
        });
};

// 获取所有节点
exports.findAll = (req, res) => {
    const nodeType = req.query.nodeType;
    const status = req.query.status;
    
    let condition = {};
    if (nodeType) condition.nodeType = nodeType;
    if (status) condition.status = status;

    Node.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "获取节点列表时发生错误。"
            });
        });
};

// 获取单个节点
exports.findOne = (req, res) => {
    const id = req.params.id;

    Node.findByPk(id)
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到ID为${id}的节点。`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `获取ID为${id}的节点时发生错误。`
            });
        });
};

// 按节点ID查找
exports.findByNodeId = (req, res) => {
    const nodeId = req.params.nodeId;

    Node.findOne({ where: { nodeId: nodeId } })
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到节点ID为${nodeId}的节点。`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `获取节点ID为${nodeId}的节点时发生错误。`
            });
        });
};

// 更新节点
exports.update = (req, res) => {
    const id = req.params.id;

    Node.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "节点更新成功。"
                });
            } else {
                res.send({
                    message: `无法更新ID为${id}的节点。可能节点不存在或请求体为空！`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `更新ID为${id}的节点时发生错误。`
            });
        });
};

// 删除节点
exports.delete = (req, res) => {
    const id = req.params.id;

    Node.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "节点删除成功！"
                });
            } else {
                res.send({
                    message: `无法删除ID为${id}的节点。可能节点不存在！`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `删除ID为${id}的节点时发生错误。`
            });
        });
}; 