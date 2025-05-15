/**
 * 关键词生成(KeywordGen)控制器
 * 实现论文中的KeywordGen算法
 */

const CryptoEngine = require("../../lib/crypto");
const Keyword = require("../../models/keyword.model");

/**
 * 生成新的关键词
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.generateKeyword = async (req, res) => {
    try {
        const { keyword, description } = req.body;

        // 验证必要参数
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: "关键词不能为空",
            });
        }

        // 检查关键词是否已存在
        const existingKeyword = await Keyword.findOne({ keyword });
        if (existingKeyword) {
            return res.status(409).json({
                success: false,
                message: "此关键词已存在",
            });
        }

        // 调用加密引擎的keywordGen函数生成加密关键词
        const encryptedKeyword = CryptoEngine.keywordGen(keyword);

        // 保存关键词到数据库
        const newKeyword = new Keyword({
            keyword,
            encryptedKeyword,
            description: description || "",
            createdAt: Date.now(),
        });

        await newKeyword.save();

        // 返回成功响应
        return res.status(201).json({
            success: true,
            message: "关键词生成成功",
            data: {
                keyword,
                encryptedKeyword,
                description: description || "",
            },
        });
    } catch (error) {
        console.error("关键词生成失败:", error);
        return res.status(500).json({
            success: false,
            message: "关键词生成失败",
            error: error.message,
        });
    }
};

/**
 * 获取所有关键词
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.getAllKeywords = async (req, res) => {
    try {
        // 查询所有关键词
        const keywords = await Keyword.find();

        return res.status(200).json({
            success: true,
            count: keywords.length,
            data: keywords,
        });
    } catch (error) {
        console.error("获取关键词列表失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取关键词列表失败",
            error: error.message,
        });
    }
};

/**
 * 获取关键词详情
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.getKeywordById = async (req, res) => {
    try {
        const keywordId = req.params.id;

        // 查询关键词
        const keyword = await Keyword.findById(keywordId);

        if (!keyword) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的关键词",
            });
        }

        return res.status(200).json({
            success: true,
            data: keyword,
        });
    } catch (error) {
        console.error("获取关键词详情失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取关键词详情失败",
            error: error.message,
        });
    }
};
