const db = require("../models");
const Group = db.groups;
const Node = db.nodes;

// 创建新群组
exports.create = (req, res) => {
    // 验证请求
    if (!req.body.groupId || !req.body.groupName) {
        res.status(400).send({
            message: "群组ID和名称不能为空！",
        });
        return;
    }

    // 创建群组对象
    const group = {
        groupId: req.body.groupId,
        groupName: req.body.groupName,
        status: req.body.status || "active",
        groupPublicKey: req.body.groupPublicKey,
        groupKey: req.body.groupKey,
        description: req.body.description,
    };

    // 保存到数据库
    Group.create(group)
        .then((data) => {
            // 如果传入了节点数组，则建立关联
            if (req.body.nodeIds && req.body.nodeIds.length > 0) {
                Node.findAll({
                    where: {
                        id: req.body.nodeIds,
                    },
                })
                    .then((nodes) => {
                        data.setNodes(nodes);
                        res.send(data);
                    })
                    .catch((err) => {
                        res.status(500).send({
                            message: err.message || "关联节点时发生错误。",
                        });
                    });
            } else {
                res.send(data);
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "创建群组时发生错误。",
            });
        });
};

// 获取所有群组
exports.findAll = (req, res) => {
    const status = req.query.status;

    let condition = {};
    if (status) condition.status = status;

    Group.findAll({
        where: condition,
        include: [
            {
                model: Node,
                as: "nodes",
                attributes: ["id", "nodeId", "nodeType", "status"],
                through: { attributes: [] }, // 不包含中间表字段
            },
        ],
    })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "获取群组列表时发生错误。",
            });
        });
};

// 获取单个群组
exports.findOne = (req, res) => {
    const id = req.params.id;

    Group.findByPk(id, {
        include: [
            {
                model: Node,
                as: "nodes",
                attributes: ["id", "nodeId", "nodeType", "status"],
                through: { attributes: [] },
            },
        ],
    })
        .then((data) => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到ID为${id}的群组。`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `获取ID为${id}的群组时发生错误。`,
            });
        });
};

// 按群组ID查找
exports.findByGroupId = (req, res) => {
    const groupId = req.params.groupId;

    Group.findOne({
        where: { groupId: groupId },
        include: [
            {
                model: Node,
                as: "nodes",
                attributes: ["id", "nodeId", "nodeType", "status"],
                through: { attributes: [] },
            },
        ],
    })
        .then((data) => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到群组ID为${groupId}的群组。`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `获取群组ID为${groupId}的群组时发生错误。`,
            });
        });
};

// 更新群组
exports.update = (req, res) => {
    const id = req.params.id;

    Group.update(req.body, {
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                // 如果传入了节点数组，则更新关联
                if (req.body.nodeIds && req.body.nodeIds.length > 0) {
                    Group.findByPk(id).then((group) => {
                        Node.findAll({
                            where: {
                                id: req.body.nodeIds,
                            },
                        })
                            .then((nodes) => {
                                group.setNodes(nodes);
                                res.send({
                                    message: "群组及关联节点更新成功。",
                                });
                            })
                            .catch((err) => {
                                res.status(500).send({
                                    message:
                                        err.message ||
                                        "更新关联节点时发生错误。",
                                });
                            });
                    });
                } else {
                    res.send({
                        message: "群组更新成功。",
                    });
                }
            } else {
                res.send({
                    message: `无法更新ID为${id}的群组。可能群组不存在或请求体为空！`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `更新ID为${id}的群组时发生错误。`,
            });
        });
};

// 添加节点到群组
exports.addNode = (req, res) => {
    const groupId = req.params.id;
    const nodeId = req.params.nodeId;

    Group.findByPk(groupId)
        .then((group) => {
            if (!group) {
                res.status(404).send({
                    message: `未找到ID为${groupId}的群组。`,
                });
                return;
            }

            Node.findByPk(nodeId)
                .then((node) => {
                    if (!node) {
                        res.status(404).send({
                            message: `未找到ID为${nodeId}的节点。`,
                        });
                        return;
                    }

                    group.addNode(node);
                    res.send({
                        message: `成功将节点添加到群组。`,
                    });
                })
                .catch((err) => {
                    res.status(500).send({
                        message: err.message || "添加节点时发生错误。",
                    });
                });
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "添加节点时发生错误。",
            });
        });
};

// 从群组移除节点
exports.removeNode = (req, res) => {
    const groupId = req.params.id;
    const nodeId = req.params.nodeId;

    Group.findByPk(groupId)
        .then((group) => {
            if (!group) {
                res.status(404).send({
                    message: `未找到ID为${groupId}的群组。`,
                });
                return;
            }

            Node.findByPk(nodeId)
                .then((node) => {
                    if (!node) {
                        res.status(404).send({
                            message: `未找到ID为${nodeId}的节点。`,
                        });
                        return;
                    }

                    group.removeNode(node);
                    res.send({
                        message: `成功从群组移除节点。`,
                    });
                })
                .catch((err) => {
                    res.status(500).send({
                        message: err.message || "移除节点时发生错误。",
                    });
                });
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "移除节点时发生错误。",
            });
        });
};

// 删除群组
exports.delete = (req, res) => {
    const id = req.params.id;

    Group.destroy({
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "群组删除成功！",
                });
            } else {
                res.send({
                    message: `无法删除ID为${id}的群组。可能群组不存在！`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `删除ID为${id}的群组时发生错误。`,
            });
        });
};
