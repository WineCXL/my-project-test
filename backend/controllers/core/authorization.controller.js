/**
 * 授权测试控制器 - 实现论文《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》
 * 中的授权测试(AuthorTest)算法
 */

const crypto = require("../../lib/crypto");
const { User, Group, EdgeNode, AuthToken } = require("../../models");
const db = require("../../models");
const { handleError } = require("../../utils/errorHandler");

const SECURITY_LEVEL = 128;

/**
 * @desc    生成授权令牌
 * @route   POST /api/auth/token
 * @access  Private
 */
exports.generateAuthToken = async (req, res) => {
    try {
        const { userId, groupId, keyword } = req.body;

        // 验证请求参数
        if (!userId || !groupId || !keyword) {
            return res.status(400).json({
                success: false,
                message: "用户ID、群组ID和关键词是必需的",
            });
        }

        // 检查用户是否存在
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "用户不存在",
            });
        }

        // 检查群组是否存在
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "群组不存在",
            });
        }

        // 使用固定的系统参数
        const systemParams = {
            params: {
                securityLevel: SECURITY_LEVEL,
                curveType: "secp256k1",
                pairingType: "SS2", // 与C++版本保持一致
            },
        };

        // 使用密码学引擎生成授权令牌 (陷门)
        const token = await crypto.generateAuthToken({
            userId: userId,
            userPrivateKey: user.privateKey,
            groupId: groupId,
            groupPublicKey: group.publicKey,
            keyword: keyword,
            systemParams: systemParams.params,
        });

        // 保存授权令牌到数据库
        const authToken = await AuthToken.create({
            userId: userId,
            groupId: groupId,
            token: token,
            keyword: keyword,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
            status: "active",
        });

        // 返回成功响应
        return res.status(201).json({
            success: true,
            message: "授权令牌生成成功",
            data: {
                authTokenId: authToken.id,
                token: authToken.token,
                createdAt: authToken.createdAt,
                expiresAt: authToken.expiresAt,
            },
        });
    } catch (error) {
        return handleError(res, error, "生成授权令牌时发生错误");
    }
};

/**
 * @desc    验证授权令牌
 * @route   POST /api/auth/verify
 * @access  Private
 */
exports.verifyAuthToken = async (req, res) => {
    try {
        const { tokenId, edgeNodeId, encryptedData } = req.body;

        // 验证请求参数
        if (!tokenId || !edgeNodeId || !encryptedData) {
            return res.status(400).json({
                success: false,
                message: "令牌ID、边缘节点ID和加密数据是必需的",
            });
        }

        // 检查授权令牌是否存在
        const authToken = await AuthToken.findByPk(tokenId);
        if (!authToken) {
            return res.status(404).json({
                success: false,
                message: "授权令牌不存在",
            });
        }

        // 检查授权令牌是否过期
        if (authToken.expiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: "授权令牌已过期",
            });
        }

        // 检查边缘节点是否存在
        const edgeNode = await EdgeNode.findOne({
            where: { nodeId: edgeNodeId },
        });
        if (!edgeNode) {
            return res.status(404).json({
                success: false,
                message: "边缘节点不存在",
            });
        }

        // 使用固定的系统参数
        const systemParams = {
            params: {
                securityLevel: SECURITY_LEVEL,
                curveType: "secp256k1",
                pairingType: "SS2", // 与C++版本保持一致
            },
        };

        // 获取群组信息
        const group = await Group.findByPk(authToken.groupId);

        // 使用密码学引擎验证授权令牌
        const isAuthorized = await crypto.verifyAuthToken({
            token: authToken.token,
            edgeNodeId: edgeNodeId,
            edgeNodePrivateKey: edgeNode.privateKey,
            groupPublicKey: group.publicKey,
            encryptedData: encryptedData,
            systemParams: systemParams.params,
        });

        // 返回验证结果
        if (isAuthorized) {
            return res.status(200).json({
                success: true,
                message: "授权验证成功",
                data: {
                    authorized: true,
                    authTokenId: authToken.id,
                    edgeNodeId: edgeNodeId,
                },
            });
        } else {
            return res.status(403).json({
                success: false,
                message: "授权验证失败",
                data: {
                    authorized: false,
                },
            });
        }
    } catch (error) {
        return handleError(res, error, "验证授权令牌时发生错误");
    }
};

/**
 * @desc    获取用户的授权令牌列表
 * @route   GET /api/auth/tokens/:userId
 * @access  Private
 */
exports.getUserAuthTokens = async (req, res) => {
    try {
        const { userId } = req.params;

        // 验证请求参数
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "用户ID是必需的",
            });
        }

        // 检查用户是否存在
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "用户不存在",
            });
        }

        // 获取用户的授权令牌
        const authTokens = await AuthToken.findAll({
            where: { userId: userId },
            order: [["createdAt", "DESC"]],
        });

        // 返回授权令牌列表
        return res.status(200).json({
            success: true,
            count: authTokens.length,
            data: authTokens.map((token) => ({
                id: token.id,
                groupId: token.groupId,
                keyword: token.keyword,
                createdAt: token.createdAt,
                expiresAt: token.expiresAt,
                status: token.status,
            })),
        });
    } catch (error) {
        return handleError(res, error, "获取用户授权令牌列表时发生错误");
    }
};

/**
 * @desc    撤销授权令牌
 * @route   PUT /api/auth/revoke/:id
 * @access  Private
 */
exports.revokeAuthToken = async (req, res) => {
    try {
        const { id } = req.params;

        // 检查授权令牌是否存在
        const authToken = await AuthToken.findByPk(id);
        if (!authToken) {
            return res.status(404).json({
                success: false,
                message: "授权令牌不存在",
            });
        }

        // 更新授权令牌状态为已撤销
        authToken.status = "revoked";
        await authToken.save();

        // 返回成功响应
        return res.status(200).json({
            success: true,
            message: "授权令牌已成功撤销",
            data: {
                id: authToken.id,
                status: authToken.status,
            },
        });
    } catch (error) {
        return handleError(res, error, "撤销授权令牌时发生错误");
    }
};
