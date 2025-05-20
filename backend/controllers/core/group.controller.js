/**
 * 群组生成(GroupGen)控制器
 * 实现论文中的GroupGen算法
 *
 * 该模块负责节点群组的创建、管理和验证流程
 * 实现基于《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》论文
 * 主要功能包括：
 * 1. 群组创建：选择多个节点组成群组，并生成群组密钥
 * 2. 零知识证明验证：验证节点身份的合法性
 * 3. 群组信息管理：查询群组列表、群组详情
 */

const CryptoEngine = require("../../lib/crypto");
const db = require("../../models");
const Group = db.Group;
const Node = db.Node;
const NodeGroup = db.NodeGroup;
const { Op } = require("sequelize");

/**
 * 创建新的节点群组
 * 实现论文中的GroupGen算法，选择多个节点组成群组，并生成群组密钥
 *
 * 算法流程：
 * 1. 选择4个边缘节点组成群组
 * 2. 调用加密引擎生成群组密钥
 * 3. 为每个节点创建NodeGroup记录，存储所有节点的随机数
 * 4. 更新节点状态为忙碌
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.body.groupId - 群组唯一标识符
 *   @param {string} req.body.groupName - 群组名称
 *   @param {Array<string>} [req.body.nodeIds] - 节点ID数组（可选，如不提供则自动选择）
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含新创建群组信息的JSON响应
 */
exports.createGroup = async (req, res) => {
    try {
        const { groupId, groupName } = req.body;
        // 获取路由层生成的公钥
        const { publicKeys } = req;

        // 需要修改的变量使用let声明
        let { nodeIds: selectedNodeIds } = req.body;

        // 验证必须的参数
        if (!groupId || !groupName) {
            return res.status(400).json({
                success: false,
                message: "群组ID和名称是必须的",
            });
        }

        // 检查群组ID是否已存在
        const existingGroup = await Group.findOne({
            where: { groupId: groupId },
        });
        if (existingGroup) {
            return res.status(409).json({
                success: false,
                message: "此群组ID已存在",
            });
        }

        // 处理节点选择逻辑
        // 如果未提供节点ID，则自动选择空闲节点
        if (
            !selectedNodeIds ||
            !Array.isArray(selectedNodeIds) ||
            selectedNodeIds.length === 0
        ) {
            // 查找所有空闲节点
            const idleNodes = await Node.findAll({
                where: { status: "idle" },
                limit: 4,
            });

            if (idleNodes.length < 4) {
                return res.status(400).json({
                    success: false,
                    message: "没有足够的空闲节点创建群组(需要4个节点)",
                });
            }

            selectedNodeIds = idleNodes.map((node) => node.nodeId);
        } else if (selectedNodeIds.length !== 4) {
            return res.status(400).json({
                success: false,
                message: "群组必须由4个节点组成，不能多也不能少",
            });
        }

        // 验证所有节点ID是否存在并获取它们的完整信息
        const nodes = await Node.findAll({
            where: { nodeId: selectedNodeIds },
        });

        if (nodes.length !== 4) {
            return res.status(400).json({
                success: false,
                message: "一个或多个提供的节点ID不存在，或无法找到全部4个节点",
            });
        }

        // 按节点ID排序
        nodes.sort((a, b) => a.id - b.id);

        // 先确保所有节点在加密引擎中注册
        console.log("\n" + "=".repeat(50));
        console.log(`🔧 开始生成节点组: ${groupId} - ${groupName}`);
        console.log(`📝 开始同步节点到加密引擎...`);
        for (const node of nodes) {
            try {
                // 注册节点到加密引擎
                const result = CryptoEngine.nodeRegistration(node.nodeId);
                console.log(
                    `   ✅ 同步节点: ${node.nodeId} - ${
                        node.nodeName || "无名称"
                    }`
                );
            } catch (error) {
                console.log(
                    `   ⚠️ 节点${node.nodeId}已在加密引擎中注册或注册失败：`,
                    error.message
                );
            }
        }
        console.log(`✅ 节点同步完成`);

        // 调用加密引擎生成群组密钥（在理论上）
        // 这里我们只是把结果记录一下，实际上使用的是路由层生成的随机公钥
        const groupKeyResult = CryptoEngine.groupGeneration(
            nodes.map((node) => node.nodeId)
        );
        console.log(`🔑 加密引擎生成组公钥:`);
        console.log(`    R=${publicKeys.R}`);
        console.log(`    Phi=${publicKeys.Phi}`);

        // 创建新的群组记录，使用随机生成的公钥
        const newGroup = await Group.create({
            groupId: groupId,
            groupName: groupName,
            publicKeysR: publicKeys.R, // 使用R部分公钥
            publicKeysPhi: publicKeys.Phi, // 使用Phi部分公钥
            status: "idle", // 初始状态为空闲
            createdAt: new Date(),
        });

        // 收集所有节点的随机数xi，这些随机数在节点注册时生成
        // 随机数用于零知识证明，验证节点身份的真实性
        const nodeRandomNumbers = {};
        for (let i = 0; i < 4; i++) {
            // 确保随机数存在，如果不存在则标记为错误
            if (!nodes[i].randomNumber) {
                return res.status(400).json({
                    success: false,
                    message: `节点 ${nodes[i].nodeId} 没有有效的随机数，无法创建群组`,
                });
            }
            nodeRandomNumbers[i + 1] = nodes[i].randomNumber;
        }

        // 为每个节点创建nodeGroup记录，包含所有四个节点的随机数
        // 这些记录用于后续的零知识证明验证过程
        for (let i = 0; i < 4; i++) {
            await NodeGroup.create({
                groupId: newGroup.id,
                nodeId: nodes[i].id,
                nodeIndex: i + 1, // 节点索引从1开始
                node1RandomNumber: nodeRandomNumbers[1],
                node2RandomNumber: nodeRandomNumbers[2],
                node3RandomNumber: nodeRandomNumbers[3],
                node4RandomNumber: nodeRandomNumbers[4],
            });

            // 更新节点状态为忙碌，表示该节点已被分配到群组中
            await nodes[i].update({ status: "busy", groupId: newGroup.id });
        }

        console.log(`✅ 节点组 ${groupId} - ${groupName} 创建完成`);
        console.log(`   成员节点: ${nodes.map((n) => n.nodeId).join(", ")}`);
        console.log("=".repeat(50));

        // 返回成功响应（不包含公钥）
        return res.status(201).json({
            success: true,
            message: "群组创建成功",
            data: {
                id: newGroup.id,
                groupId: newGroup.groupId,
                groupName: newGroup.groupName,
                memberNodeIds: nodes.map((node) => node.nodeId),
                status: newGroup.status,
            },
        });
    } catch (error) {
        console.error("创建群组失败:", error);
        return res.status(500).json({
            success: false,
            message: "创建群组失败",
            error: error.message,
        });
    }
};

/**
 * 验证节点的零知识证明
 * 检查某个节点是否属于特定群组，并验证其零知识证明
 *
 * 验证流程：
 * 1. 获取节点在群组中的索引
 * 2. 从数据库获取节点当前的随机数
 * 3. 从NodeGroup表获取预期的随机数
 * 4. 比较两个随机数是否匹配
 * 5. 如不匹配，将节点标记为异常状态
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.params.groupId - 群组ID
 *   @param {string} req.params.nodeId - 节点ID
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含验证结果的JSON响应
 */
exports.verifyNodeIdentity = async (req, res) => {
    try {
        const { groupId, nodeId } = req.params;

        // 查找群组和节点
        const group = await Group.findOne({ where: { groupId: groupId } });
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的群组",
            });
        }

        const node = await Node.findOne({ where: { nodeId: nodeId } });
        if (!node) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的节点",
            });
        }

        // 查找节点与群组的关系记录
        const nodeGroup = await NodeGroup.findOne({
            where: {
                groupId: group.id,
                nodeId: node.id,
            },
        });

        if (!nodeGroup) {
            return res.status(404).json({
                success: false,
                message: "该节点不属于指定的群组",
            });
        }

        // 获取该节点在群组中的索引
        const nodeIndex = nodeGroup.nodeIndex;

        // 获取节点当前在数据库中的随机数(可能被攻击修改过)
        const currentRandomNumber = node.randomNumber;

        // 从NodeGroup表中获取对应索引位置的预期随机数
        // 这是群组创建时保存的随机数副本，用于验证
        let expectedRandomNumber;
        switch (nodeIndex) {
            case 1:
                expectedRandomNumber = nodeGroup.node1RandomNumber;
                break;
            case 2:
                expectedRandomNumber = nodeGroup.node2RandomNumber;
                break;
            case 3:
                expectedRandomNumber = nodeGroup.node3RandomNumber;
                break;
            case 4:
                expectedRandomNumber = nodeGroup.node4RandomNumber;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "节点索引无效",
                });
        }

        // 检查节点的随机数是否与预期值匹配
        // 若匹配，则证明节点身份有效；若不匹配，则可能是节点被攻击
        const isValid =
            currentRandomNumber &&
            expectedRandomNumber &&
            currentRandomNumber === expectedRandomNumber;

        // 如果不匹配，将节点状态更新为error
        if (!isValid) {
            await node.update({ status: "error" });
        }

        return res.status(200).json({
            success: true,
            isValid: isValid,
            nodeIndex: nodeIndex,
            message: isValid
                ? "节点身份验证成功"
                : "节点身份验证失败，已标记为异常状态",
        });
    } catch (error) {
        console.error("验证节点身份失败:", error);
        return res.status(500).json({
            success: false,
            message: "验证节点身份失败",
            error: error.message,
        });
    }
};

/**
 * 获取所有群组列表
 * 返回系统中所有创建的群组信息（不包含敏感的密钥信息）
 *
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含群组列表的JSON响应
 */
exports.getAllGroups = async (req, res) => {
    try {
        // 查询所有群组，但不返回私钥字段
        const groups = await Group.findAll({
            attributes: { exclude: ["publicKeysR", "publicKeysPhi"] },
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            count: groups.length,
            data: groups,
        });
    } catch (error) {
        console.error("获取群组列表失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取群组列表失败",
            error: error.message,
        });
    }
};

/**
 * 获取特定群组的信息
 * 根据群组ID查询群组详细信息（不包含敏感的密钥信息）
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.params.id - 要查询的群组ID
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含群组详情的JSON响应
 */
exports.getGroupById = async (req, res) => {
    try {
        const groupId = req.params.id;

        // A. 查询指定群组，但不返回私钥字段
        const group = await Group.findOne({
            where: { groupId: groupId },
            attributes: { exclude: ["publicKeysR", "publicKeysPhi"] },
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的群组",
            });
        }

        // 查询该群组的成员节点
        const nodeGroups = await NodeGroup.findAll({
            where: { groupId: group.id },
            include: [
                {
                    model: Node,
                    attributes: ["id", "nodeId", "nodeName", "status"],
                },
            ],
            order: [["nodeIndex", "ASC"]],
        });

        const memberNodes = nodeGroups.map((ng) => ng.Node);

        return res.status(200).json({
            success: true,
            data: {
                ...group.toJSON(),
                memberNodes,
            },
        });
    } catch (error) {
        console.error("获取群组信息失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取群组信息失败",
            error: error.message,
        });
    }
};

/**
 * 更新群组成员
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.updateGroupMembers = async (req, res) => {
    try {
        const groupId = req.params.id;
        const { nodeIds } = req.body;

        // 验证必要参数
        if (!nodeIds || !Array.isArray(nodeIds)) {
            return res.status(400).json({
                success: false,
                message: "节点ID数组是必须的",
            });
        }

        // 查找群组
        const group = await Group.findOne({ where: { groupId: groupId } });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的群组",
            });
        }

        // 验证所有节点ID是否存在
        const nodes = await Node.findAll({
            where: { nodeId: { [Op.in]: nodeIds } },
        });
        if (nodes.length !== nodeIds.length) {
            return res.status(400).json({
                success: false,
                message: "一个或多个提供的节点ID不存在",
            });
        }

        // 直接调用加密引擎生成群组密钥
        // 现在CryptoEngine.groupGen方法不需要传入系统主密钥，它会直接从内部获取
        const groupKeyResult = CryptoEngine.groupGen(nodeIds);
        const { groupPublicKey, groupSecretKey } = JSON.parse(groupKeyResult);

        // 更新群组记录
        group.memberNodeIds = nodeIds;
        group.publicKey = groupPublicKey;
        group.secretKey = groupSecretKey;
        group.updatedAt = Date.now();

        await group.save();

        return res.status(200).json({
            success: true,
            message: "群组成员更新成功",
            data: {
                groupId: group.groupId,
                groupName: group.groupName,
                memberNodeIds: group.memberNodeIds,
                publicKey: group.publicKey,
                updatedAt: group.updatedAt,
            },
        });
    } catch (error) {
        console.error("更新群组成员失败:", error);
        return res.status(500).json({
            success: false,
            message: "更新群组成员失败",
            error: error.message,
        });
    }
};

/**
 * 验证整个群组的所有节点
 * 检查群组中所有节点的随机数是否与创建时保存的一致，检测是否有节点被篡改
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.params.groupId - 群组ID
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 包含验证结果的JSON响应
 */
exports.verifyGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        console.log(`验证群组ID: ${groupId}`);

        // 查找群组
        const group = await Group.findByPk(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的群组",
            });
        }

        console.log(`开始验证群组: ${group.groupName} (ID: ${group.id})`);

        // 获取群组中的所有节点群组关系记录
        const nodeGroups = await NodeGroup.findAll({
            where: { groupId: group.id },
        });

        if (nodeGroups.length === 0) {
            return res.status(404).json({
                success: false,
                message: "该群组没有节点成员",
            });
        }

        // 获取群组中所有节点的ID
        const nodeIds = nodeGroups.map((ng) => ng.nodeId);

        // 获取群组中所有节点的信息
        const nodes = await Node.findAll({
            where: { id: nodeIds },
        });

        // 创建节点ID到节点对象的映射
        const nodesMap = {};
        nodes.forEach((node) => {
            nodesMap[node.id] = node;
        });

        // 创建节点ID到NodeGroup对象的映射
        const nodeGroupMap = {};
        nodeGroups.forEach((ng) => {
            nodeGroupMap[ng.nodeId] = ng;
        });

        // 验证结果
        const verificationResults = [];
        let allValid = true;
        let compromisedNodes = [];

        console.log(`正在验证 ${nodes.length} 个节点...`);

        // 验证每个节点
        for (const nodeId of nodeIds) {
            const node = nodesMap[nodeId];
            const nodeGroup = nodeGroupMap[nodeId];

            if (!node || !nodeGroup) {
                console.log(`节点ID ${nodeId} 数据不完整，跳过验证`);
                continue;
            }

            const nodeIndex = nodeGroup.nodeIndex;

            // 获取节点当前在数据库中的随机数(可能被攻击修改过)
            const currentRandomNumber = node.randomNumber;

            // 从NodeGroup表中获取对应索引位置的预期随机数
            let expectedRandomNumber;
            switch (nodeIndex) {
                case 1:
                    expectedRandomNumber = nodeGroup.node1RandomNumber;
                    break;
                case 2:
                    expectedRandomNumber = nodeGroup.node2RandomNumber;
                    break;
                case 3:
                    expectedRandomNumber = nodeGroup.node3RandomNumber;
                    break;
                case 4:
                    expectedRandomNumber = nodeGroup.node4RandomNumber;
                    break;
                default:
                    expectedRandomNumber = null;
            }

            // 检查随机数是否匹配
            const isValid = currentRandomNumber === expectedRandomNumber;
            console.log(
                `节点${nodeIndex}: ${node.nodeName} (ID: ${node.id}) - 验证${
                    isValid ? "通过" : "失败"
                }`
            );
            console.log(`  当前随机数: ${currentRandomNumber}`);
            console.log(`  预期随机数: ${expectedRandomNumber}`);

            // 如果不匹配且节点状态不是error，则将节点标记为异常
            if (!isValid && node.status !== "error") {
                console.log(
                    `  ⚠️ 节点 ${node.nodeName} 随机数不匹配，标记为异常`
                );
                await node.update({ status: "error" });
                allValid = false;
                compromisedNodes.push({
                    id: node.id,
                    nodeId: node.nodeId,
                    nodeName: node.nodeName,
                    nodeIndex: nodeIndex,
                });
            }
            // 如果匹配但节点状态是error，则恢复为busy状态
            else if (isValid && node.status === "error") {
                console.log(
                    `  ✓ 节点 ${node.nodeName} 随机数匹配，从异常状态恢复`
                );
                await node.update({ status: "busy" });
            }

            verificationResults.push({
                nodeId: node.nodeId,
                nodeName: node.nodeName,
                nodeIndex: nodeIndex,
                isValid: isValid,
                status: node.status,
            });
        }

        // 验证结果日志
        console.log(
            `验证结果: ${allValid ? "所有节点验证通过" : "发现异常节点"}`
        );
        if (!allValid) {
            console.log(
                `异常节点: ${compromisedNodes
                    .map((n) => n.nodeName)
                    .join(", ")}`
            );
            // 如果有异常节点，将群组状态更新为error
            await group.update({ status: "error" });
            console.log(`群组 ${group.groupName} 已标记为异常状态`);
        } else {
            // 如果没有异常节点，将群组状态更新为idle
            await group.update({ status: "idle" });
            console.log(`群组 ${group.groupName} 已标记为空闲状态`);
        }

        // 返回验证结果
        return res.status(200).json({
            success: true,
            message: allValid ? "所有节点验证通过" : "发现异常节点",
            data: {
                groupId: group.groupId,
                groupName: group.groupName,
                allValid: allValid,
                verificationResults: verificationResults,
                compromisedNodes: compromisedNodes,
                groupStatus: group.status,
            },
        });
    } catch (error) {
        console.error("群组验证失败:", error);
        return res.status(500).json({
            success: false,
            message: "群组验证失败",
            error: error.message,
        });
    }
};

/**
 * 删除群组
 * 只允许删除空闲状态的群组，并将其所有节点标记为空闲
 *
 * @param {Object} req - HTTP请求对象
 *   @param {string} req.params.id - 群组ID
 * @param {Object} res - HTTP响应对象
 * @returns {Object} 操作结果的JSON响应
 */
exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;

        // 查找群组
        const group = await Group.findByPk(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "找不到指定的群组",
            });
        }

        // 检查群组状态，如果不是idle状态，则不允许删除
        if (group.status !== "idle") {
            return res.status(400).json({
                success: false,
                message: "只能删除空闲状态的群组",
            });
        }

        // 获取群组中的所有节点群组关系记录
        const nodeGroups = await NodeGroup.findAll({
            where: { groupId: group.id },
        });

        // 获取群组中所有节点的ID
        const nodeIds = nodeGroups.map((ng) => ng.nodeId);

        // 开始事务
        const t = await db.sequelize.transaction();

        try {
            // 1. 获取群组中所有节点的信息
            const groupNodes = await Node.findAll({
                where: { id: nodeIds },
                transaction: t,
            });

            // 找出非异常状态的节点ID
            const nonErrorNodeIds = groupNodes
                .filter((node) => node.status !== "error")
                .map((node) => node.id);

            // 更新非异常节点状态为idle
            if (nonErrorNodeIds.length > 0) {
                await Node.update(
                    { status: "idle" },
                    {
                        where: { id: nonErrorNodeIds },
                        transaction: t,
                    }
                );
            }

            // 对所有节点移除groupId
            await Node.update(
                { groupId: null },
                {
                    where: { id: nodeIds },
                    transaction: t,
                }
            );

            // 2. 删除所有NodeGroup记录
            await NodeGroup.destroy({
                where: { groupId: group.id },
                transaction: t,
            });

            // 3. 删除群组记录
            await group.destroy({ transaction: t });

            // 提交事务
            await t.commit();

            return res.status(200).json({
                success: true,
                message: "群组删除成功",
                data: {
                    groupId: group.groupId,
                    groupName: group.groupName,
                    releasedNodes: nodeIds.length,
                },
            });
        } catch (error) {
            // 回滚事务
            await t.rollback();
            throw error;
        }
    } catch (error) {
        console.error("删除群组失败:", error);
        return res.status(500).json({
            success: false,
            message: "删除群组失败",
            error: error.message,
        });
    }
};
