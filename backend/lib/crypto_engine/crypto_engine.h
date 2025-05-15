#ifndef CRYPTO_ENGINE_H
#define CRYPTO_ENGINE_H

#include <string>
#include <vector>
#include <memory>

// 前置声明，避免暴露MIRACL内部类型
class CryptoEngineImpl;

/**
 * CryptoEngine类
 * 封装MIRACL密码库的功能，提供密码学操作接口
 */
class CryptoEngine
{
public:
    /**
     * 构造函数 - 初始化CryptoEngine
     */
    CryptoEngine();

    /**
     * 析构函数 - 释放资源
     */
    ~CryptoEngine();

    /**
     * 系统初始化 - 设置系统参数
     *
     * @param securityLevel 安全级别(默认128位)
     * @return 是否成功初始化系统
     */
    bool systemSetup(int securityLevel = 128);

    /**
     * 节点注册 - 为节点生成密钥
     *
     * @param nodeId 节点ID
     * @return 包含私钥和公钥的对象
     */
    std::pair<std::string, std::string> nodeRegistration(const std::string &nodeId);

    /**
     * 群组生成 - 基于节点列表生成群组
     *
     * @param nodeIds 群组中的节点ID列表
     * @return 群组ID
     */
    std::string groupGeneration(const std::vector<std::string> &nodeIds);

    /**
     * 随机关键词生成 - 生成随机关键词
     *
     * @return 随机生成的关键词
     */
    std::string generateKeyword();

    /**
     * 陷门生成 - 生成用于搜索的陷门
     *
     * @param keyword 关键词
     * @param groupId 群组ID
     * @return 搜索陷门
     */
    std::string searchTokenGeneration(const std::string &keyword, const std::string &groupId);

    /**
     * 关键词封装 - 加密关键词
     *
     * @param keyword 关键词
     * @param groupId 群组ID
     * @return 封装后的数据
     */
    std::string encapsulateKeyword(const std::string &keyword, const std::string &groupId);

    /**
     * 验证关键词匹配 - 检查陷门是否匹配加密元数据
     *
     * @param trapdoor 陷门
     * @param encryptedMetadata 加密元数据
     * @return 是否匹配
     */
    bool verifyKeywordMatch(const std::string &trapdoor, const std::string &encryptedMetadata);

    /**
     * 根据关键词匹配结果分配资源
     *
     * @param trapdoor 陷门
     * @param encryptedMetadataList 加密元数据列表
     * @param edgeNodeIds 边缘节点ID列表
     * @return 分配的边缘节点ID
     */
    std::string allocateResourcesAccordingToKeywords(const std::string &trapdoor,
                                                     const std::vector<std::string> &encryptedMetadataList,
                                                     const std::vector<std::string> &edgeNodeIds);

private:
    // 使用PIMPL模式，隐藏实现细节
    std::unique_ptr<CryptoEngineImpl> impl;
};

#endif // CRYPTO_ENGINE_H
