# 可搜索加密元数据隐私保护资源分配系统

基于[《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》](https://www.mdpi.com/1424-8220/24/10/2989)论文的实现。

## 开发路线图

### 一、项目初始化阶段 [✓ 已完成]

- 创建项目结构 [✓ 已完成]
  - ✓ 创建项目目录
  - ✓ 设置.gitignore
  - ✓ 初始化Git仓库
- 初始化前端项目 [✓ 已完成]
  - ✓ 使用Vite创建Vue 3项目
  - ✓ 安装必要依赖（Element Plus、Axios等）
  - ✓ 配置开发环境
- 初始化后端项目 [✓ 已完成]
  - ✓ 创建Express.js项目
  - ✓ 安装必要依赖
  - ✓ 配置开发环境

### 二、数据库设计阶段 [✓ 已完成]

- 设计数据模型 [✓ 已完成]
  - ✓ 系统参数表（SystemParams）
  - ✓ 节点表（Nodes）
  - ✓ 群组表（Groups）
  - ✓ 资源分配表（ResourceAllocations）
  - ✓ 搜索记录表（SearchLogs）
- 创建数据库 [✓ 已完成]
  - ✓ 使用VS Code MySQL插件创建数据库
  - ✓ 实现数据库模型
  - ✓ 创建数据表

### 三、后端开发阶段 [✓ 已完成]

- 基础架构搭建 [✓ 已完成]
  - ✓ 配置Express服务器
  - ✓ 设置中间件（CORS、日志等）
  - ✓ 实现数据库连接
- API开发 [✓ 已完成]
  - ✓ 系统参数管理API
  - ✓ 节点管理API
  - ✓ 群组管理API
  - ✓ 资源分配API
  - ✓ 搜索操作API
- 业务逻辑实现 [✓ 已完成]
  - ✓ 基于论文方案集成MIRACL库
  - ✓ 实现加密引擎C++核心及Node.js绑定
  - ✓ 实现加密算法（系统初始化、节点注册、群组生成等）
  - ✓ 实现资源分配算法（支持元数据隐私保护）
  - ✓ 完善搜索令牌生成和加密搜索功能

### 四、前端开发阶段 [⟹ 进行中]

- 项目结构搭建 [✓ 已完成]
  - ✓ 配置路由
  - ✓ 设置状态管理
  - ✓ 创建API服务
- 组件开发 [✓ 已完成]
  - ✓ 认证布局组件
  - ✓ 应用主布局组件
  - ✓ 登录/注册组件
  - ✓ 系统设置组件
  - ✓ 节点管理组件
  - ✓ 群组管理组件
  - ✓ 资源分配组件
  - ✓ 搜索操作组件
- 页面开发 [⟹ 进行中]
  - ✓ 登录/注册页面
  - ✓ 仪表板页面
  - ✓ 系统配置页面
  - ✓ 节点管理页面
  - ✓ 群组管理页面
  - ✓ 资源分配页面
  - ⟹ 搜索操作页面
  - ☐ 用户管理页面

### 五、集成测试阶段 [⟹ 进行中]

- 前后端集成 [⟹ 进行中]
  - ✓ API对接
  - ⟹ 进行中数据流测试
  - ⟹ 进行中功能测试
- 性能优化 [未开始]
  - ☐ 前端性能优化
  - ☐ 后端性能优化
  - ☐ 数据库优化
- 安全性测试 [未开始]
  - ☐ 加密算法测试
  - ☐ 权限控制测试
  - ☐ 数据安全测试

### 六、部署上线阶段 [未开始]

- 环境准备 [未开始]
  - ☐ 服务器配置
  - ☐ 数据库部署
  - ☐ 环境变量配置
- 部署流程 [未开始]
  - ☐ 前端部署
  - ☐ 后端部署
  - ☐ 数据库迁移
- 监控和维护 [未开始]
  - ☐ 日志监控
  - ☐ 性能监控
  - ☐ 错误处理

### 七、文档编写阶段 [未开始]

- 技术文档 [未开始]
  - ☐ API文档
  - ☐ 数据库文档
  - ☐ 部署文档
- 用户文档 [未开始]
  - ☐ 使用手册
  - ☐ 操作指南
  - ☐ 常见问题

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
├── backend/
│   ├── controllers/     # 控制器
│   │   ├── setupController.js    # 重命名：系统初始化控制器
│   │   ├── edgeNodeController.js # 重命名：边缘节点控制器
│   │   ├── groupController.js    # 重命名：群组控制器
│   │   ├── keywordController.js  # 新增：关键词控制器
│   │   ├── encapsulationController.js # 新增：消息封装控制器
│   │   ├── authorizationController.js # 新增：授权控制器
│   │   └── matchController.js    # 新增：匹配验证控制器
│   ├── models/          # 数据模型
│   │   ├── systemParam.js        # 系统参数模型
│   │   ├── edgeNode.js           # 边缘节点模型
│   │   ├── group.js              # 群组模型
│   │   ├── keyword.js            # 关键词模型
│   │   ├── encryptedMessage.js   # 加密消息模型
│   │   ├── authToken.js          # 授权令牌模型
│   │   └── matchResult.js        # 匹配结果模型
│   ├── routes/          # 路由
│   │   ├── setupRoutes.js        # 系统初始化路由
│   │   ├── edgeNodeRoutes.js     # 边缘节点路由
│   │   ├── groupRoutes.js        # 群组路由
│   │   ├── keywordRoutes.js      # 关键词路由
│   │   ├── encapsulationRoutes.js # 消息封装路由
│   │   ├── authorizationRoutes.js # 授权路由
│   │   └── matchRoutes.js        # 匹配验证路由
│   ├── lib/             # 加密引擎
│   └── package.json     # 项目依赖
├── frontend/
│   ├── src/             # 源代码
│   │   ├── components/  # 组件
│   │   ├── views/       # 页面
│   │   ├── router/      # 路由
│   │   ├── store/       # 状态管理
│   │   └── api/         # API服务
│   └── package.json     # 项目依赖
├── basic/
│   └── scheme1.cpp      # 简易示例程序
├── .cspell.json         # 拼写检查配置
├── .gitignore           # Git忽略规则
├── .gitmodules          # Git子模块配置
└── README.md            # 项目说明文档
```

## 依赖项

### 后端

- Node.js 18.x或更高版本
- Express.js 4.x
- MySQL 8.0或更高版本
- MIRACL密码库（用于实现配对友好曲线密码）

### 前端

- Vue 3.x
- Vite
- Element Plus
- Axios
- Vue Router
- Pinia

### 开发环境

- CMake 3.10或更高版本（用于编译示例程序）
- Visual Studio 2022（Windows平台）
- VS Code（推荐IDE）

## 编译说明

### 示例程序编译

1. 确保已安装Visual Studio 2022和CMake

2. 在项目根目录下执行以下命令：

   ```bash
   cd basic
   cmake -B build -S . -A Win32
   cmake --build build --config Debug
   ```

3. 编译完成后，可执行文件位于：

   ```text
   basic/build/bin/Debug/scheme1.exe
   ```

### 完整系统部署

1. 安装后端依赖

   ```bash
   cd backend
   npm install
   ```

2. 安装前端依赖

   ```bash
   cd frontend
   npm install
   ```

3. 启动开发服务器

   ```bash
   # 后端
   cd backend
   npm run dev

   # 前端
   cd frontend
   npm run dev
   ```

## 功能说明

### basic/scheme1.cpp（示例程序）

这是基于论文方案的简易示例实现，包括：

1. 初始化
   - 生成系统主密钥和公钥
   - 初始化配对友好曲线

2. 边缘节点注册
   - 为每个节点生成唯一ID
   - 分配对应的私钥

3. 组生成
   - 生成群组公钥
   - 计算群组参数

4. 关键字生成

5. 消息封装
   - 加密关键词
   - 生成密文

6. 授权测试
   - 生成陷门
   - 验证授权

7. 资源分配
   - 验证关键词匹配
   - 输出结果

### 完整系统

本系统严格按照论文中提出的方案实现，包括：

1. 系统初始化 (Setup)
   - 生成主密钥和系统参数
   - 配置配对友好曲线

2. 边缘节点注册 (EdgeNodeReg)
   - 注册边缘节点
   - 分配密钥

3. 群组生成 (GroupGen)
   - 创建边缘节点群组
   - 生成群组参数

4. 关键词生成 (KeywordGen)
   - 生成安全搜索关键词

5. 消息封装 (Encapsulation)
   - 加密关键词和消息
   - 生成密文

6. 授权测试 (AuthorTest)
   - 生成搜索令牌
   - 验证授权

7. 匹配验证 (MatchVerify)
   - 执行安全匹配算法
   - 保护元数据隐私
   - 抵御半恶意节点攻击

## 注意事项

- basic/scheme1.cpp是基于论文方案的简易示例实现，保留它作为核心算法的参考
- 完整系统以论文中的方案为基准，对scheme1.cpp进行了扩展和完善
- 本项目使用32位编译，确保使用Win32平台
- 需要Visual Studio 2022的C++开发工具进行示例程序编译

## 许可证

本项目基于MIRACL库开发，遵循相应的许可证要求。

## 加密引擎使用说明

### JavaScript版加密引擎 (crypto_engine_js)

为了解决MIRACL库链接问题，我们提供了一个JavaScript实现版本的加密引擎，作为临时替代方案，
该实现与原C++版本保持相同的接口，但使用纯JavaScript实现。

#### 安装依赖

```bash
cd backend/lib/crypto_engine_js
npm install
```

#### 使用方式

在后端代码中引入:

```javascript
// 使用JavaScript版本的加密引擎而不是C++版本
const cryptoEngine = require('./lib/crypto_engine_js');

// 系统初始化
const initialized = cryptoEngine.systemSetup(128);

// 节点注册
const node = cryptoEngine.nodeRegistration('node1');

// 群组生成
const groupKey = cryptoEngine.groupGeneration(['node1', 'node2']);

// 其他操作...
```

#### 实现说明

JavaScript版加密引擎使用elliptic库来模拟双线性配对操作，并通过crypto-js提供哈希功能。
虽然JavaScript无法完全实现真正的双线性配对，但这个实现提供了功能上的近似，
足以用于前端开发和演示目的。

#### 注意事项1

这个JavaScript实现主要用于开发和测试，在没有解决MIRACL库链接问题之前作为临时替代方案。
对于生产环境，我们仍然推荐使用C++版本以获得更好的性能和安全性。
