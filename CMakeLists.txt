cmake_minimum_required(VERSION 3.10)
project(MIRACLTest)

# 设置C++标准
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 设置输出目录
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# 添加 MIRACL 源文件
set(MIRACL_SOURCES
    libs/miracl/source/big.cpp
    libs/miracl/source/ec2.cpp
    libs/miracl/source/gf2m.cpp
    libs/miracl/source/gf2m4x.cpp
    libs/miracl/source/ss2_pair.cpp
)

# 添加 MIRACL 库
add_library(miracl_core STATIC IMPORTED)
set_target_properties(miracl_core PROPERTIES
    IMPORTED_LOCATION ${CMAKE_CURRENT_SOURCE_DIR}/libs/miracl/lib/miracl.lib
)

# 添加 MIRACL 扩展库
add_library(miracl_ext STATIC ${MIRACL_SOURCES})

# 设置包含目录
target_include_directories(miracl_ext PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/libs/miracl/include
)

if(MSVC)
    target_compile_options(miracl_ext PRIVATE
        /utf-8 
        /wd4005  # 宏重定义警告
        /wd4311  # 指针截断警告
        /wd4244  # 可能丢失数据的转换
        /wd4267  # 可能丢失数据的转换
    )
    target_compile_definitions(miracl_ext PRIVATE
        _CRT_SECURE_NO_WARNINGS
        MR_PAIRING_SS2
        AES_SECURITY=128
    )
endif()

# 添加 scheme1 可执行文件
add_executable(scheme1 src/scheme1.cpp)

# 链接 MIRACL 库
target_link_libraries(scheme1 
    miracl_core
    miracl_ext
)

# 设置 scheme1 的编译选项
if(MSVC)
    target_compile_options(scheme1 PRIVATE
        /utf-8 
        /wd4005  # 宏重定义警告
        /wd4996  # 不安全函数警告
    )
    target_compile_definitions(scheme1 PRIVATE
        _CRT_SECURE_NO_WARNINGS
        MR_PAIRING_SS2
        AES_SECURITY=128
    )
endif()

# 设置 scheme1 的包含目录
target_include_directories(scheme1 PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/libs/miracl/include
)