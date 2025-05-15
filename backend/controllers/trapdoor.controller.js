const db = require("../models");
const Trapdoor = db.Trapdoor;
const Group = db.Group;
const Resource = db.Resource;
const Search = db.SearchRecord; // 暂时停用搜索记录功能
const crypto = require("../lib/crypto");
const { v4: uuidv4 } = require("uuid");

// 创建新的陷门
exports.create = async (req, res) => {
    try {
        // 验证请求
        if (!req.body.keyword || !req.body.groupId) {
            return res.status(400).send({
                success: false,
                message: "关键词和群组ID不能为空!",
            });
        }

        // 检查群组是否存在
        const group = await Group.findByPk(req.body.groupId);
        if (!group) {
            return res.status(404).send({
                success: false,
                message: "指定的群组不存在!",
            });
        }

        // 从群组获取公钥和其他需要的密钥信息
        const groupKeys = JSON.parse(group.groupKeys);
        const masterPublicKey = groupKeys.masterPublicKey;

        // 生成陷门值 (实际项目中，这里应该调用实际的陷门生成算法)
        // 这里用一个模拟的函数代替
        const trapdoorValue = await crypto.generateTrapdoor(
            req.body.keyword,
            masterPublicKey
        );

        // 创建陷门
        const trapdoor = {
            trapdoorId: uuidv4(),
            keyword: req.body.keyword,
            groupId: req.body.groupId,
            description: req.body.description || "",
            trapdoorValue: JSON.stringify(trapdoorValue),
            userId: req.userId || "system", // 假设有用户认证系统
            status: "active",
        };

        // 保存陷门到数据库
        const data = await Trapdoor.create(trapdoor);

        res.send({
            success: true,
            message: "陷门创建成功!",
            data: data,
        });
    } catch (err) {
        console.error("创建陷门时出错:", err);
        res.status(500).send({
            success: false,
            message: err.message || "创建陷门时发生错误.",
        });
    }
};

// 获取所有陷门
exports.findAll = async (req, res) => {
    try {
        const trapdoors = await Trapdoor.findAll({
            order: [["createdAt", "DESC"]],
        });

        res.send({
            success: true,
            data: trapdoors,
        });
    } catch (err) {
        console.error("获取陷门列表时出错:", err);
        res.status(500).send({
            success: false,
            message: err.message || "获取陷门列表时发生错误.",
        });
    }
};

// 获取单个陷门
exports.findOne = async (req, res) => {
    const trapdoorId = req.params.id;

    try {
        const trapdoor = await Trapdoor.findByPk(trapdoorId);

        if (!trapdoor) {
            return res.status(404).send({
                success: false,
                message: `未找到ID为 ${trapdoorId} 的陷门.`,
            });
        }

        res.send({
            success: true,
            data: trapdoor,
        });
    } catch (err) {
        console.error(`获取ID为 ${trapdoorId} 的陷门时出错:`, err);
        res.status(500).send({
            success: false,
            message: err.message || `获取ID为 ${trapdoorId} 的陷门时发生错误.`,
        });
    }
};

// 使用陷门进行搜索
exports.search = async (req, res) => {
    const trapdoorId = req.params.id;

    try {
        // 获取陷门
        const trapdoor = await Trapdoor.findByPk(trapdoorId);

        if (!trapdoor) {
            return res.status(404).send({
                success: false,
                message: `未找到ID为 ${trapdoorId} 的陷门.`,
            });
        }

        // 获取陷门所属的群组
        const group = await Group.findByPk(trapdoor.groupId);

        if (!group) {
            return res.status(404).send({
                success: false,
                message: "该陷门关联的群组不存在!",
            });
        }

        // 在资源中搜索匹配的关键词索引
        // 在实际项目中，这里应该调用实际的搜索算法
        // 这里用一个简化的搜索作为示例
        const trapdoorValue = JSON.parse(trapdoor.trapdoorValue);

        // 搜索资源
        const startTime = Date.now();

        // 假设我们通过匹配加密索引来找到资源
        // 这里仅作为示例，实际实现应基于真实的加密搜索算法
        const resources = await Resource.findAll({
            where: {
                groupId: trapdoor.groupId,
                status: "active",
            },
        });

        // 过滤包含此关键词的资源
        // 实际项目中，这里应基于密码学方案进行
        const matchedResources = await crypto.searchWithTrapdoor(
            resources,
            trapdoorValue
        );

        const endTime = Date.now();
        const executionTime = (endTime - startTime) / 1000; // 秒


        // 记录搜索操作
        /*
        await Search.create({
            keyword: trapdoor.keyword,
            trapdoor: trapdoor.trapdoorValue,
            result: matchedResources.length > 0,
            searchTime: new Date(),
            executionTime: executionTime,
            searcherId: req.userId || "system",
            status: "success",
        });
        */

        res.send({
            success: true,
            message: `找到 ${matchedResources.length} 个匹配资源.`,
            data: matchedResources,
        });
    } catch (err) {
        console.error(`使用ID为 ${trapdoorId} 的陷门搜索时出错:`, err);

        // 记录失败的搜索
        /*
        if (req.trapdoorId) {
            await Search.create({
                keyword: req.keyword || "",
                searchTime: new Date(),
                searcherId: req.userId || "system",
                status: "failed",
            });
        }
        */

        res.status(500).send({
            success: false,
            message: err.message || `使用陷门搜索时发生错误.`,
        });
    }
};

// 撤销陷门
exports.revoke = async (req, res) => {
    const trapdoorId = req.params.id;

    try {
        const trapdoor = await Trapdoor.findByPk(trapdoorId);

        if (!trapdoor) {
            return res.status(404).send({
                success: false,
                message: `未找到ID为 ${trapdoorId} 的陷门.`,
            });
        }

        // 更新陷门状态为已撤销
        await trapdoor.update({ status: "revoked" });

        res.send({
            success: true,
            message: "陷门已成功撤销!",
        });
    } catch (err) {
        console.error(`撤销ID为 ${trapdoorId} 的陷门时出错:`, err);
        res.status(500).send({
            success: false,
            message: err.message || `撤销陷门时发生错误.`,
        });
    }
};

// 获取陷门统计信息
exports.getStats = async (req, res) => {
    try {
        // 统计总数
        const total = await Trapdoor.count();

        // 统计活跃数量
        const active = await Trapdoor.count({
            where: { status: "active" },
        });

        // 按群组分组统计
        const byGroup = await Trapdoor.count({
            attributes: ["groupId"],
            group: ["groupId"],
            raw: true,
        });

        res.send({
            success: true,
            data: {
                total,
                active,
                byGroup,
            },
        });
    } catch (err) {
        console.error("获取陷门统计时出错:", err);
        res.status(500).send({
            success: false,
            message: err.message || "获取陷门统计时发生错误.",
        });
    }
};
