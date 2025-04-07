# MIRACLTest

这是一个使用MIRACL库进行大整数运算的示例项目。

## 项目结构

```
MIRACLTest/
├── CMakeLists.txt      # CMake构建配置文件
├── README.md           # 项目说明文档
├── .editorconfig       # 编辑器配置
├── .gitignore         # Git忽略文件配置
├── .vscode/           # VS Code配置目录
├── src/               # 源代码目录
│   └── miracl_example.cpp  # 示例程序
└── libs/              # 库文件目录
    └── miracl/        # MIRACL库
        ├── include/   # 头文件
        ├── source/    # 源代码
        └── readme.txt # MIRACL库说明文档
```

## 功能特性

- 支持大整数运算（加、减、乘、除）
- 使用CMake构建系统
- 支持Visual Studio 2022
- 支持UTF-8编码

## 构建说明

1. 确保已安装以下工具：
   - Visual Studio 2022
   - CMake 3.10或更高版本
   - Git

2. 克隆项目：
   ```bash
   git clone https://github.com/yourusername/MIRACLTest.git
   cd MIRACLTest
   ```

3. 在VS Code中构建：
   - 按 `Ctrl+Shift+P`
   - 输入 "CMake: Configure" 并执行
   - 再次按 `Ctrl+Shift+P`
   - 输入 "CMake: Build" 并执行

4. 运行程序：
   - 按 `Ctrl+Shift+P`
   - 输入 "CMake: Run without Debugging" 并执行

## 示例程序

示例程序展示了MIRACL库的基本功能：
- 大整数加法
- 大整数减法
- 大整数乘法
- 大整数除法

## 注意事项

- 项目使用UTF-8编码
- 需要64位Windows环境
- 确保Visual Studio已安装C++开发工具

## 许可证

本项目使用MIT许可证。MIRACL库的许可证请参考其官方文档。