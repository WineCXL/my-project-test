# MIRACL库API文档

## 基本功能

### 初始化
```cpp
miracl *mip = mirsys(100, 0);  // 初始化MIRACL，设置精度为100位
mip->IOBASE = 10;  // 设置输出为十进制
```

### 大整数操作
```cpp
big a = mirvar(0);  // 创建大整数变量
cinstr(a, "12345");  // 从字符串赋值
cotstr(a, NULL);  // 转换为字符串
```

### 基本运算
```cpp
add(a, b, c);      // c = a + b
subtract(a, b, c); // c = a - b
multiply(a, b, c); // c = a * b
divide(a, b, c);   // c = a / b
```

## 高级功能

### 模运算
```cpp
prepare_monty(n);  // 准备模运算
nres(a, b);        // 转换为模形式
nres_modmult(a, b, c);  // 模乘法
```

### 椭圆曲线
```cpp
epoint *P = epoint_init();  // 创建椭圆曲线点
epoint_set(x, y, 0, P);    // 设置点坐标
ecurve_add(P, Q, R);       // 点加法
```

## 内存管理
```cpp
mirkill(a);  // 释放大整数
mirexit();   // 清理MIRACL
```

## 示例代码
更多示例请参考 `src/examples` 目录。 