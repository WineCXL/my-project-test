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

## 系统要求
- Windows 10/11 64位
- Visual Studio 2022
- CMake 3.10+
- Git

## 项目结构
```
MIRACLTest/
├── .vscode/               # VS Code配置目录
│   ├── launch.json        # 调试配置文件
│   ├── settings.json      # 编辑器设置文件
│   └── tasks.json         # 任务配置文件
├── libs/                  # 库文件目录
│   └── miracl/            # MIRACL库
│       ├── include/       # 头文件目录
│       ├── source/        # 源代码目录
│       └── readme.txt     # MIRACL库说明文档
├── src/                   # 源代码目录
│   └── miracl_example.cpp # 示例程序源代码
├── .editorconfig          # 编辑器配置文件
├── .gitignore             # Git忽略文件配置
├── .gitmodules            # Git子模块配置文件
├── CMakeLists.txt         # CMake构建配置文件
└── README.md              # 项目说明文档
```

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/WineCXL/my-project-test.git
cd my-project-test
```

### 2. 构建项目
#### 使用VS Code
1. `Ctrl+Shift+P` 打开搜索栏
2. 输入 "CMake: Configure" 并执行
3. 输入 "CMake: Build" 并执行

#### 使用命令行
```bash
mkdir build
cd build
cmake ..
cmake --build . --config Debug
```

### 3. 运行示例
#### 使用VS Code
1. `Ctrl+Shift+P` 打开搜索栏
2. 输入 "CMake: Run without Debugging" 并执行

#### 使用命令行
```bash
./build/bin/Debug/miracl_example
```

## 许可证
本项目使用MIT许可证。MIRACL库的许可证请参考其官方文档。

## 致谢
- [MIRACL库](https://github.com/miracl/MIRACL) - 本项目使用的核心库