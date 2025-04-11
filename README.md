# MIRACLTest

基于MIRACL库的密码学方案实现

## 项目结构

```text
MIRACLTest/
├── .vscode/
│   └── settings.json    # VS Code编辑器配置
├── libs/
│   └── miracl/          # MIRACL库文件
│       ├── include/     # 头文件
│       ├── source/      # 源文件
│       └── lib/         # 预编译库
├── src/
│   └── scheme1.cpp      # 主程序
├── .cspell.json         # 拼写检查配置
├── .gitignore           # Git忽略规则
├── .gitmodules          # Git子模块配置
├── CMakeLists.txt       # CMake配置文件
├── helloworld.md        # Markdown教程
└── README.md            # 项目说明文档
```

## 依赖项

- CMake 3.10或更高版本
- Visual Studio 2022（Windows平台）
- MIRACL库（已包含在项目中）

## 编译说明

1. 确保已安装Visual Studio 2022和CMake

2. 在项目根目录下执行以下命令：

   ```bash
   cmake -B build -S . -A Win32
   cmake --build build --config Debug
   ```

3. 编译完成后，可执行文件位于：

   ```text
   build/bin/Debug/scheme1.exe
   ```

## 运行说明

直接运行生成的可执行文件：

```bash
.\build\bin\Debug\scheme1.exe
```

## 功能说明

本程序实现了基于配对密码学的方案，包括：

1. 初始化
   - 生成系统主密钥和公钥
   - 初始化配对友好曲线

2. 边缘节点注册
   - 为每个节点生成唯一ID
   - 分配对应的私钥

3. 组生成
   - 生成群组公钥
   - 计算群组参数

4. 关键字生成（未实现）

5. 消息封装
   - 加密关键词
   - 生成密文

6. 授权测试
   - 生成陷门
   - 验证授权

7. 资源分配
   - 验证关键词匹配
   - 输出结果

## 注意事项

- 本项目使用32位编译，确保使用Win32平台
- 需要Visual Studio 2022的C++开发工具

## 许可证

本项目基于MIRACL库开发，遵循相应的许可证要求。
