# 设置CMake最低版本要求
cmake_minimum_required(VERSION 3.10)

# 设置项目名称
project(MIRACLTest)

# 设置C++标准为C++11
set(CMAKE_CXX_STANDARD 11)
# 强制要求支持指定的C++标准
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 设置输出目录 - 可执行文件输出到build/bin目录
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# 添加 MIRACL 库 - 导入预编译的静态库
add_library(miracl_core STATIC IMPORTED)
# 设置导入库的路径
set_target_properties(miracl_core PROPERTIES
    IMPORTED_LOCATION ${CMAKE_CURRENT_SOURCE_DIR}/libs/miracl/lib/miracl.lib
)

# 添加 MIRACL 源文件 - 这些是需要编译的MIRACL库核心组件
set(MIRACL_SOURCES
    libs/miracl/source/big.cpp      # 大整数运算
    libs/miracl/source/ec2.cpp      # 椭圆曲线运算
    libs/miracl/source/gf2m.cpp     # 有限域GF(2^m)运算
    libs/miracl/source/gf2m4x.cpp   # GF(2^m)扩展运算
    libs/miracl/source/ss2_pair.cpp # SS2配对运算
)

# 添加 MIRACL 扩展库 - 使用上面定义的源文件创建静态库
add_library(miracl_ext STATIC ${MIRACL_SOURCES})

# 设置包含目录 - 为miracl_ext库添加头文件搜索路径
target_include_directories(miracl_ext PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/libs/miracl/include
)

# 如果使用MSVC编译器(Visual Studio)
if(MSVC)
    # 为miracl_ext库设置特定的编译选项
    target_compile_options(miracl_ext PRIVATE
        /utf-8                      # 使用UTF-8编码
        /wd4005                     # 禁用宏重定义警告
        /wd4311                     # 禁用指针截断警告
        /wd4244                     # 禁用可能丢失数据的转换警告
        /wd4267                     # 禁用可能丢失数据的转换警告(size_t到int)
    )
    # 为miracl_ext库定义预处理宏
    target_compile_definitions(miracl_ext PRIVATE
        _CRT_SECURE_NO_WARNINGS     # 禁用不安全函数警告
        MR_PAIRING_SS2              # 使用SS2配对类型
        AES_SECURITY=128            # 设置AES安全级别为128位
    )
endif()

# 添加 scheme1 可执行文件 - 使用src/scheme1.cpp源文件创建可执行文件
add_executable(scheme1 src/scheme1.cpp)

# 链接 MIRACL 库 - 将miracl_core和miracl_ext库链接到scheme1可执行文件
target_link_libraries(scheme1 
    miracl_core                     # 预编译的MIRACL核心库
    miracl_ext                      # 自定义编译的MIRACL扩展库
)

# 设置 scheme1 的编译选项 - 如果使用MSVC编译器(Visual Studio)
if(MSVC)
    # 为scheme1设置特定的编译选项
    target_compile_options(scheme1 PRIVATE
        /utf-8                      # 使用UTF-8编码
        /wd4005                     # 禁用宏重定义警告
        /wd4996                     # 禁用不安全函数警告
    )
    # 为scheme1定义预处理宏
    target_compile_definitions(scheme1 PRIVATE
        _CRT_SECURE_NO_WARNINGS     # 禁用不安全函数警告
        MR_PAIRING_SS2              # 使用SS2配对类型
        AES_SECURITY=128            # 设置AES安全级别为128位
    )
endif()

# 设置 scheme1 的包含目录 - 为scheme1添加头文件搜索路径
target_include_directories(scheme1 PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/libs/miracl/include
)