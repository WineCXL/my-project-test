#include "crypto_engine.h"
#include "crypto_engine_impl.h"
#include <iostream>

CryptoEngine::CryptoEngine()
{
    impl = std::make_unique<CryptoEngineImpl>();
}

CryptoEngine::~CryptoEngine()
{
    // unique_ptr会自动管理impl的生命周期
}

bool CryptoEngine::systemSetup(int securityLevel)
{
    try
    {
        return impl->systemSetup(securityLevel);
    }
    catch (const std::exception &e)
    {
        std::cerr << "系统初始化错误: " << e.what() << std::endl;
        return false;
    }
}

std::pair<std::string, std::string> CryptoEngine::nodeRegistration(const std::string &nodeId)
{
    try
    {
        return impl->nodeRegistration(nodeId);
    }
    catch (const std::exception &e)
    {
        std::cerr << "节点注册错误: " << e.what() << std::endl;
        return std::make_pair("", "");
    }
}

std::string CryptoEngine::groupGeneration(const std::vector<std::string> &nodeIds)
{
    try
    {
        return impl->groupGeneration(nodeIds);
    }
    catch (const std::exception &e)
    {
        std::cerr << "群组生成错误: " << e.what() << std::endl;
        return "";
    }
}

std::string CryptoEngine::generateKeyword()
{
    try
    {
        return impl->generateKeyword();
    }
    catch (const std::exception &e)
    {
        std::cerr << "关键词生成错误: " << e.what() << std::endl;
        return "";
    }
}

std::string CryptoEngine::searchTokenGeneration(const std::string &keyword, const std::string &groupId)
{
    try
    {
        return impl->searchTokenGeneration(keyword, groupId);
    }
    catch (const std::exception &e)
    {
        std::cerr << "陷门生成错误: " << e.what() << std::endl;
        return "";
    }
}

std::string CryptoEngine::encapsulateKeyword(const std::string &keyword, const std::string &groupId)
{
    try
    {
        return impl->encapsulateKeyword(keyword, groupId);
    }
    catch (const std::exception &e)
    {
        std::cerr << "关键词封装错误: " << e.what() << std::endl;
        return "";
    }
}

bool CryptoEngine::verifyKeywordMatch(const std::string &trapdoor, const std::string &encryptedMetadata)
{
    try
    {
        return impl->verifyKeywordMatch(trapdoor, encryptedMetadata);
    }
    catch (const std::exception &e)
    {
        std::cerr << "关键词匹配验证错误: " << e.what() << std::endl;
        return false;
    }
}

std::string CryptoEngine::allocateResourcesAccordingToKeywords(
    const std::string &trapdoor,
    const std::vector<std::string> &encryptedMetadataList,
    const std::vector<std::string> &edgeNodeIds)
{
    try
    {
        return impl->allocateResourcesAccordingToKeywords(trapdoor, encryptedMetadataList, edgeNodeIds);
    }
    catch (const std::exception &e)
    {
        std::cerr << "资源分配错误: " << e.what() << std::endl;
        return "";
    }
}
