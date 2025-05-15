/**
 * 加密库 - 实现与MIRACL库相关的加密功能
 * 包括陷门生成、搜索等功能
 */

const crypto = require("crypto");

/*
// 尝试使用C++版本的加密引擎，如果失败则使用JavaScript版本
let cryptoEngine;
try {
  // 尝试加载C++原生模块
    cryptoEngine = require('./crypto_engine');
    console.log('使用C++版本的加密引擎');
} catch (error) {
  // 如果加载失败，使用JavaScript版本
    cryptoEngine = require('./crypto_engine_js');
    console.log('使用JavaScript版本的加密引擎');
}
*/

// 直接使用JavaScript版本的加密引擎
cryptoEngine = require("./crypto_engine_js");
//console.log("使用JavaScript版本的加密引擎");

// 导出加密引擎
module.exports = cryptoEngine;

/**
 * 生成陷门值
 * @param {string} keyword - 搜索关键词
 * @param {string} masterPublicKey - 群组主公钥
 * @returns {Object} - 包含陷门值的对象
 */
exports.generateTrapdoor = async (keyword, masterPublicKey) => {
    try {
        // 如果crypto_engine实现了trapdoorGen功能，则调用它
        if (crypto_engine && typeof crypto_engine.trapdoorGen === "function") {
            return await crypto_engine.trapdoorGen(keyword, masterPublicKey);
        }

        // 否则使用模拟实现
        console.log("使用模拟的陷门生成函数");

        // 使用SHA-256哈希关键词
        const hash = crypto.createHash("sha256");
        hash.update(keyword);
        const keywordHash = hash.digest("hex");

        // 模拟与主公钥的计算
        // 在实际实现中，这里应该是基于双线性对的计算
        const randomValue = crypto.randomBytes(16).toString("hex");

        // 模拟陷门结构
        return {
            keywordHash: keywordHash,
            randomPart: randomValue,
            // 模拟使用公钥加密的部分
            encryptedPart: Buffer.from(keywordHash + randomValue).toString(
                "base64"
            ),
        };
    } catch (error) {
        console.error("陷门生成错误:", error);
        throw new Error("生成陷门时发生错误: " + error.message);
    }
};

/**
 * 使用陷门搜索资源
 * @param {Array} resources - 资源列表
 * @param {Object} trapdoorValue - 陷门值
 * @returns {Array} - 匹配的资源列表
 */
exports.searchWithTrapdoor = async (resources, trapdoorValue) => {
    try {
        // 如果crypto_engine实现了searchWithTrapdoor功能，则调用它
        if (
            crypto_engine &&
            typeof crypto_engine.searchWithTrapdoor === "function"
        ) {
            return await crypto_engine.searchWithTrapdoor(
                resources,
                trapdoorValue
            );
        }

        // 否则使用模拟实现
        console.log("使用模拟的陷门搜索函数");

        // 提取关键字哈希
        const { keywordHash } = trapdoorValue;

        // 模拟搜索过程
        // 在实际实现中，这应该是一个基于密码学的搜索过程
        const matchedResources = resources.filter((resource) => {
            try {
                // 检查资源的加密索引是否包含关键词
                // 这里我们假设资源有一个encryptedIndex字段，实际格式可能不同
                const encryptedIndex = resource.encryptedIndex
                    ? JSON.parse(resource.encryptedIndex)
                    : [];

                // 模拟测试匹配
                // 在实际实现中，这应该使用密码学验证而不是直接比较
                return encryptedIndex.some((index) => {
                    // 假设索引格式为 { hash: string, ... }
                    return (
                        index.hash &&
                        index.hash.includes(keywordHash.substring(0, 10))
                    );
                });
            } catch (e) {
                console.error(`处理资源 ${resource.id} 时出错:`, e);
                return false;
            }
        });

        return matchedResources;
    } catch (error) {
        console.error("陷门搜索错误:", error);
        throw new Error("使用陷门搜索时发生错误: " + error.message);
    }
};

/**
 * 生成群组密钥
 * @returns {Object} - 包含群组主密钥和主公钥的对象
 */
exports.generateGroupKeys = () => {
    try {
        // 如果crypto_engine实现了generateGroupKeys功能，则调用它
        if (
            crypto_engine &&
            typeof crypto_engine.generateGroupKeys === "function"
        ) {
            return crypto_engine.generateGroupKeys();
        }

        // 否则使用模拟实现
        console.log("使用模拟的群组密钥生成函数");

        // 生成随机主密钥
        const masterPrivateKey = crypto.randomBytes(32).toString("hex");

        // 基于主密钥派生主公钥 (在实际系统中，这应该是基于椭圆曲线或双线性映射的)
        const masterPublicKey = crypto
            .createHash("sha256")
            .update(masterPrivateKey)
            .digest("hex");

        return {
            masterPrivateKey,
            masterPublicKey,
        };
    } catch (error) {
        console.error("群组密钥生成错误:", error);
        throw new Error("生成群组密钥时发生错误: " + error.message);
    }
};

/**
 * 加密关键词索引
 * @param {string} keyword - 关键词
 * @param {string} masterPublicKey - 群组主公钥
 * @returns {Object} - 加密的关键词索引
 */
exports.encryptKeywordIndex = (keyword, masterPublicKey) => {
    try {
        // 如果crypto_engine实现了encryptKeywordIndex功能，则调用它
        if (
            crypto_engine &&
            typeof crypto_engine.encryptKeywordIndex === "function"
        ) {
            return crypto_engine.encryptKeywordIndex(keyword, masterPublicKey);
        }

        // 否则使用模拟实现
        console.log("使用模拟的关键词索引加密函数");

        // 使用SHA-256哈希关键词
        const hash = crypto.createHash("sha256");
        hash.update(keyword);
        const keywordHash = hash.digest("hex");

        // 生成随机值
        const randomValue = crypto.randomBytes(16).toString("hex");

        // 模拟使用主公钥加密
        // 在实际系统中，这应该使用适当的加密算法
        const encryptedIndex = Buffer.from(
            keywordHash + randomValue + masterPublicKey.substring(0, 10)
        ).toString("base64");

        return {
            hash: keywordHash.substring(0, 10), // 为了演示搜索功能，我们保留哈希的一部分
            encryptedIndex,
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error("关键词索引加密错误:", error);
        throw new Error("加密关键词索引时发生错误: " + error.message);
    }
};

/**
 * 生成加密关键词对(Xj, Yj)
 * @param {string} keyword - 关键词
 * @returns {Object} - 包含X和Y值的对象
 */
exports.generateEncryptedKeywordPair = async (keyword) => {
    try {
        // 如果crypto_engine实现了相关功能，则调用它
        if (
            crypto_engine &&
            typeof crypto_engine.generateEncryptedKeywordPair === "function"
        ) {
            return await crypto_engine.generateEncryptedKeywordPair(keyword);
        }

        // 否则使用模拟实现
        console.log("使用模拟的加密关键词对生成函数");

        // 计算X值 (这里使用哈希函数模拟)
        const hashX = crypto.createHash("sha256");
        hashX.update(`X_${keyword}`);
        const X = "0x" + hashX.digest("hex").substring(0, 16);

        // 计算Y值，模拟Y = h3(e(Tml, Xj))
        const hashY = crypto.createHash("sha256");
        hashY.update(`Y_${keyword}`);
        const Y = "0x" + hashY.digest("hex").substring(0, 16);

        return { X, Y };
    } catch (error) {
        console.error("生成加密关键词对错误:", error);
        throw new Error("生成加密关键词对时发生错误: " + error.message);
    }
};

/**
 * 基于论文方案生成陷门
 * @param {string} keyword - 关键词
 * @param {string} userId - 用户ID
 * @returns {string} - 陷门值Tml
 */
exports.generateTrapdoorForKeyword = async (keyword, userId) => {
    try {
        // 如果crypto_engine实现了相关功能，则调用它
        if (
            crypto_engine &&
            typeof crypto_engine.generateTrapdoorForKeyword === "function"
        ) {
            return await crypto_engine.generateTrapdoorForKeyword(
                keyword,
                userId
            );
        }

        // 否则使用模拟实现
        console.log("使用模拟的关键词陷门生成函数");

        // 使用SHA-256哈希生成陷门
        const hash = crypto.createHash("sha256");
        hash.update(`Tml_${keyword}_${userId}`);
        return "0x" + hash.digest("hex").substring(0, 32);
    } catch (error) {
        console.error("生成关键词陷门错误:", error);
        throw new Error("生成关键词陷门时发生错误: " + error.message);
    }
};

/**
 * 验证陷门与加密元数据的匹配
 * @param {string} trapdoor - 陷门值Tml
 * @param {string} encryptedMetadata - 加密元数据JSON字符串
 * @returns {boolean} - 是否匹配
 */
exports.verifyKeywordMatch = async (trapdoor, encryptedMetadata) => {
    try {
        // 如果crypto_engine实现了相关功能，则调用它
        if (
            crypto_engine &&
            typeof crypto_engine.verifyKeywordMatch === "function"
        ) {
            return await crypto_engine.verifyKeywordMatch(
                trapdoor,
                encryptedMetadata
            );
        }

        // 否则使用模拟实现
        console.log("使用模拟的关键词匹配验证函数");

        // 解析元数据
        const metadata =
            typeof encryptedMetadata === "string"
                ? JSON.parse(encryptedMetadata)
                : encryptedMetadata;

        // 提取X和Y值
        const { X, Y } = metadata;

        // 模拟计算 h3(e(Tml, Xj))
        const hash = crypto.createHash("sha256");
        hash.update(`h3_e_${trapdoor}_${X}`);
        const hashResult = "0x" + hash.digest("hex").substring(0, 16);

        // 模拟验证等式 h3(e(Tml, Xj)) =? Yj
        return hashResult === Y;
    } catch (error) {
        console.error("验证关键词匹配错误:", error);
        throw new Error("验证关键词匹配时发生错误: " + error.message);
    }
};

/**
 * 根据关键词匹配进行资源分配
 * @param {string} trapdoor - 陷门值
 * @param {Array<string>} encryptedMetadataList - 加密元数据列表
 * @param {Array<string>} edgeNodeIds - 可用边缘节点ID列表
 * @returns {string} - 资源分配结果JSON字符串
 */
exports.allocateResourcesAccordingToKeywords = async (
    trapdoor,
    encryptedMetadataList,
    edgeNodeIds
) => {
    try {
        // 如果crypto_engine实现了相关功能，则调用它
        if (
            crypto_engine &&
            typeof crypto_engine.allocateResourcesAccordingToKeywords ===
            "function"
        ) {
            return await crypto_engine.allocateResourcesAccordingToKeywords(
                trapdoor,
                encryptedMetadataList,
                edgeNodeIds
            );
        }

        // 否则使用模拟实现
        console.log("使用模拟的资源分配函数");

        // 初始化匹配的元数据列表
        const matchingMetadata = [];

        // 对每个加密元数据执行关键词匹配
        for (const metadata of encryptedMetadataList) {
            const matched = await this.verifyKeywordMatch(trapdoor, metadata);
            if (matched) {
                matchingMetadata.push(metadata);
            }
        }

        // 如果没有匹配的元数据，返回空结果
        if (matchingMetadata.length === 0) {
            return JSON.stringify({
                status: "no_match",
                message: "No matching resources found",
            });
        }

        // 构建资源分配结果
        const allocations = [];

        // 对每个匹配的元数据，分配到合适的边缘节点
        for (let i = 0; i < matchingMetadata.length; i++) {
            // 解析元数据
            const metadata =
                typeof matchingMetadata[i] === "string"
                    ? JSON.parse(matchingMetadata[i])
                    : matchingMetadata[i];

            // 提取标签信息
            const tag = metadata.tag || `resource_${i}`;

            // 选择合适的边缘节点
            let selectedNodeId;
            if (edgeNodeIds && edgeNodeIds.length > 0) {
                // 简单地选择第一个可用节点，实际应用中应该基于负载均衡算法选择
                selectedNodeId = edgeNodeIds[0];
            } else {
                // 如果没有可用的边缘节点，分配给"cloud"
                selectedNodeId = "cloud";
            }

            // 添加分配结果
            allocations.push({
                id: i + 1,
                metadataId: i.toString(),
                tag: tag,
                nodeId: selectedNodeId,
                status: "allocated",
                timestamp: new Date().toISOString(),
            });
        }

        // 返回最终资源分配结果
        return JSON.stringify({
            status: "success",
            allocations: allocations,
        });
    } catch (error) {
        console.error("资源分配错误:", error);
        throw new Error("执行资源分配时发生错误: " + error.message);
    }
};
