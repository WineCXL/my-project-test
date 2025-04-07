# MIRACL库示例

## 基本运算示例
```cpp
#include <iostream>
extern "C" {
#include "../libs/miracl/include/miracl.h"
}

int main() {
    // 初始化MIRACL
    miracl *mip = mirsys(100, 0);
    mip->IOBASE = 10;
    
    // 创建大整数
    big a = mirvar(0);
    big b = mirvar(0);
    big c = mirvar(0);
    
    // 赋值
    cinstr(a, "12345");
    cinstr(b, "67890");
    
    // 运算
    add(a, b, c);
    std::cout << "a + b = " << cotstr(c, NULL) << std::endl;
    
    // 清理
    mirkill(a);
    mirkill(b);
    mirkill(c);
    return 0;
}
```

## 模运算示例
```cpp
#include <iostream>
extern "C" {
#include "../libs/miracl/include/miracl.h"
}

int main() {
    // 初始化
    miracl *mip = mirsys(100, 0);
    mip->IOBASE = 10;
    
    // 创建大整数
    big n = mirvar(0);
    big a = mirvar(0);
    big b = mirvar(0);
    big c = mirvar(0);
    
    // 设置模数
    cinstr(n, "1000000007");
    prepare_monty(n);
    
    // 设置操作数
    cinstr(a, "12345");
    cinstr(b, "67890");
    
    // 转换为模形式
    nres(a, a);
    nres(b, b);
    
    // 模乘法
    nres_modmult(a, b, c);
    std::cout << "a * b mod n = " << cotstr(c, NULL) << std::endl;
    
    // 清理
    mirkill(n);
    mirkill(a);
    mirkill(b);
    mirkill(c);
    return 0;
}
```

## 椭圆曲线示例
```cpp
#include <iostream>
extern "C" {
#include "../libs/miracl/include/miracl.h"
}

int main() {
    // 初始化
    miracl *mip = mirsys(100, 0);
    mip->IOBASE = 10;
    
    // 创建椭圆曲线点
    epoint *P = epoint_init();
    epoint *Q = epoint_init();
    epoint *R = epoint_init();
    
    // 设置曲线参数
    big a = mirvar(0);
    big b = mirvar(0);
    big n = mirvar(0);
    cinstr(a, "1");
    cinstr(b, "1");
    cinstr(n, "1000000007");
    
    // 初始化曲线
    ecurve_init(a, b, n, MR_PROJECTIVE);
    
    // 设置点坐标
    big x = mirvar(0);
    big y = mirvar(0);
    cinstr(x, "12345");
    cinstr(y, "67890");
    epoint_set(x, y, 0, P);
    
    // 点加法
    ecurve_add(P, P, R);
    
    // 清理
    epoint_free(P);
    epoint_free(Q);
    epoint_free(R);
    mirkill(a);
    mirkill(b);
    mirkill(n);
    mirkill(x);
    mirkill(y);
    return 0;
}
```

更多示例请参考 `src/examples` 目录。 