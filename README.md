# MIRACLTest

## 项目简介
MIRACLTest是一个基于MIRACL库的大整数运算示例项目。MIRACL是一个强大的多精度整数和有理数算术加密库，被广泛认为是椭圆曲线密码学(ECC)的黄金标准开源SDK。

## 功能特性
### MIRACL库功能
- 大整数运算（加、减、乘、除）
- 模运算支持
- 椭圆曲线运算

### 项目特性
- CMake构建系统
- Visual Studio 2022支持
- UTF-8编码支持
- VS Code集成开发环境配置

## 系统要求
- Windows 10/11 64位
- Visual Studio 2022
- CMake 3.10+
- Git

## 项目结构
```
MIRACLTest/
├── .vscode/               # VS Code配置目录
│   └── settings.json      # 编辑器和CMake设置文件
├── libs/                  # 库文件目录
│   └── miracl/            # MIRACL库
│       ├── include/       # 头文件目录
│       ├── source/        # 源代码目录
│       └── readme.txt     # MIRACL库说明文档
├── src/                   # 源代码目录
│   └── miracl_example.cpp # 示例程序源代码
├── .cspell.json           # 拼写检查配置文件
├── .editorconfig          # 编辑器配置文件
├── .gitignore             # Git忽略文件配置
├── .gitmodules            # Git子模块配置文件
├── CMakeLists.txt         # CMake构建配置文件
└── README.md              # 项目说明文档
```

## 配置文件说明

### .vscode/settings.json
VS Code配置文件，包含以下主要设置：
- CMake相关配置：禁用自动配置和构建
- 终端配置：设置工作目录和禁用自动启动
- Git配置：忽略build目录的变更
- 编辑器和调试相关设置

### .cspell.json
拼写检查配置文件，用于识别MIRACL库的特定术语：
- 添加了MIRACL相关术语到白名单
- 配置了需要忽略的目录和文件类型

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/WineCXL/my-project-test.git
cd my-project-test
```

### 2. 构建项目
#### 使用VS Code
1. 打开VS Code并加载项目
2. 使用`Ctrl+Shift+P`打开命令面板
3. 输入"CMake: Configure"并执行
4. 输入"CMake: Build"并执行

#### 使用命令行
```bash
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022" -A x64
cmake --build . --config Debug
```

### 3. 运行示例
#### 使用VS Code
1. 使用`Ctrl+Shift+P`打开命令面板
2. 输入"CMake: Run Without Debugging"并执行

#### 使用命令行
```bash
./build/bin/Debug/miracl_example.exe
```

### 4. 预期输出
```
a = 12345
b = 67890
a + b = 80235
a - b = -55545
a * b = 838102050
a / b = 0
```

## 开发指南

### VS Code工作流
1. **配置项目**：通过命令面板执行"CMake: Configure"
2. **构建项目**：通过命令面板执行"CMake: Build"
3. **运行程序**：通过命令面板执行"CMake: Run Without Debugging"
4. **调试程序**：通过命令面板执行"CMake: Debug"

### 自定义设置
您可以通过编辑`.vscode/settings.json`文件来自定义VS Code的行为。主要设置包括：
- CMake构建目录和配置
- 调试器行为
- 终端设置
- Git集成

## 许可证
本项目使用MIT许可证。MIRACL库的许可证请参考其官方文档。

## 致谢
- [MIRACL库](https://github.com/miracl/MIRACL) - 本项目使用的核心库