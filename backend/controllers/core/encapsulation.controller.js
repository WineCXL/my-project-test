/**
 * 消息封装(Encapsulation)控制器
 * 实现论文中的消息封装算法
 */

const CryptoEngine = require("../../lib/crypto");
const Group = require("../../models/group.model");
const Keyword = require("../../models/keyword.model");
const EncryptedMessage = require("../../models/encryptedMessage.model");

// 直接使用导入的加密引擎

/**
 * 执行消息封装，生成加密密文
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.encapsulateMessage = async (req, res) => {
    try {
        const { groupId, keywordId, message } = req.body;

        // 验证必要参数
        if (!groupId || !keywordId || !message) {
            return res.status(400).json({
                success: false,
                message: "群组ID、关键词ID和消息内容都是必须的",
            });
        }

        // 获取群组信息
        const group = await Group.findOne({ groupId });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的群组",
            });
        }

        // 获取关键词信息
        const keyword = await Keyword.findById(keywordId);
        if (!keyword) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的关键词",
            });
        }

        // 调用加密引擎的encapsulation函数生成密文
        const ciphertext = CryptoEngine.encapsulation(
            group.publicKey,
            keyword.encryptedKeyword,
            message
        );

        // 保存加密消息到数据库
        const encryptedMessage = new EncryptedMessage({
            groupId,
            keywordId,
            ciphertext,
            createdAt: Date.now(),
        });

        await encryptedMessage.save();

        // 返回成功响应
        return res.status(201).json({
            success: true,
            message: "消息封装成功",
            data: {
                id: encryptedMessage._id,
                groupId,
                keywordId,
                ciphertext,
                createdAt: encryptedMessage.createdAt,
            },
        });
    } catch (error) {
        console.error("消息封装失败:", error);
        return res.status(500).json({
            success: false,
            message: "消息封装失败",
            error: error.message,
        });
    }
};

/**
 * 获取所有已封装消息
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.getAllEncapsulatedMessages = async (req, res) => {
    try {
        // 查询所有加密消息
        const encryptedMessages = await EncryptedMessage.find()
            .populate("groupId", "groupId groupName")
            .populate("keywordId", "keyword description");

        return res.status(200).json({
            success: true,
            count: encryptedMessages.length,
            data: encryptedMessages,
        });
    } catch (error) {
        console.error("获取加密消息列表失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取加密消息列表失败",
            error: error.message,
        });
    }
};

/**
 * 获取特定群组的加密消息
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.getEncapsulatedMessagesByGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // 获取群组信息
        const group = await Group.findOne({ groupId });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的群组",
            });
        }

        // 查询该群组的所有加密消息
        const encryptedMessages = await EncryptedMessage.find({
            groupId: group._id,
        }).populate("keywordId", "keyword description");

        return res.status(200).json({
            success: true,
            count: encryptedMessages.length,
            data: encryptedMessages,
        });
    } catch (error) {
        console.error("获取群组加密消息列表失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取群组加密消息列表失败",
            error: error.message,
        });
    }
};
