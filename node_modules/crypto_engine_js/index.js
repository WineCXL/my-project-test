/**
 * JavaScript版本的加密引擎
 * 模拟MIRACL库中的双线性配对功能，实现与论文方案一致的系统
 * 基于《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》
 */

const CryptoEngineImpl = require("./crypto_engine_impl");

// 修改为真正的单例实现
let engineInstance = null;

// 获取单例实例的函数
function getEngine() {
    if (!engineInstance) {
        console.log("加密引擎初始化 - 首次创建实例");
        engineInstance = new CryptoEngineImpl();
    }
    return engineInstance;
}

module.exports = {
    /**
     * 初始化加密引擎
     * @param {number} securityLevel - 安全级别（通常为128）
     * @returns {boolean} - 初始化是否成功
     */
    systemSetup: (securityLevel) => {
        try {
            return getEngine().systemSetup(securityLevel);
        } catch (error) {
            console.error("系统初始化错误:", error);
            return false;
        }
    },

    /**
     * 注册一个新节点
     * @param {string} nodeId - 节点ID
     * @returns {Object} - 包含节点ID和密钥的对象
     */
    nodeRegistration: (nodeId) => {
        try {
            return getEngine().nodeRegistration(nodeId);
        } catch (error) {
            console.error("节点注册错误:", error);
            return { id: "", key: "" };
        }
    },

    /**
     * 创建一个新群组
     * @param {Array<string>} nodeIds - 组成群组的节点ID数组
     * @returns {string} - 群组密钥
     */
    groupGeneration: (nodeIds) => {
        try {
            return getEngine().groupGeneration(nodeIds);
        } catch (error) {
            console.error("群组生成错误:", error);
            return "";
        }
    },

    /**
     * 生成随机原始关键词
     * @returns {string} - 随机生成的关键词
     */
    generateOriginalKeyword: () => {
        try {
            return getEngine().generateOriginalKeyword();
        } catch (error) {
            console.error("生成关键词错误:", error);
            return "关键词生成失败";
        }
    },

    /**
     * 生成搜索令牌
     * @param {string} keyword - 关键词
     * @param {string} groupId - 群组ID
     * @returns {string} - 搜索令牌
     */
    searchTokenGeneration: (keyword, groupId) => {
        try {
            return getEngine().searchTokenGeneration(keyword, groupId);
        } catch (error) {
            console.error("令牌生成错误:", error);
            return "";
        }
    },

    /**
     * 关键词封装
     * @param {string} keyword - 关键词
     * @param {string} metadata - 元数据
     * @returns {string} - 封装后的数据
     */
    encapsulateKeyword: (keyword, metadata) => {
        try {
            return getEngine().encapsulateKeyword(keyword, metadata);
        } catch (error) {
            console.error("关键词封装错误:", error);
            return "";
        }
    },

    /**
     * 验证关键词匹配
     * @param {string} trapdoor - 陷门（搜索令牌）
     * @param {string} encryptedMetadata - 加密的元数据
     * @returns {boolean} - 是否匹配
     */
    verifyKeywordMatch: (trapdoor, encryptedMetadata) => {
        try {
            return getEngine().verifyKeywordMatch(trapdoor, encryptedMetadata);
        } catch (error) {
            console.error("关键词匹配验证错误:", error);
            return false;
        }
    },

    /**
     * 根据关键词匹配结果分配资源
     * @param {string} trapdoor - 陷门（搜索令牌）
     * @param {Array<string>} encryptedMetadataList - 加密元数据列表
     * @param {Array<string>} edgeNodeIds - 边缘节点ID列表
     * @returns {string} - 资源分配结果
     */
    allocateResourcesAccordingToKeywords: (
        trapdoor,
        encryptedMetadataList,
        edgeNodeIds
    ) => {
        try {
            return getEngine().allocateResourcesAccordingToKeywords(
                trapdoor,
                encryptedMetadataList,
                edgeNodeIds
            );
        } catch (error) {
            console.error("资源分配错误:", error);
            return "{}";
        }
    },
};
