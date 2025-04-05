cmake_minimum_required(VERSION 3.10)
project(MIRACLTest)

# 设置C++标准（可选）
set(CMAKE_CXX_STANDARD 11)

# 包含MIRACL头文件
include_directories(libs/miracl/include)

# 链接MIRACL库
link_directories(libs/miracl/lib/Release)

# 添加可执行文件
add_executable(${PROJECT_NAME} src/main.cpp)

# 链接库
target_link_libraries(${PROJECT_NAME} miracl.lib)