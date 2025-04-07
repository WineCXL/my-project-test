/*
 * scheme1.cpp - 基于MIRACL库的安全关键词搜索方案
 *
 * 该方案使用Type 1配对实现安全的关键词搜索机制，适用于边缘计算环境。
 * 实现了一种分布式关键词搜索系统，包含以下主要组件：
 * 1. 系统设置 (Setup)
 * 2. 边缘节点注册 (Registration)
 * 3. 组密钥生成 (Group Generation)
 * 4. 消息/关键词封装 (Message Encapsulation)
 * 5. 授权测试 (Test Authorization)
 * 6. 资源分配 (Resource Allocation)
 *
 * 使用SS2曲线上的Type 1配对 (GF(2^m)超奇异曲线)，提供AES-128安全级别
 */

#include <iostream>
#include <ctime>
#include <cstring>
#define MR_PAIRING_SS2    // 使用AES-128安全级别的GF(2^m)曲线
#define AES_SECURITY 128  // 设置安全级别为128位

#include "pairing_1.h"    // 引入Type 1配对相关函数

using namespace std;

int scheme1_main(){
    // 创建配对友好曲线对象，初始化密码系统
    PFC pfc(AES_SECURITY);   // 初始化配对友好曲线
    
    // 声明系统参数
    G1 P,Ppub,r,q_s,s_s[5];  // G1群上的点
    char GID[2048];          // 组ID字符串
    char* ID_set[5];         // 存储5个节点ID的数组
    Big s,x_s[5];            // 大整数：系统主密钥s和节点私钥x_s
    GT Phi;                  // GT群中的元素(配对结果)
    time_t seed;             // 随机数种子

    // 初始化随机数生成器
    time(&seed);
    irand((long)seed);
    
    //===========================
    // 1. 系统设置 (Setup)
    //===========================
    
    // 生成系统主密钥和公钥
    pfc.random(P);       // 随机生成群G1中的生成元P
    pfc.random(s);       // 随机生成系统主密钥s
    Ppub = pfc.mult(P,s);   // 计算系统公钥Ppub = s*P

    cout<<"密钥: "<<s<<endl;  // 输出系统主密钥
    
    // 对公钥进行哈希处理，生成可发布的公钥值
    pfc.start_hash();
    pfc.add_to_hash(Ppub);
    Big pk;
    pk = pfc.finish_hash_to_group();
    cout<<"公钥: "<<pk<<endl;  // 输出系统公钥

    //===========================
    // 2. 边缘节点注册 (Registration)
    //===========================
    
    // 为5个边缘节点生成身份和密钥
    for(int i=0;i<5;i++){
        // 将整数i转换为字符串作为节点ID
        char ID_I[20];  // 存储节点ID的字符数组
        sprintf(ID_I, "%d", i);  // 将整数i格式化为字符串
        
        G1 q_i,s_i;  // 声明节点相关的G1群元素
        
        // 边缘节点将其ID发送给可信授权中心(TA)
        ID_set[i] = ID_I;  // 存储节点ID
        
        // 将ID转换为字符数组用于哈希处理
        char big_to_ch[256];
        strcpy(big_to_ch,ID_I);
        
        // 使用哈希函数将ID映射到G1群中的点
        pfc.hash_and_map(q_i,big_to_ch);  // q_i = h1(ID_i)
    
        // 计算节点私钥：s_i = s * q_i
        s_i = pfc.mult(q_i,s);  // s_i作为边缘节点ID_I的私钥
        
        // 累加所有q_i值，用于后续组密钥生成
        q_s = q_s + q_i;  // q_s = q_1 + ... + q_i
        s_s[i] = s_i;     // 存储每个节点的私钥
        
        // 对节点私钥进行哈希处理，生成可用于验证的密钥值
        pfc.start_hash();
        pfc.add_to_hash(s_i);
        Big s_i_sk; 
        s_i_sk = pfc.finish_hash_to_group();
        
        // 输出节点ID和对应的私钥
        cout<<"边缘节点ID: "<<ID_I<<" "<<"边缘节点密钥: "<<s_i_sk<<endl;
    }

    //===========================
    // 3. 组密钥生成 (Group Generation)
    //===========================
    
    // 为每个节点生成组密钥部分
    for(int i=0;i<5;i++){
        Big x_i;  // 节点i的随机值
        G1 r_i;   // 节点i的公钥部分
        
        // 随机生成节点私有值x_i
        pfc.random(x_i);
        
        // 计算节点公钥部分r_i = x_i * P
        r_i = pfc.mult(P,x_i);  // r_i = x_i * P
        
        // 构建组ID：连接所有节点的ID
        char big_to_ch[256];
        strcpy(big_to_ch,ID_set[i]);
        strcat(GID,big_to_ch);  // GID = ID1 || ID2 || ... || IDi
        
        // 存储节点私有值，用于后续计算
        x_s[i] = x_i;    
        
        // 边缘节点计算并发布组公钥部分
        r = r + r_i;   // r = r_1 + ... + r_i (累加所有节点的公钥部分)
    }
    
    // 计算配对值Phi，作为组公钥的另一部分
    Phi = pfc.pairing(q_s,Ppub);  // Phi = e(q_s,Ppub)
    
    // 对组公钥r部分进行哈希处理
    pfc.start_hash();
    pfc.add_to_hash(r);
    Big pk_r; 
    pk_r = pfc.finish_hash_to_group();
       
    // 输出组公钥
    cout<<"组公钥: { "<<pk_r<<" , "<<pfc.hash_to_aes_key(Phi)<<" }"<<endl;

    //===========================
    // 4. 关键词生成与消息封装 (Message Encapsulation)
    //===========================
    
    // 生成随机值y，用于加密
    Big y,Y;
    pfc.random(y);
    
    // 设置要搜索的关键词
    char m[]= "observe";  // 关键词
    
    // 声明所需的群元素
    G1 X,temp_g_value;
    
    // 计算X = y * P
    X = pfc.mult(P,y);  // X = y * P
    
    // 构建GID||m，用于哈希
    strcat(GID,m);  // 将关键词m附加到GID后
    
    // 将GID||m哈希映射到G1群中的点
    pfc.hash_and_map(temp_g_value,GID);  // temp_g_value = h2(GID,m)
    
    // 计算加密值Y
    // Y = h3((e(h2(GID,m),r) * Phi)^y)
    Y = pfc.hash_to_aes_key(pfc.power(pfc.pairing(temp_g_value,r)*Phi,y));
    
    // 对公钥部分X进行哈希处理
    pfc.start_hash();
    pfc.add_to_hash(X);
    Big pk_X; 
    pk_X = pfc.finish_hash_to_group();
  
    // 输出加密关键词
    cout<<"加密关键词:{ "<<pk_X<<" , "<<Y<<" }"<<endl;
    
    //===========================
    // 5. 授权测试 (Test Authorization)
    //===========================
    
    // 为每个节点计算陷门部分
    G1 w_i,T,temp_value; 
    
    for(int i=0;i<5;i++){
        // 计算临时值：x_i * h2(GID,m)
        temp_value = pfc.mult(temp_g_value,x_s[i]);
        
        // 计算节点i的陷门部分：w_i = s_i + x_i * h2(GID,m)
        w_i = s_s[i] + temp_value;
        
        // 累加所有节点的陷门部分
        T = T + w_i;  // T = sum(w_i)
    }
    
    // 对陷门T进行哈希处理
    pfc.start_hash();
    pfc.add_to_hash(T);
    Big pk_T;
    pk_T = pfc.finish_hash_to_group();
            
    // 输出陷门值T
    cout<<"T_m:{ "<<pk_T<<" }"<<endl;

    //===========================
    // 6. 资源分配 (Resource Allocation)
    //===========================
    
    // 验证关键词是否匹配
    // 检查Y是否等于e(T,X)的哈希值
    if(Y==pfc.hash_to_aes_key(pfc.pairing(T,X))){
        cout<<"当前加密元数据包含关键词m"<<endl;  // 匹配成功
    }else{
        cout<<"加密元数据不包含m"<<endl;  // 匹配失败
    }

    return 0;
}

// 当单独构建scheme1时使用的main函数
int main() {
    return scheme1_main();
} 