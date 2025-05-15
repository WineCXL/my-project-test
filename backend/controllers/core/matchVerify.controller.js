/**
 * 匹配验证控制器 - 实现论文《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》
 * 中的匹配验证(MatchVerify)算法
 */

const db = require("../../models");
const crypto = require("../../lib/crypto");
const { handleError } = require("../../utils/errorHandler");

// 数据模型
const EdgeNode = db.Node;
const Group = db.Group;
const AuthToken = db.authTokens;
const MatchResult = db.matchResults;
const EncryptedMetadata = db.encryptedMetadata;

// 添加：固定安全级别和系统参数
const SECURITY_LEVEL = 128; // 与C++版本保持一致

/**
 * @desc    验证关键词匹配
 * @route   POST /api/match/verify
 * @access  Private
 */
exports.verifyMatch = async (req, res) => {
    try {
        const { tokenId, encryptedMetadataId, edgeNodeId } = req.body;

        // 验证请求参数
        if (!tokenId || !encryptedMetadataId || !edgeNodeId) {
            return res.status(400).json({
                success: false,
                message: "令牌ID、加密元数据ID和边缘节点ID都是必需的",
            });
        }

        // 检查授权令牌是否存在
        const authToken = await AuthToken.findOne({
            where: { tokenId: tokenId },
        });
        if (!authToken) {
            return res.status(404).json({
                success: false,
                message: "授权令牌不存在",
            });
        }

        // 检查令牌是否过期
        if (new Date(authToken.expiresAt) < new Date()) {
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

        // 检查加密元数据是否存在
        const encryptedMetadata = await EncryptedMetadata.findByPk(
            encryptedMetadataId
        );
        if (!encryptedMetadata) {
            return res.status(404).json({
                success: false,
                message: "加密元数据不存在",
            });
        }

        // 修改：获取系统参数 - 改为使用硬编码参数
        const systemParams = {
            params: {
                securityLevel: SECURITY_LEVEL,
                curveType: "secp256k1",
                pairingType: "SS2", // 与C++版本保持一致
            },
        };

        // 获取群组信息
        const group = await Group.findByPk(authToken.groupId);

        // 使用密码学引擎验证关键词匹配
        const isMatched = await crypto.verifyKeywordMatch({
            trapdoor: authToken.token,
            edgeNodeId: edgeNodeId,
            edgeNodePrivateKey: edgeNode.privateKey,
            groupPublicKey: group.publicKey,
            encryptedMetadata: encryptedMetadata.content,
            systemParams: systemParams.params,
        });

        // 保存匹配结果
        const matchResult = await MatchResult.create({
            tokenId: tokenId,
            metadataId: encryptedMetadataId,
            edgeNodeId: edgeNodeId,
            isMatched: isMatched,
            verifiedAt: new Date(),
        });

        // 返回验证结果
        return res.status(200).json({
            success: true,
            message: isMatched ? "关键词匹配成功" : "关键词不匹配",
            data: {
                matchResultId: matchResult.id,
                isMatched: isMatched,
                tokenId: tokenId,
                metadataId: encryptedMetadataId,
                edgeNodeId: edgeNodeId,
                verifiedAt: matchResult.verifiedAt,
            },
        });
    } catch (error) {
        return handleError(res, error, "验证关键词匹配时发生错误");
    }
};

/**
 * @desc    获取匹配结果列表
 * @route   GET /api/match/results
 * @access  Private
 */
exports.getMatchResults = async (req, res) => {
    try {
        const { edgeNodeId, tokenId, metadataId } = req.query;

        // 构建查询条件
        const whereCondition = {};

        if (edgeNodeId) {
            whereCondition.edgeNodeId = edgeNodeId;
        }

        if (tokenId) {
            whereCondition.tokenId = tokenId;
        }

        if (metadataId) {
            whereCondition.metadataId = metadataId;
        }

        // 查询匹配结果
        const matchResults = await MatchResult.findAll({
            where: whereCondition,
            order: [["verifiedAt", "DESC"]],
            include: [
                {
                    model: AuthToken,
                    as: "authToken",
                    attributes: ["keyword", "userId"],
                },
                {
                    model: EncryptedMetadata,
                    as: "metadata",
                    attributes: ["tag", "createdAt"],
                },
            ],
        });

        // 返回匹配结果列表
        return res.status(200).json({
            success: true,
            count: matchResults.length,
            data: matchResults,
        });
    } catch (error) {
        return handleError(res, error, "获取匹配结果列表时发生错误");
    }
};

/**
 * @desc    基于匹配结果分配资源
 * @route   POST /api/match/allocate
 * @access  Private
 */
exports.allocateResources = async (req, res) => {
    try {
        const { matchResultIds, resourceDetails } = req.body;

        // 验证请求参数
        if (
            !matchResultIds ||
            !Array.isArray(matchResultIds) ||
            matchResultIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "匹配结果ID列表是必需的",
            });
        }

        // 获取匹配结果
        const matchResults = await MatchResult.findAll({
            where: {
                id: matchResultIds,
                isMatched: true, // 只处理匹配成功的结果
            },
            include: [
                {
                    model: EdgeNode,
                    as: "edgeNode",
                    attributes: ["nodeId", "privateKey", "status"],
                },
                {
                    model: EncryptedMetadata,
                    as: "metadata",
                    attributes: ["id", "content", "tag"],
                },
            ],
        });

        if (matchResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: "未找到匹配的资源分配结果",
            });
        }

        // 提取匹配的元数据和边缘节点
        const encryptedMetadataList = matchResults.map(
            (result) => result.metadata.content
        );
        const edgeNodeIds = [
            ...new Set(matchResults.map((result) => result.edgeNode.nodeId)),
        ];

        // 修改：获取系统参数 - 改为使用硬编码参数
        const systemParams = {
            params: {
                securityLevel: SECURITY_LEVEL,
                curveType: "secp256k1",
                pairingType: "SS2", // 与C++版本保持一致
            },
        };

        // 使用密码学引擎执行资源分配
        const allocationResult =
            await crypto.allocateResourcesAccordingToKeywords({
                matchResults: matchResults.map((result) => ({
                    id: result.id,
                    edgeNodeId: result.edgeNode.nodeId,
                    metadataId: result.metadata.id,
                    tag: result.metadata.tag,
                })),
                resourceDetails: resourceDetails || {},
                systemParams: systemParams.params,
            });

        // 返回资源分配结果
        return res.status(200).json({
            success: true,
            message: "资源分配成功",
            data: JSON.parse(allocationResult),
        });
    } catch (error) {
        return handleError(res, error, "分配资源时发生错误");
    }
};
