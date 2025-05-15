#define MR_PAIRING_SS2   // 使用SS2类型的配对
#define AES_SECURITY 128 // AES-128安全级别

#include "crypto_engine_impl.h"
#include <iostream>
#include <ctime>
#include <cstring>
#include <vector>
#include <mutex>
#include <thread>
#include <chrono>
#include <map>
#include <unordered_map>
#include <sstream>

// 包含MIRACL库头文件
#include "../../../libs/miracl/include/mirdef.h"
#include "../../../libs/miracl/include/miracl.h"
#include "../../../libs/miracl/include/big.h"
#include "../../../libs/miracl/include/ec2.h"
#include "../../../libs/miracl/include/gf2m.h"
#include "../../../libs/miracl/include/pairing_1.h"

using namespace std;

// PrivateImpl类实现所有内部功能
class CryptoEngineImpl::PrivateImpl
{
private:
    // 密码学参数
    PFC pfc; // 配对友好曲线
    G1 P;    // 基点
    G1 Ppub; // 系统公钥
    Big s;   // 系统主密钥

    // 状态管理
    bool initialized; // 是否已初始化
    mutex mtx;        // 并发互斥锁

    // 映射表
    map<string, G1> nodePrivateKeys;          // 节点ID -> 节点私钥
    map<string, G1> nodePublicKeys;           // 节点ID -> 节点公钥qi
    map<string, Big> nodeRandomValues;        // 节点ID -> 随机值xi
    map<string, vector<string>> groupMembers; // 群组ID -> 成员节点ID列表
    map<string, G1> groupPublicKeysR;         // 群组ID -> 群组公钥r部分
    map<string, GT> groupPublicKeysPhi;       // 群组ID -> 群组公钥Phi部分

    // 缓存映射
    map<string, G1> trapdoorCache;       // trapdoorId -> 陷门G1元素
    map<string, pair<G1, Big>> encCache; // encId -> (X, Y)元素对

public:
    // 构造函数
    PrivateImpl() : pfc(AES_SECURITY), initialized(false)
    {
        // 初始化PFC对象时传入安全级别参数
    }

    // 析构函数
    ~PrivateImpl()
    {
        // 清理资源
    }

    // 1. 系统初始化 (Setup)
    bool systemSetup(int securityLevel)
    {
        lock_guard<mutex> lock(mtx);

        try
        {
            // 已初始化则直接返回
            if (initialized)
            {
                return true;
            }

            // 初始化随机数生成器
            time_t seed;
            time(&seed);
            irand((long)seed);

            // 随机选择基点P
            pfc.random(P);

            // 选择系统主密钥s
            pfc.random(s);
            // 确保s不为0
            while (s == 0)
            {
                pfc.random(s);
            }

            // 计算系统公钥 Ppub = s*P
            Ppub = pfc.mult(P, s);

        initialized = true;
            cout << "系统初始化完成，安全级别: " << securityLevel << endl;
            return true;
        }
        catch (const exception &e)
        {
            cerr << "系统初始化失败: " << e.what() << endl;
            return false;
        }
    }

    // 2. 节点注册 (NodeReg)
    pair<string, string> nodeRegistration(const string &nodeId)
    {
        lock_guard<mutex> lock(mtx);

        if (!initialized)
        {
            cerr << "错误: 系统未初始化" << endl;
            return make_pair("", "");
        }

        try
        {
            G1 qi;
            char idStr[256] = {0};
            strcpy(idStr, nodeId.c_str());
            pfc.hash_and_map(qi, idStr);

            // 计算节点私钥 si = s*qi
            G1 si = pfc.mult(qi, s);

            // 生成随机数xi (将在群组生成阶段使用)
            Big xi;
            pfc.random(xi);
            while (xi == 0)
            {
                pfc.random(xi);
            }

            // 存储节点公钥、私钥和随机值
            nodePublicKeys[nodeId] = qi;
            nodePrivateKeys[nodeId] = si;
            nodeRandomValues[nodeId] = xi;

            // 计算私钥的哈希值作为字符串返回
            pfc.start_hash();
            pfc.add_to_hash(si);
            Big si_hash = pfc.finish_hash_to_group();

            // 将私钥哈希值转换为字符串
            stringstream ss;
            ss << si_hash;
            string privateKeyStr = ss.str();

            return make_pair(nodeId, privateKeyStr);
        }
        catch (const exception &e)
        {
            cerr << "节点注册失败: " << e.what() << endl;
            return make_pair("", "");
        }
    }

    // 3. 群组生成 (GroupGen)
    string groupGeneration(const vector<string> &nodeIds)
    {
        lock_guard<mutex> lock(mtx);

        if (!initialized)
        {
            cerr << "错误: 系统未初始化" << endl;
            return "";
        }

        try
        {
            // 生成唯一的群组ID
            string groupId = generateUniqueId();

            // 构建完整群组ID (用于内部计算)
            string fullGroupId = "";
            for (const auto &nodeId : nodeIds)
            {
                // 检查节点是否已注册
                if (nodePrivateKeys.find(nodeId) == nodePrivateKeys.end())
                {
                    cerr << "错误: 节点未注册: " << nodeId << endl;
                    return "";
                }
                fullGroupId += nodeId;
            }

            // 存储群组成员
            groupMembers[groupId] = nodeIds;

            // 计算群公钥组件r = Σri, 其中ri = xi*P
            G1 r;
            bool firstNode = true;
            for (const auto &nodeId : nodeIds)
            {
                Big xi = nodeRandomValues[nodeId];
                G1 ri = pfc.mult(P, xi);

                if (firstNode)
                {
                    r = ri;
                    firstNode = false;
                }
                else
                {
                    r = r + ri;
                }
            }

            // 计算群公钥组件Φ = e(Σqi, Ppub)
            G1 q_sum;
            firstNode = true;
            for (const auto &nodeId : nodeIds)
            {
                if (nodePublicKeys.find(nodeId) == nodePublicKeys.end())
                {
                    // 如果找不到已存储的公钥，重新计算
                    G1 qi;
                    char idStr[256] = {0};
                    strcpy(idStr, nodeId.c_str());
                    pfc.hash_and_map(qi, idStr);
                    nodePublicKeys[nodeId] = qi;
                }

                if (firstNode)
                {
                    q_sum = nodePublicKeys[nodeId];
                    firstNode = false;
                }
                else
                {
                    q_sum = q_sum + nodePublicKeys[nodeId];
                }
            }

            // 计算双线性配对 Φ = e(q_sum, Ppub)
            GT phi = pfc.pairing(q_sum, Ppub);

            // 存储群组公钥和状态
            groupPublicKeysR[groupId] = r;
            groupPublicKeysPhi[groupId] = phi;

            // 返回群组ID
            return groupId;
        }
        catch (const exception &e)
        {
            cerr << "群组生成失败: " << e.what() << endl;
            return "";
        }
    }

    // 4. 随机关键字生成 (KeywordGen)
    string generateKeyword()
    {
        lock_guard<mutex> lock(mtx);

        if (!initialized)
        {
            cerr << "错误: 系统未初始化" << endl;
            return "";
        }

        try
        {
            // 生成随机关键字 (这里简单返回一个随机字符串)
            Big randomValue;
            pfc.random(randomValue);

            stringstream ss;
            ss << randomValue;
    return ss.str();
}
        catch (const exception &e)
        {
            cerr << "关键字生成失败: " << e.what() << endl;
            return "";
        }
    }

    // 5. 消息封装 (Encapsulation) - 关键字加密
    string encapsulateKeyword(const string &keyword, const string &groupId)
    {
        lock_guard<mutex> lock(mtx);

        if (!initialized)
        {
            cerr << "错误: 系统未初始化" << endl;
            return "";
        }

        try
        {
            // 检查群组是否存在
            if (groupPublicKeysR.find(groupId) == groupPublicKeysR.end() ||
                groupPublicKeysPhi.find(groupId) == groupPublicKeysPhi.end())
            {
                cerr << "错误: 群组不存在: " << groupId << endl;
                return "";
            }

            // 获取群组公钥
            G1 r = groupPublicKeysR[groupId];
            GT phi = groupPublicKeysPhi[groupId];

            // 生成随机数y
            Big y;
            pfc.random(y);

            // 计算 X = y*P
            G1 X = pfc.mult(P, y);

            // 构建完整的GroupID||keyword
            string fullGroupId = groupId + keyword;

            // 计算 H2(GroupID||keyword)
            G1 h2_value;
            char gidKeyword[1024] = {0};
            strcpy(gidKeyword, fullGroupId.c_str());
            pfc.hash_and_map(h2_value, gidKeyword);

            // 计算 e(H2(GroupID||keyword), r)
            GT e_h2_r = pfc.pairing(h2_value, r);

            // 计算 e(H2(GroupID||keyword), r) * phi
            GT combined = e_h2_r * phi;

            // 计算 Y = H3(e(H2(GroupID||keyword), r) * phi)^y
            GT powered = pfc.power(combined, y);
            Big Y = pfc.hash_to_aes_key(powered);

            // 生成唯一ID
            string encId = "enc_" + generateUniqueId();

            // 将(X,Y)缓存起来供后续验证
            encCache[encId] = make_pair(X, Y);

            // 序列化为JSON格式返回
            stringstream ss;
            ss << Y;
            string result = "{\"id\":\"" + encId + "\",";
            result += "\"groupId\":\"" + groupId + "\",";
            result += "\"keyword\":\"" + keyword + "\",";
            result += "\"y\":\"" + ss.str() + "\"}";

            return result;
        }
        catch (const exception &e)
        {
            cerr << "关键字封装失败: " << e.what() << endl;
            return "";
        }
    }

    // 6. 授权测试 (AuthTest) - 生成陷门
    string searchTokenGeneration(const string &keyword, const string &groupId)
    {
        lock_guard<mutex> lock(mtx);

        if (!initialized)
        {
            cerr << "错误: 系统未初始化" << endl;
            return "";
        }

        try
        {
            // 检查群组是否存在
            if (groupMembers.find(groupId) == groupMembers.end())
            {
                cerr << "错误: 群组不存在: " << groupId << endl;
                return "";
            }

            // 获取群组成员
            const vector<string> &members = groupMembers[groupId];

            // 构建完整的GroupID||keyword
            string fullGroupId = groupId + keyword;

            // 计算 H2(GroupID||keyword)
            G1 h2_value;
            char gidKeyword[1024] = {0};
            strcpy(gidKeyword, fullGroupId.c_str());
            pfc.hash_and_map(h2_value, gidKeyword);

            // 计算陷门 T = Σ(si + xi*H2(GroupID||keyword))
            G1 T;
            bool firstNode = true;

            for (const auto &nodeId : members)
            {
                // 检查节点是否已注册
                if (nodePrivateKeys.find(nodeId) == nodePrivateKeys.end() ||
                    nodeRandomValues.find(nodeId) == nodeRandomValues.end())
                {
                    cerr << "错误: 节点未注册或缺少随机值: " << nodeId << endl;
                    continue;
                }

                // 获取节点私钥和随机值
                G1 si = nodePrivateKeys[nodeId];
                Big xi = nodeRandomValues[nodeId];

                // 计算 xi*H2(GroupID||keyword)
                G1 xi_h2 = pfc.mult(h2_value, xi);

                // 计算 wi = si + xi*H2(GroupID||keyword)
                G1 wi = si;
                wi = wi + xi_h2;

                // 累加到陷门T
                if (firstNode)
                {
                    T = wi;
                    firstNode = false;
                }
                else
                {
                    T = T + wi;
                }
            }

            // 生成唯一ID
            string trapdoorId = "td_" + generateUniqueId();

            // 缓存陷门T供后续验证
            trapdoorCache[trapdoorId] = T;

            // 返回格式: "trapdoorId|groupId|keyword"
            return trapdoorId + "|" + groupId + "|" + keyword;
        }
        catch (const exception &e)
        {
            cerr << "生成陷门失败: " << e.what() << endl;
            return "";
        }
    }

    // 7. 资源分配 (ResourceAllocation) - 关键字匹配检查
    bool verifyKeywordMatch(const string &trapdoor, const string &encryptedMetadata)
    {
        lock_guard<mutex> lock(mtx);

        if (!initialized)
        {
            cerr << "错误: 系统未初始化" << endl;
            return false;
        }

        try
        {
            // 解析陷门
            string trapdoorId, groupId, keyword;
            if (!parseTrapdoor(trapdoor, trapdoorId, groupId, keyword))
            {
                cerr << "错误: 无效的陷门格式" << endl;
                return false;
            }

            // 解析加密元数据
            string encId;
            if (!parseEncryptedMetadata(encryptedMetadata, encId))
            {
                cerr << "错误: 无效的加密元数据格式" << endl;
                return false;
            }

            // 检查缓存中是否存在对应的T和(X,Y)
            if (trapdoorCache.find(trapdoorId) == trapdoorCache.end() ||
                encCache.find(encId) == encCache.end())
            {
                cerr << "错误: 找不到对应的陷门或加密数据" << endl;
                return false;
            }

            // 获取T和(X,Y)
            G1 T = trapdoorCache[trapdoorId];
            G1 X = encCache[encId].first;
            Big Y = encCache[encId].second;

            // 计算配对 e(T, X)
            GT pairingResult = pfc.pairing(T, X);

            // 计算 H3(e(T, X))
            Big hashResult = pfc.hash_to_aes_key(pairingResult);

            // 验证 Y == H3(e(T, X))
            return (Y == hashResult);
        }
        catch (const exception &e)
        {
            cerr << "验证关键字匹配失败: " << e.what() << endl;
            return false;
        }
    }

    // 基于关键字匹配结果分配资源
    string allocateResourcesAccordingToKeywords(
        const string &trapdoor,
        const vector<string> &encryptedMetadataList,
        const vector<string> &edgeNodeIds)
    {

        lock_guard<mutex> lock(mtx);

        if (!initialized)
        {
            cerr << "错误: 系统未初始化" << endl;
            return "";
        }

        try
        {
            // 解析陷门
            string trapdoorId, groupId, keyword;
            if (!parseTrapdoor(trapdoor, trapdoorId, groupId, keyword))
            {
                cerr << "错误: 无效的陷门格式" << endl;
                return "";
            }

            // 遍历所有加密元数据，找出匹配的
            vector<int> matchedIndices;
            for (size_t i = 0; i < encryptedMetadataList.size(); i++)
            {
                if (verifyKeywordMatch(trapdoor, encryptedMetadataList[i]))
                {
                    matchedIndices.push_back(i);
                }
            }

            // 如果没有匹配，返回空
            if (matchedIndices.empty())
            {
                return "";
            }

            // 简单分配策略：选择第一个匹配的元数据对应的边缘节点
            int selectedIndex = matchedIndices[0];
            if (selectedIndex < edgeNodeIds.size())
            {
                return edgeNodeIds[selectedIndex];
            }

            return "";
        }
        catch (const exception &e)
        {
            cerr << "资源分配失败: " << e.what() << endl;
            return "";
        }
    }

    // 辅助方法：生成唯一ID
    string generateUniqueId()
    {
        time_t now = time(nullptr);
        string idStr = to_string(now) + to_string(rand());
        return idStr;
    }

    // 辅助方法：解析陷门
    bool parseTrapdoor(const string &trapdoor, string &trapdoorId, string &groupId, string &keyword)
    {
        size_t pos1 = trapdoor.find('|');
        if (pos1 == string::npos)
        {
            return false;
        }

        size_t pos2 = trapdoor.find('|', pos1 + 1);
        if (pos2 == string::npos)
        {
            return false;
        }

        trapdoorId = trapdoor.substr(0, pos1);
        groupId = trapdoor.substr(pos1 + 1, pos2 - pos1 - 1);
        keyword = trapdoor.substr(pos2 + 1);
        return true;
    }

    // 辅助方法：解析加密元数据
    bool parseEncryptedMetadata(const string &metadata, string &encId)
    {
        // 假设metadata是JSON格式，解析出id字段
        size_t idPos = metadata.find("\"id\"");
        if (idPos == string::npos)
        {
            return false;
        }

        idPos = metadata.find(":", idPos);
        if (idPos == string::npos)
        {
            return false;
        }

        idPos = metadata.find("\"", idPos);
        if (idPos == string::npos)
        {
            return false;
        }

        size_t idEnd = metadata.find("\"", idPos + 1);
        if (idEnd == string::npos)
        {
            return false;
        }

        encId = metadata.substr(idPos + 1, idEnd - idPos - 1);
        return true;
    }
};

// CryptoEngineImpl公开方法实现，委托给PrivateImpl
CryptoEngineImpl::CryptoEngineImpl() : pImpl(new PrivateImpl())
{
}

CryptoEngineImpl::~CryptoEngineImpl()
{
}

bool CryptoEngineImpl::systemSetup(int securityLevel)
{
    return pImpl->systemSetup(securityLevel);
}

pair<string, string> CryptoEngineImpl::nodeRegistration(const string &nodeId)
{
    return pImpl->nodeRegistration(nodeId);
}

string CryptoEngineImpl::groupGeneration(const vector<string> &nodeIds)
{
    return pImpl->groupGeneration(nodeIds);
}

string CryptoEngineImpl::searchTokenGeneration(const string &keyword, const string &key)
{
    return pImpl->searchTokenGeneration(keyword, key);
}

bool CryptoEngineImpl::verifyKeywordMatch(const string &trapdoor, const string &encryptedMetadata)
{
    return pImpl->verifyKeywordMatch(trapdoor, encryptedMetadata);
}

string CryptoEngineImpl::encapsulateKeyword(const string &keyword, const string &metadata)
{
    return pImpl->encapsulateKeyword(keyword, metadata);
}

string CryptoEngineImpl::allocateResourcesAccordingToKeywords(
    const string &trapdoor,
    const vector<string> &encryptedMetadataList,
    const vector<string> &edgeNodeIds)
{
    return pImpl->allocateResourcesAccordingToKeywords(trapdoor, encryptedMetadataList, edgeNodeIds);
}
