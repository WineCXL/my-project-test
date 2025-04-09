#define MR_PAIRING_SS2    // 使用SS2类型的配对，提供AES-128级别的安全性
#define AES_SECURITY 128  // 设置AES安全级别为128位

#include "pairing_1.h"    // MIRACL库的配对运算头文件
#include <iostream>       // 标准输入输出
#include <ctime>          // 时间相关函数
#include <cstring>        // 字符串处理
#include <windows.h>      // Windows API

using namespace std;

int main(){
    // 设置控制台输出为UTF-8编码，以支持中文显示
    ::SetConsoleOutputCP(CP_UTF8);
    ::SetConsoleCP(CP_UTF8);
    
// ============================================
// 1. 初始化（Initialization）
// ============================================
    // 初始化配对友好曲线，使用AES-128安全级别
    PFC pfc(AES_SECURITY);   

    // pfc.random(Big) 生成随机数
    // pfc.mult(G1,Big) 计算乘积
    // pfc.power(GT,Big) 计算幂值
    // pfc.start_hash() 初始化哈希值
    // pfc.add_to_hash(G1) 添加元素到哈希值
    // pfc.finish_hash_to_group() 结束哈希值计算
    // pfc.hash_and_map(G1,char*) 将字符串转换为G1群上的点 即h1函数、h2函数
    // pfc.hash_to_aes_key(GT) 将GT群上的元素转换为AES密钥 即h3函数
    // pfc.pairing(G1,G1) 计算双线性配对 即e函数

    // 声明变量
    G1 P,P_pub,r,q_s,s_s[5];  // G1群上的点
    char GID[2048] = {0};     // 群ID，初始化为0
    char* ID_set[5];          // 边缘节点ID数组
    Big s,x_s[5];             // 大整数
    
    time_t seed;              // 随机数种子

    // 初始化随机数生成器
    time(&seed);
    irand((long)seed);

    pfc.random(P);            // 随机选择基点P
    pfc.random(s);            // 随机选择主密钥s
    P_pub = pfc.mult(P,s);    // 计算系统公钥 P_pub = s*P

    cout << "系统主密钥: " << s << endl;
    
    // 计算系统公钥的哈希值
    pfc.start_hash();
    pfc.add_to_hash(P_pub);
    Big pk;
    pk = pfc.finish_hash_to_group();
    cout << "系统公钥: " << pk << endl;

// ============================================
// 2. 注册（Registration）
// ============================================
    for(int i=0;i<5;i++){
        char ID_I[20] = {0};  // 节点ID，初始化为0
        sprintf(ID_I, "%d", i);  // 将整数转换为字符串作为ID
        G1 q_i,s_i; 
        
        // 将节点ID添加到ID集合
        ID_set[i] = ID_I;
        
        // 计算节点公钥 q_i = h1(ID_i)
        char big_to_ch[256] = {0};
        strcpy(big_to_ch,ID_I);    
        pfc.hash_and_map(q_i,big_to_ch);
    
        // 计算节点私钥 s_i = s*q_i
        s_i = pfc.mult(q_i,s);
        
        // 累加节点公钥和私钥
        q_s = q_s + q_i;  // q_s = q_1 + ... + q_i
        s_s[i] = s_i;

        // 计算并显示节点私钥的哈希值
        pfc.start_hash();
        pfc.add_to_hash(s_i);
        Big s_i_sk; 
        s_i_sk = pfc.finish_hash_to_group();
        cout << "边缘节点 " << i << " 的ID: " << ID_I << " 私钥: " << s_i_sk << endl;
    }

// ============================================
// 3. 群组生成（Group Generation）
// ============================================
    GT Phi;                   // GT群上的元素
    
    
    for(int i=0;i<5;i++){
        Big x_i;            // 随机数
        G1 r_i;             // 临时点
        pfc.random(x_i);    // 生成随机数
        r_i = pfc.mult(P,x_i);  // 计算 r_i = x_i*P

        // 构建群ID
        char big_to_ch[256] = {0};
        strcpy(big_to_ch,ID_set[i]);
        strcat(GID,big_to_ch);  // GID = ID1||ID2||...||IDi
        x_s[i]=x_i;    

        // 累加r值
        r = r + r_i;   // r = r_1 + ... + r_i 
    }

    // 计算群组公钥中的Phi值
    Phi = pfc.pairing(q_s,P_pub);  // Phi = e(q_s,P_pub)

    // 计算并显示群组公钥
    pfc.start_hash();
    pfc.add_to_hash(r);
    Big pk_r; 
    pk_r = pfc.finish_hash_to_group();
    cout << "群组公钥: { " << pk_r << " , " << pfc.hash_to_aes_key(Phi) << " }" << endl;

// ============================================
// 4. 关键字生成（Keyword Generation）
// ============================================
    char m[]= "observe";  // 要加密的关键词

// ============================================
// 5. 消息封装（Message Encapsulation）
// ============================================
    Big y,Y;              // 随机数和哈希值
    pfc.random(y);        // 生成随机数y
    
    G1 X,temp_g_value;    // 临时点
    X = pfc.mult(P,y);    // 计算 X = y*P

    strcat(GID,m);        // 将关键词添加到群ID中
    
    // 计算临时点
    pfc.hash_and_map(temp_g_value,GID);
    
    // 计算配对值
    GT temp_pair = pfc.pairing(temp_g_value,r);
    temp_pair = temp_pair * Phi;
    // 计算Y值
    Y = pfc.hash_to_aes_key(pfc.power(temp_pair,y));
    
    // 计算并显示加密关键词
    pfc.start_hash();
    pfc.add_to_hash(X);
    Big pk_X; 
    pk_X = pfc.finish_hash_to_group();
    cout << "加密关键词: { " << pk_X << " , " << Y << " }" << endl;

// ============================================
// 6. 授权测试（Authorization Test）
// ============================================
    G1 w_i,T,temp_value; 
    
    // 为每个节点计算陷门
    for(int i=0;i<5;i++){
        temp_value = pfc.mult(temp_g_value,x_s[i]);
        // 计算部分陷门 w_i = s_i + x_i*H2(GID, m_l)
        w_i = s_s[i] + temp_value;
        T = T + w_i;  // 累加陷门
    }

    // 计算并显示完整陷门
    pfc.start_hash();
    pfc.add_to_hash(T);
    Big pk_T;
    pk_T = pfc.finish_hash_to_group();
    cout << "陷门: { " << pk_T << " }" << endl;

// ============================================
// 7. 资源分配（Resource Allocation）
// ============================================
    // 计算配对值
    GT pair_result = pfc.pairing(T,X);
    // 计算哈希值
    Big hash_result = pfc.hash_to_aes_key(pair_result);
    
    // 验证关键词是否匹配
    if(Y==hash_result){
        cout << "当前加密元数据包含关键词m" << endl;
    }else{
        cout << "加密元数据不包含m" << endl;
    }

    return 0;
}