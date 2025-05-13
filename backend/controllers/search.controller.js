const db = require("../models");
const Search = db.SearchRecord;
const User = db.User;

// 创建搜索记录
exports.create = (req, res) => {
    // 验证请求
    if (!req.body.userId || !req.body.keywords) {
        res.status(400).send({
            message: "用户ID和搜索关键词不能为空！",
        });
        return;
    }

    // 创建搜索记录对象
    const search = {
        userId: req.body.userId,
        keywords: req.body.keywords,
        resultCount: req.body.resultCount || 0,
        searchTime: new Date(),
    };

    // 保存到数据库
    Search.create(search)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "创建搜索记录时发生错误。",
            });
        });
};

// 获取所有搜索记录
exports.findAll = (req, res) => {
    const userId = req.query.userId;
    let condition = userId ? { userId: userId } : {};

    Search.findAll({
        where: condition,
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "username", "email"],
            },
        ],
        order: [["searchTime", "DESC"]],
    })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "获取搜索记录时发生错误。",
            });
        });
};

// 获取单个搜索记录
exports.findOne = (req, res) => {
    const id = req.params.id;

    Search.findByPk(id, {
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "username", "email"],
            },
        ],
    })
        .then((data) => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到ID为${id}的搜索记录。`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `获取ID为${id}的搜索记录时发生错误。`,
            });
        });
};

// 获取搜索统计
exports.getStats = (req, res) => {
    const startDate = req.query.startDate
        ? new Date(req.query.startDate)
        : new Date(new Date().setDate(new Date().getDate() - 30)); // 默认过去30天
    const endDate = req.query.endDate
        ? new Date(req.query.endDate)
        : new Date();

    // 添加一天到结束日期，确保包含当天的记录
    endDate.setDate(endDate.getDate() + 1);

    Search.findAll({
        where: {
            searchTime: {
                [db.Sequelize.Op.between]: [startDate, endDate],
            },
        },
        attributes: [
            "keywords",
            [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
        ],
        group: ["keywords"],
        order: [[db.Sequelize.literal("count"), "DESC"]],
        limit: 10, // 获取前10个热门关键词
    })
        .then((keywordStats) => {
            // 获取用户搜索统计
            Search.findAll({
                where: {
                    searchTime: {
                        [db.Sequelize.Op.between]: [startDate, endDate],
                    },
                },
                attributes: [
                    "userId",
                    [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
                ],
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["username", "email"],
                    },
                ],
                group: ["userId", "user.id", "user.username", "user.email"],
                order: [[db.Sequelize.literal("count"), "DESC"]],
                limit: 10, // 获取前10个活跃用户
            })
                .then((userStats) => {
                    // 获取每日搜索统计
                    Search.findAll({
                        where: {
                            searchTime: {
                                [db.Sequelize.Op.between]: [startDate, endDate],
                            },
                        },
                        attributes: [
                            [
                                db.Sequelize.fn(
                                    "DATE",
                                    db.Sequelize.col("searchTime")
                                ),
                                "date",
                            ],
                            [
                                db.Sequelize.fn(
                                    "COUNT",
                                    db.Sequelize.col("id")
                                ),
                                "count",
                            ],
                        ],
                        group: [
                            db.Sequelize.fn(
                                "DATE",
                                db.Sequelize.col("searchTime")
                            ),
                        ],
                        order: [
                            [
                                db.Sequelize.fn(
                                    "DATE",
                                    db.Sequelize.col("searchTime")
                                ),
                                "ASC",
                            ],
                        ],
                    })
                        .then((dailyStats) => {
                            // 获取总搜索次数
                            Search.count({
                                where: {
                                    searchTime: {
                                        [db.Sequelize.Op.between]: [
                                            startDate,
                                            endDate,
                                        ],
                                    },
                                },
                            })
                                .then((totalSearches) => {
                                    res.send({
                                        totalSearches,
                                        keywordStats,
                                        userStats,
                                        dailyStats,
                                        dateRange: {
                                            startDate,
                                            endDate: new Date(
                                                endDate.setDate(
                                                    endDate.getDate() - 1
                                                )
                                            ),
                                        },
                                    });
                                })
                                .catch((err) => {
                                    res.status(500).send({
                                        message:
                                            err.message ||
                                            "获取搜索统计时发生错误。",
                                    });
                                });
                        })
                        .catch((err) => {
                            res.status(500).send({
                                message:
                                    err.message || "获取搜索统计时发生错误。",
                            });
                        });
                })
                .catch((err) => {
                    res.status(500).send({
                        message: err.message || "获取搜索统计时发生错误。",
                    });
                });
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "获取搜索统计时发生错误。",
            });
        });
};

// 删除搜索记录
exports.delete = (req, res) => {
    const id = req.params.id;

    Search.destroy({
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "搜索记录删除成功！",
                });
            } else {
                res.send({
                    message: `无法删除ID为${id}的搜索记录。可能记录不存在！`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `删除ID为${id}的搜索记录时发生错误。`,
            });
        });
};
