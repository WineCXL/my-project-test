#include <napi.h>
#include "crypto_engine.h"
#include "crypto_engine_impl.h"
#include <iostream>
#include <vector>
#include <string>

class CryptoEngineWrapper : public Napi::ObjectWrap<CryptoEngineWrapper>
{
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    CryptoEngineWrapper(const Napi::CallbackInfo &info);
    ~CryptoEngineWrapper();

private:
    static Napi::FunctionReference constructor;

    // 封装CryptoEngine的方法
    Napi::Value SystemSetup(const Napi::CallbackInfo &info);
    Napi::Value NodeRegistration(const Napi::CallbackInfo &info);
    Napi::Value GroupGeneration(const Napi::CallbackInfo &info);
    Napi::Value ResourceEncryption(const Napi::CallbackInfo &info);
    Napi::Value ResourceDecryption(const Napi::CallbackInfo &info);
    Napi::Value SearchTokenGeneration(const Napi::CallbackInfo &info);
    Napi::Value Search(const Napi::CallbackInfo &info);
    Napi::Value VerifyKeywordMatch(const Napi::CallbackInfo &info);
    Napi::Value EncapsulateKeyword(const Napi::CallbackInfo &info);
    Napi::Value AllocateResourcesAccordingToKeywords(const Napi::CallbackInfo &info);

    // 底层CryptoEngine实例
    std::unique_ptr<CryptoEngineImpl> engine;
};

Napi::FunctionReference CryptoEngineWrapper::constructor;

Napi::Object CryptoEngineWrapper::Init(Napi::Env env, Napi::Object exports)
{
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "CryptoEngine", {InstanceMethod("systemSetup", &CryptoEngineWrapper::SystemSetup), InstanceMethod("nodeRegistration", &CryptoEngineWrapper::NodeRegistration), InstanceMethod("groupGeneration", &CryptoEngineWrapper::GroupGeneration), InstanceMethod("resourceEncryption", &CryptoEngineWrapper::ResourceEncryption), InstanceMethod("resourceDecryption", &CryptoEngineWrapper::ResourceDecryption), InstanceMethod("searchTokenGeneration", &CryptoEngineWrapper::SearchTokenGeneration), InstanceMethod("search", &CryptoEngineWrapper::Search), InstanceMethod("verifyKeywordMatch", &CryptoEngineWrapper::VerifyKeywordMatch), InstanceMethod("encapsulateKeyword", &CryptoEngineWrapper::EncapsulateKeyword), InstanceMethod("allocateResourcesAccordingToKeywords", &CryptoEngineWrapper::AllocateResourcesAccordingToKeywords)});

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("CryptoEngine", func);
    return exports;
}

CryptoEngineWrapper::CryptoEngineWrapper(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<CryptoEngineWrapper>(info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        // 创建CryptoEngine实例
        engine = std::make_unique<CryptoEngineImpl>();
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, "Failed to create CryptoEngine: " + std::string(e.what())).ThrowAsJavaScriptException();
    }
}

CryptoEngineWrapper::~CryptoEngineWrapper()
{
    // 析构函数自动处理engine的释放
}

Napi::Value CryptoEngineWrapper::SystemSetup(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 1 || !info[0].IsNumber())
        {
            Napi::TypeError::New(env, "Number expected for securityLevel").ThrowAsJavaScriptException();
            return env.Null();
        }

        int securityLevel = info[0].As<Napi::Number>().Int32Value();
        bool result = engine->systemSetup(securityLevel);

        return Napi::Boolean::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::NodeRegistration(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 1 || !info[0].IsString())
        {
            Napi::TypeError::New(env, "String expected for nodeId").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string nodeId = info[0].As<Napi::String>();
        auto result = engine->nodeRegistration(nodeId);

        Napi::Object obj = Napi::Object::New(env);
        obj.Set("nodeId", Napi::String::New(env, result.first));
        obj.Set("key", Napi::String::New(env, result.second));

        return obj;
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::GroupGeneration(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 1 || !info[0].IsArray())
        {
            Napi::TypeError::New(env, "Array expected for nodeIds").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Array nodeIdsArray = info[0].As<Napi::Array>();
        std::vector<std::string> nodeIds;

        for (uint32_t i = 0; i < nodeIdsArray.Length(); i++)
        {
            Napi::Value value = nodeIdsArray[i];
            if (!value.IsString())
            {
                Napi::TypeError::New(env, "Array elements must be strings").ThrowAsJavaScriptException();
                return env.Null();
            }
            nodeIds.push_back(value.As<Napi::String>());
        }

        std::string result = engine->groupGeneration(nodeIds);
        return Napi::String::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::ResourceEncryption(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString())
        {
            Napi::TypeError::New(env, "String expected for plaintext and key").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string plaintext = info[0].As<Napi::String>();
        std::string key = info[1].As<Napi::String>();

        std::string result = engine->resourceEncryption(plaintext, key);
        return Napi::String::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::ResourceDecryption(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString())
        {
            Napi::TypeError::New(env, "String expected for ciphertext and key").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string ciphertext = info[0].As<Napi::String>();
        std::string key = info[1].As<Napi::String>();

        std::string result = engine->resourceDecryption(ciphertext, key);
        return Napi::String::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::SearchTokenGeneration(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString())
        {
            Napi::TypeError::New(env, "String expected for keyword and key").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string keyword = info[0].As<Napi::String>();
        std::string key = info[1].As<Napi::String>();

        std::string result = engine->searchTokenGeneration(keyword, key);
        return Napi::String::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::Search(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsArray())
        {
            Napi::TypeError::New(env, "String expected for token and Array for encryptedDocs").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string token = info[0].As<Napi::String>();
        Napi::Array docsArray = info[1].As<Napi::Array>();
        std::vector<std::string> encryptedDocs;

        for (uint32_t i = 0; i < docsArray.Length(); i++)
        {
            Napi::Value value = docsArray[i];
            if (!value.IsString())
            {
                Napi::TypeError::New(env, "Array elements must be strings").ThrowAsJavaScriptException();
                return env.Null();
            }
            encryptedDocs.push_back(value.As<Napi::String>());
        }

        std::vector<std::string> results = engine->search(token, encryptedDocs);

        Napi::Array resultArray = Napi::Array::New(env, results.size());
        for (size_t i = 0; i < results.size(); i++)
        {
            resultArray[i] = Napi::String::New(env, results[i]);
        }

        return resultArray;
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::VerifyKeywordMatch(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString())
        {
            Napi::TypeError::New(env, "String expected for trapdoor and encryptedMetadata").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string trapdoor = info[0].As<Napi::String>();
        std::string encryptedMetadata = info[1].As<Napi::String>();

        bool result = engine->verifyKeywordMatch(trapdoor, encryptedMetadata);
        return Napi::Boolean::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::EncapsulateKeyword(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString())
        {
            Napi::TypeError::New(env, "String expected for keyword and metadata").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string keyword = info[0].As<Napi::String>();
        std::string metadata = info[1].As<Napi::String>();

        std::string result = engine->encapsulateKeyword(keyword, metadata);
        return Napi::String::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value CryptoEngineWrapper::AllocateResourcesAccordingToKeywords(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try
    {
        if (info.Length() < 3 || !info[0].IsString() || !info[1].IsArray() || !info[2].IsArray())
        {
            Napi::TypeError::New(env, "Expected: trapdoor(string), encryptedMetadataList(array), edgeNodeIds(array)").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string trapdoor = info[0].As<Napi::String>();

        Napi::Array metadataArray = info[1].As<Napi::Array>();
        std::vector<std::string> encryptedMetadataList;
        for (uint32_t i = 0; i < metadataArray.Length(); i++)
        {
            Napi::Value value = metadataArray[i];
            if (!value.IsString())
            {
                Napi::TypeError::New(env, "Metadata array elements must be strings").ThrowAsJavaScriptException();
                return env.Null();
            }
            encryptedMetadataList.push_back(value.As<Napi::String>());
        }

        Napi::Array nodesArray = info[2].As<Napi::Array>();
        std::vector<std::string> edgeNodeIds;
        for (uint32_t i = 0; i < nodesArray.Length(); i++)
        {
            Napi::Value value = nodesArray[i];
            if (!value.IsString())
            {
                Napi::TypeError::New(env, "Node array elements must be strings").ThrowAsJavaScriptException();
                return env.Null();
            }
            edgeNodeIds.push_back(value.As<Napi::String>());
        }

        std::string result = engine->allocateResourcesAccordingToKeywords(trapdoor, encryptedMetadataList, edgeNodeIds);
        return Napi::String::New(env, result);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// 模块初始化函数
Napi::Object InitModule(Napi::Env env, Napi::Object exports)
{
    return CryptoEngineWrapper::Init(env, exports);
}

// 定义模块
NODE_API_MODULE(crypto_engine, InitModule)