#include <iostream>
#include "miracl.h"  // 确保路径正确

int main() {
    miracl *mip = mirsys(1000, 0);  // 初始化
    mip->IOBASE = 10;               // 十进制输出
    big num = mirvar(12345);        // 创建大数
    std::cout << "MIRACL Test: ";
    cotnum(num, stdout);            // 输出
    mirexit();                      // 清理内存
    return 0;
}