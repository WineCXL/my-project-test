# My First Git Project
仅用于测试 Miracl 库是否被正确安装并能够调用

## 文件结构
#### 表现形式1
```plaintext
MIRACLTest/                  # 项目根目录
├─ .gitignore                # Git忽略文件
├─ CMakeLists.txt            # CMake主配置文件
├─ libs/                     # 第三方库目录
│  └─ miracl/                # MIRACL库文件
│     ├─ include/            # 头文件（从MIRACL源码复制）
│     └─ lib/
│        └─ Release/         # 静态库 miracl.lib
├─ src/                      # 项目源代码
│  └─ main.cpp               # 测试代码
└─ README.md                 # 项目说明（可选）
```

- - -

#### 表现形式2
- MIRACLTest/                (项目根目录)
  - `.gitignore`             (Git忽略文件)
  - `CMakeLists.txt`         (CMake主配置文件)
  - `libs/`                  (第三方库目录)  
    - `miracl/`              (MIRACL库文件)  
      - `include/`           (头文件)  
      - `lib/`  
        - `Release/`         (静态库 `miracl.lib` ) 
  - `src/`                   (项目源代码)  
    - `main.cpp`             (测试代码)  
  - `README.md`              (项目说明)

