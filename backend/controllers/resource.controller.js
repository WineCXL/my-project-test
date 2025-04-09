const db = require("../models");
const Resource = db.resources;
const Group = db.groups;

// 创建新资源
exports.create = (req, res) => {
    // 验证请求
    if (!req.body.resourceId || !req.body.resourceName) {
        res.status(400).send({
            message: "资源ID和名称不能为空！",
        });
        return;
    }

    // 创建资源对象
    const resource = {
        resourceId: req.body.resourceId,
        resourceName: req.body.resourceName,
        resourceType: req.body.resourceType,
        amount: req.body.amount || 0,
        keywords: req.body.keywords || [],
        encryptedData: req.body.encryptedData,
        status: req.body.status || "available",
        description: req.body.description,
        groupId: req.body.groupId,
    };

    // 保存到数据库
    Resource.create(resource)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "创建资源时发生错误。",
            });
        });
};

// 获取所有资源
exports.findAll = (req, res) => {
    const status = req.query.status;
    const groupId = req.query.groupId;

    let condition = {};
    if (status) condition.status = status;
    if (groupId) condition.groupId = groupId;

    Resource.findAll({
        where: condition,
        include: [
            {
                model: Group,
                as: "group",
                attributes: ["id", "groupId", "groupName"],
            },
        ],
    })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "获取资源列表时发生错误。",
            });
        });
};

// 获取单个资源
exports.findOne = (req, res) => {
    const id = req.params.id;

    Resource.findByPk(id, {
        include: [
            {
                model: Group,
                as: "group",
                attributes: ["id", "groupId", "groupName"],
            },
        ],
    })
        .then((data) => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到ID为${id}的资源。`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `获取ID为${id}的资源时发生错误。`,
            });
        });
};

// 按资源ID查找
exports.findByResourceId = (req, res) => {
    const resourceId = req.params.resourceId;

    Resource.findOne({
        where: { resourceId: resourceId },
        include: [
            {
                model: Group,
                as: "group",
                attributes: ["id", "groupId", "groupName"],
            },
        ],
    })
        .then((data) => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到资源ID为${resourceId}的资源。`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `获取资源ID为${resourceId}的资源时发生错误。`,
            });
        });
};

// 按关键词搜索资源
exports.searchByKeyword = (req, res) => {
    const keyword = req.params.keyword;

    Resource.findAll({
        where: {},
        include: [
            {
                model: Group,
                as: "group",
                attributes: ["id", "groupId", "groupName"],
            },
        ],
    })
        .then((resources) => {
            // 过滤包含关键词的资源
            const filteredResources = resources.filter((resource) => {
                try {
                    const keywords = resource.keywords;
                    return keywords.includes(keyword);
                } catch (error) {
                    return false;
                }
            });

            res.send(filteredResources);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "搜索资源时发生错误。",
            });
        });
};

// 更新资源
exports.update = (req, res) => {
    const id = req.params.id;

    Resource.update(req.body, {
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "资源更新成功。",
                });
            } else {
                res.send({
                    message: `无法更新ID为${id}的资源。可能资源不存在或请求体为空！`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `更新ID为${id}的资源时发生错误。`,
            });
        });
};

// 分配资源到群组
exports.allocateToGroup = (req, res) => {
    const resourceId = req.params.id;
    const groupId = req.params.groupId;

    Resource.findByPk(resourceId)
        .then((resource) => {
            if (!resource) {
                res.status(404).send({
                    message: `未找到ID为${resourceId}的资源。`,
                });
                return;
            }

            Group.findByPk(groupId)
                .then((group) => {
                    if (!group) {
                        res.status(404).send({
                            message: `未找到ID为${groupId}的群组。`,
                        });
                        return;
                    }

                    resource.setGroup(group);
                    resource.update({ status: "allocated" });
                    res.send({
                        message: `成功将资源分配给群组。`,
                    });
                })
                .catch((err) => {
                    res.status(500).send({
                        message: err.message || "分配资源时发生错误。",
                    });
                });
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "分配资源时发生错误。",
            });
        });
};

// 删除资源
exports.delete = (req, res) => {
    const id = req.params.id;

    Resource.destroy({
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "资源删除成功！",
                });
            } else {
                res.send({
                    message: `无法删除ID为${id}的资源。可能资源不存在！`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `删除ID为${id}的资源时发生错误。`,
            });
        });
};
