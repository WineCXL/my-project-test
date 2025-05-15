#pragma once

// 确保在包含任何头文件前取消可能的宏定义
#ifdef compare
#undef compare
#endif

#ifdef mr_compare
#undef mr_compare
#endif

#include <string>
#include <vector>
#include <map>
#include <memory>

// 在包含MIRACL头文件前，定义必要的宏
// 移除 MR_GENERIC_AND_STATIC 宏定义，因为它导致mirsys函数参数不匹配
#define MR_PAIRING_SS2   // 使用SS2类型的配对，提供AES-128级别的安全性
#define AES_SECURITY 128 // 设置AES安全级别为128位

// 在包含MIRACL头文件前，取消任何可能的compare宏定义
#ifdef compare
#undef compare
#endif

// 正确引用MIRACL库头文件
#include "../../../libs/miracl/include/mirdef.h"
#include "../../../libs/miracl/include/miracl.h"
#include "../../../libs/miracl/include/big.h"
#include "../../../libs/miracl/include/ec2.h"
#include "../../../libs/miracl/include/gf2m.h"
#include "../../../libs/miracl/include/pairing_1.h" // 确保包含此文件，它定义了G1, G2, GT等类型

// 取消MIRACL库中定义的宏，避免与std::string::compare冲突
#undef compare
#undef mr_compare

// 包含主类定义
#include "crypto_engine.h"

/**
 * @brief 加密引擎实现类
 *
 * 该类提供加密、解密、搜索令牌生成和搜索等功能的实际实现。
 */
class CryptoEngineImpl
{
public:
    /**
     * @brief 构造函数
     */
    CryptoEngineImpl();

    /**
     * @brief 析构函数
     */
    ~CryptoEngineImpl();

    // 禁止拷贝构造和赋值
    CryptoEngineImpl(const CryptoEngineImpl &) = delete;
    CryptoEngineImpl &operator=(const CryptoEngineImpl &) = delete;

    /**
     * @brief 初始化加密引擎
     * @param securityLevel 安全级别
     * @return 初始化是否成功
     */
    bool systemSetup(int securityLevel = 128);

    /**
     * @brief 注册一个新节点
     * @param nodeId 节点ID
     * @return 为该节点生成的密钥对
     */
    std::pair<std::string, std::string> nodeRegistration(const std::string &nodeId);

    /**
     * @brief 创建一个新群组
     * @param nodeIds 群组成员节点ID列表
     * @return 群组ID
     */
    std::string groupGeneration(const std::vector<std::string> &nodeIds);

    /**
     * @brief 生成随机关键字
     * @return 随机生成的关键字
     */
    std::string generateKeyword();

    /**
     * @brief 生成搜索令牌（陷门）
     * @param keyword 关键词
     * @param groupId 群组ID
     * @return 陷门值
     */
    std::string searchTokenGeneration(const std::string &keyword, const std::string &groupId);

    /**
     * @brief 验证关键词匹配
     * @param trapdoor 陷门值
     * @param encryptedMetadata 加密的元数据
     * @return 是否匹配
     */
    bool verifyKeywordMatch(const std::string &trapdoor, const std::string &encryptedMetadata);

    /**
     * @brief 关键词封装
     * @param keyword 关键词
     * @param groupId 群组ID
     * @return 封装后的数据
     */
    std::string encapsulateKeyword(const std::string &keyword, const std::string &groupId);

    /**
     * @brief 根据关键词匹配结果分配资源
     * @param trapdoor 陷门值
     * @param encryptedMetadataList 加密元数据列表
     * @param edgeNodeIds 可用边缘节点列表
     * @return 分配的边缘节点ID
     */
    std::string allocateResourcesAccordingToKeywords(
        const std::string &trapdoor,
        const std::vector<std::string> &encryptedMetadataList,
        const std::vector<std::string> &edgeNodeIds);

private:
    // 隐藏实现细节
    class PrivateImpl;
    std::unique_ptr<PrivateImpl> pImpl;
};
