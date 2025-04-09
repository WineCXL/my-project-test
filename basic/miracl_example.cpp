#include <iostream>

// 在包含miracl.h前使用extern "C"声明
extern "C" {
#include "../libs/miracl/include/miracl.h"
}

// 使用MIRACL库的简单示例程序

int main() {
    // 初始化MIRACL
    miracl *mip = mirsys(100, 0);
    
    // 设置输出格式
    mip->IOBASE = 10;  // 十进制输出
    
    // 声明大整数变量
    big a, b, c;
    
    // 初始化大整数
    a = mirvar(0);
    b = mirvar(0);
    c = mirvar(0);
    
    // 为大整数赋值
    cinstr(a, "12345");
    cinstr(b, "67890");
    
    // 打印输入值
    std::cout << "a = ";
    cotnum(a, stdout);
    std::cout << "b = ";
    cotnum(b, stdout);
    
    // 大整数加法
    add(a, b, c);
    std::cout << "a + b = ";
    cotnum(c, stdout);
    
    // 大整数减法
    subtract(a, b, c);
    std::cout << "a - b = ";
    cotnum(c, stdout);
    
    // 大整数乘法
    multiply(a, b, c);
    std::cout << "a * b = ";
    cotnum(c, stdout);
    
    // 大整数除法
    divide(a, b, c);
    std::cout << "a / b = ";
    cotnum(c, stdout);
    
    // 释放MIRACL资源
    mirkill(a);
    mirkill(b);
    mirkill(c);
    
    return 0;
} 