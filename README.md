# MIRACLTest

这是一个使用 MIRACL 密码学库的测试项目。

## 项目结构

```
MIRACLTest/
├── libs/                # 第三方库
│   └── miracl/         # MIRACL 密码学库
│       ├── include/    # 头文件
│       └── lib/        # 库文件
├── src/                # 源代码
│   ├── miracl_example.cpp  # MIRACL 库使用示例
│   └── scheme1.cpp     # 基于 MIRACL 的安全关键词搜索方案
├── CMakeLists.txt      # CMake 构建配置
└── README.md           # 项目说明文档
```

## 构建说明

### 前提条件

- CMake 3.10 或更高版本
- C++11 兼容的编译器
- Windows 系统（已测试 Windows 10）

### 构建步骤

1. 创建构建目录并生成构建文件：

```bash
cmake -B build -S .
```

2. 构建项目：

```bash
cmake --build build --config Debug
```

3. 运行示例程序：

```bash
.\build\bin\Debug\miracl_example.exe
```

## 项目说明

### miracl_example.cpp

这是一个简单的 MIRACL 库使用示例，展示了基本的大整数运算功能：
- 大整数初始化
- 大整数赋值
- 大整数加法
- 大整数减法
- 大整数乘法
- 大整数除法

### scheme1.cpp

这是一个基于 MIRACL 库实现的安全关键词搜索方案，包含以下主要组件：
1. 系统设置 (Setup)
2. 边缘节点注册 (Registration)
3. 组密钥生成 (Group Generation)
4. 消息/关键词封装 (Message Encapsulation)
5. 授权测试 (Test Authorization)
6. 资源分配 (Resource Allocation)

## 注意事项

- 项目使用 UTF-8 编码
- 在 Windows 系统上运行时，可能需要设置控制台代码页为 UTF-8
- 确保 MIRACL 库的头文件和库文件位于正确的位置