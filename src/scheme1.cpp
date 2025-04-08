#define MR_PAIRING_SS2    // AES-128 security GF(2^m) curve
#define AES_SECURITY 128

#include "pairing_1.h"
#include <iostream>
#include <ctime>
#include <cstring>
#include <windows.h>

using namespace std;

int main(){
    try {
        // 设置控制台输出为UTF-8编码
        ::SetConsoleOutputCP(CP_UTF8);
        ::SetConsoleCP(CP_UTF8);
        
        cout << "开始系统初始化..." << endl;
        
        PFC pfc(AES_SECURITY);   // initialise pairing-friendly curve
        
        G1 P,Ppub,r,q_s,s_s[5];
        char GID[2048] = {0};  // 初始化为0
        char* ID_set[5];
        Big s,x_s[5];
        GT Phi;
        time_t seed;

        time(&seed);
        irand((long)seed);
        
        cout << "系统初始化完成" << endl;
        cout << "开始系统设置..." << endl;

        //setup
        pfc.random(P);
        pfc.random(s);    
        Ppub = pfc.mult(P,s);   //Ppub=sP;

        cout << "系统主密钥: " << s << endl;
        
        pfc.start_hash();
        pfc.add_to_hash(Ppub);
        Big pk;
        pk = pfc.finish_hash_to_group();
        cout << "系统公钥: " << pk << endl;

        cout << "系统设置完成" << endl;
        cout << "开始边缘节点注册..." << endl;

        //Registration
        for(int i=0;i<5;i++){
            char ID_I[20] = {0};  // 初始化为0
            sprintf(ID_I, "%d", i);  // "%d" 格式化整型为字符串        
            G1 q_i,s_i; 
            
            //each edge node sends its IDi to TA
            ID_set[i] = ID_I;
            
            char big_to_ch[256] = {0};  // 初始化为0
            strcpy(big_to_ch,ID_I);    
            pfc.hash_and_map(q_i,big_to_ch);  //q_i = h1(ID_i)
        
            s_i = pfc.mult(q_i,s);  //s_i = sq_i as the private key of edge node ID_I.
            
            q_s = q_s + q_i;  //q_s = q_1+...+q_i
            s_s[i] = s_i;

            pfc.start_hash();
            pfc.add_to_hash(s_i);
            Big s_i_sk; 
            s_i_sk = pfc.finish_hash_to_group();
            cout << "边缘节点 " << i << " 的ID: " << ID_I << " 私钥: " << s_i_sk << endl;
        }

        cout << "边缘节点注册完成" << endl;
        cout << "开始群组生成..." << endl;

        //Group Generation
        for(int i=0;i<5;i++){
            Big x_i;
            G1 r_i;
            pfc.random(x_i);
            r_i = pfc.mult(P,x_i);  //r_i = x_iP

            char big_to_ch[256] = {0};  // 初始化为0
            strcpy(big_to_ch,ID_set[i]);
            strcat(GID,big_to_ch);  //GID = ID1||ID2|| . . . ||IDi∈S||serianumber
            x_s[i]=x_i;    

            //the edge node can compute and publish the group public key E = (r, Φ, S),
            r = r + r_i;   //r = r_1+...+r_i 
        }
        cout << "计算群组公钥..." << endl;
        Phi = pfc.pairing(q_s,Ppub);  //Phi = e(q_s,Ppub);

        pfc.start_hash();
        pfc.add_to_hash(r);
        Big pk_r; 
        pk_r = pfc.finish_hash_to_group();
        cout << "群组公钥: { " << pk_r << " , " << pfc.hash_to_aes_key(Phi) << " }" << endl;

        cout << "群组生成完成" << endl;
        cout << "开始消息封装..." << endl;

        //Message Encapsulation
        Big y,Y;
        pfc.random(y);  // 初始化y
        char m[]= "observe";
        G1 X,temp_g_value;
        X = pfc.mult(P,y);  //X = yP
        strcat(GID,m); 
        cout << "计算哈希映射..." << endl;
        pfc.hash_and_map(temp_g_value,GID);
        
        cout << "计算配对..." << endl;
        GT temp_pair = pfc.pairing(temp_g_value,r);
        cout << "计算Phi..." << endl;
        temp_pair = temp_pair * Phi;
        cout << "计算Y..." << endl;
        Y = pfc.hash_to_aes_key(pfc.power(temp_pair,y));
        
        //the encrypted keyword (X, Y)
        
        pfc.start_hash();
        pfc.add_to_hash(X);
        Big pk_X; 
        pk_X = pfc.finish_hash_to_group();
        cout << "加密关键词: { " << pk_X << " , " << Y << " }" << endl;

        cout << "消息封装完成" << endl;
        cout << "开始测试授权..." << endl;

        //Test Authorization
        G1 w_i,T,temp_value; 
        
        for(int i=0;i<5;i++){
            cout << "计算第 " << i << " 个节点的陷门..." << endl;
            temp_value = pfc.mult(temp_g_value,x_s[i]);
            w_i = s_s[i] + temp_value;  //compute the corresponding partial trapdoor w_i = s_i + x_i*h2(GID, m_l) for the keyword m_l,
            T = T + w_i;
        }

        pfc.start_hash();
        pfc.add_to_hash(T);
        Big pk_T;
        pk_T = pfc.finish_hash_to_group();
        cout << "陷门: { " << pk_T << " }" << endl;

        cout << "测试授权完成" << endl;
        cout << "开始资源分配..." << endl;

        //Resource Allocation
        cout << "计算配对..." << endl;
        GT pair_result = pfc.pairing(T,X);
        cout << "计算哈希..." << endl;
        Big hash_result = pfc.hash_to_aes_key(pair_result);
        
        if(Y==hash_result){
            cout << "当前加密元数据包含关键词m" << endl;
        }else{
            cout << "加密元数据不包含m" << endl;
        }

        cout << "资源分配完成" << endl;
        cout << "程序执行完毕" << endl;
    }
    catch(const char* msg) {
        cerr << "错误: " << msg << endl;
        return 1;
    }
    catch(...) {
        cerr << "发生未知错误" << endl;
        return 1;
    }
    return 0;
}