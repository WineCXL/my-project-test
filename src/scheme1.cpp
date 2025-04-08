#define MR_PAIRING_SS2    // 使用SS2类型的配对，提供AES-128级别的安全性
#define AES_SECURITY 128  // 设置AES安全级别为128位

#include "pairing_1.h"    // MIRACL库的配对运算头文件
#include <iostream>       // 标准输入输出
#include <ctime>         // 时间相关函数
#include <cstring>       // 字符串处理
#include <windows.h>     // Windows API

using namespace std;

int main(){
    // 设置控制台输出为UTF-8编码，以支持中文显示
    ::SetConsoleOutputCP(CP_UTF8);
    ::SetConsoleCP(CP_UTF8);
    
    // 初始化配对友好曲线，使用AES-128安全级别
    PFC pfc(AES_SECURITY);   
    
    // 声明变量
    G1 P,Ppub,r,q_s,s_s[5];  // G1群上的点
    char GID[2048] = {0};    // 群ID，初始化为0
    char* ID_set[5];         // 边缘节点ID数组
    Big s,x_s[5];            // 大整数
    GT Phi;                  // GT群上的元素
    time_t seed;             // 随机数种子

    // 初始化随机数生成器
    time(&seed);
    irand((long)seed);

    // 系统设置阶段
    pfc.random(P);           // 随机选择基点P
    pfc.random(s);           // 随机选择主密钥s
    Ppub = pfc.mult(P,s);    // 计算系统公钥 Ppub = sP

    cout << "系统主密钥: " << s << endl;
    
    // 计算系统公钥的哈希值
    pfc.start_hash();
    pfc.add_to_hash(Ppub);
    Big pk;
    pk = pfc.finish_hash_to_group();
    cout << "系统公钥: " << pk << endl;

    // 边缘节点注册阶段
    for(int i=0;i<5;i++){
        char ID_I[20] = {0};  // 节点ID，初始化为0
        sprintf(ID_I, "%d", i);  // 将整数转换为字符串作为ID
        G1 q_i,s_i; 
        
        // 将节点ID添加到ID集合
        ID_set[i] = ID_I;
        
        // 计算节点公钥 q_i = H1(ID_i)
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

    // 群组生成阶段
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
    Phi = pfc.pairing(q_s,Ppub);  // Phi = e(q_s,Ppub)

    // 计算并显示群组公钥
    pfc.start_hash();
    pfc.add_to_hash(r);
    Big pk_r; 
    pk_r = pfc.finish_hash_to_group();
    cout << "群组公钥: { " << pk_r << " , " << pfc.hash_to_aes_key(Phi) << " }" << endl;

    // 消息封装阶段
    Big y,Y;              // 随机数和哈希值
    pfc.random(y);        // 生成随机数y
    char m[]= "observe";  // 要加密的关键词
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

    // 授权测试阶段
    G1 w_i,T,temp_value; 
    
    // 为每个节点计算陷门
    for(int i=0;i<5;i++){
        temp_value = pfc.mult(temp_g_value,x_s[i]);
        // 计算部分陷门 w_i = s_i + x_i*H2(GID, m_l)
        w_i = s_s[i] + temp_value;
        T = T + w_i;  // 累加陷门
    }

    // 计算并显示最终陷门
    pfc.start_hash();
    pfc.add_to_hash(T);
    Big pk_T;
    pk_T = pfc.finish_hash_to_group();
    cout << "陷门: { " << pk_T << " }" << endl;

    // 资源分配阶段
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