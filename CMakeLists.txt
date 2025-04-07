cmake_minimum_required(VERSION 3.10)
project(MIRACLTest VERSION 1.0.0 LANGUAGES C CXX)

# 设置C++标准
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# 设置项目版本
set(PROJECT_VERSION_MAJOR 1)
set(PROJECT_VERSION_MINOR 0)
set(PROJECT_VERSION_PATCH 0)

# 输出目录设置
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# 安装目录设置
set(CMAKE_INSTALL_PREFIX ${CMAKE_BINARY_DIR}/install)
set(INSTALL_BIN_DIR bin)
set(INSTALL_LIB_DIR lib)
set(INSTALL_INCLUDE_DIR include)
set(INSTALL_DOC_DIR share/doc)

# 添加核心MIRACL源文件 - 这些文件是MIRACL库的核心部分
file(GLOB MIRACL_CORE_SOURCES 
    "libs/miracl/source/mrcore.c"
    "libs/miracl/source/mrarth0.c"
    "libs/miracl/source/mrarth1.c"
    "libs/miracl/source/mrarth2.c"
    "libs/miracl/source/mrarth3.c"
    "libs/miracl/source/mrio1.c"
    "libs/miracl/source/mrio2.c"
    "libs/miracl/source/mrgcd.c"
    "libs/miracl/source/mrjack.c"
    "libs/miracl/source/mrxgcd.c"
    "libs/miracl/source/mrrand.c"
    "libs/miracl/source/mrprime.c"
    "libs/miracl/source/mrcrt.c"
    "libs/miracl/source/mrscrt.c"
    "libs/miracl/source/mrmonty.c"
    "libs/miracl/source/mrpower.c"
    "libs/miracl/source/mrsroot.c"
    "libs/miracl/source/mrmuldv.c"
)

# 添加大整数和基本运算相关源文件
file(GLOB MIRACL_BIG_SOURCES
    "libs/miracl/source/mrbits.c"
    "libs/miracl/source/mrshs.c"
    "libs/miracl/source/mrshs256.c"
    "libs/miracl/source/mrshs512.c"
    "libs/miracl/source/mrsha3.c"
    "libs/miracl/source/mralloc.c"
    "libs/miracl/source/mrsmall.c"
    "libs/miracl/source/mrbuild.c"
    "libs/miracl/source/mrfast.c"
)

# 添加椭圆曲线和高级功能相关源文件
file(GLOB MIRACL_CURVE_SOURCES
    "libs/miracl/source/mrcurve.c"
    "libs/miracl/source/mrbrick.c"
    "libs/miracl/source/mrebrick.c"
    "libs/miracl/source/mrec2m.c"
    "libs/miracl/source/mrgf2m.c"
    "libs/miracl/source/mraes.c"
    "libs/miracl/source/mrlucas.c"
    "libs/miracl/source/mrstrong.c"
    "libs/miracl/source/mrzzn2.c"
    "libs/miracl/source/mrzzn3.c"
    "libs/miracl/source/mrzzn4.c"
    "libs/miracl/source/mrecn2.c"
)

# 添加浮点和闪存功能相关源文件
file(GLOB MIRACL_FLASH_SOURCES
    "libs/miracl/source/mrflash.c"
    "libs/miracl/source/mrfrnd.c"
    "libs/miracl/source/mrdouble.c"
    "libs/miracl/source/mrflsh1.c"
    "libs/miracl/source/mrflsh2.c"
    "libs/miracl/source/mrflsh3.c"
    "libs/miracl/source/mrflsh4.c"
    "libs/miracl/source/mrround.c"
    "libs/miracl/source/mrpi.c"
)

# 合并所有MIRACL源文件
set(MIRACL_SOURCES 
    ${MIRACL_CORE_SOURCES}
    ${MIRACL_BIG_SOURCES}
    ${MIRACL_CURVE_SOURCES}
    ${MIRACL_FLASH_SOURCES}
)

# 创建C编译器选项 - 适用于MIRACL
if(MSVC)
    # Visual Studio编译器选项
    add_compile_options(/W3 /wd4996 /wd4311 /wd4101 /wd4819)
    
    # 定义宏以解决64位编译问题
    add_definitions(
        -D_CRT_SECURE_NO_WARNINGS 
        -D_MBCS 
        -D_LIB
        -DMRSC  # 强制使用C实现的乘法函数
        -DWIN64  # 指定为64位Windows
    )
else()
    # GCC/Clang编译器选项
    add_compile_options(-Wall -Wno-deprecated -Wno-unused-but-set-variable)
endif()

# 复制 mirdef 配置文件 - 针对64位Windows系统
configure_file(
    ${CMAKE_SOURCE_DIR}/libs/miracl/include/mirdef.w64
    ${CMAKE_SOURCE_DIR}/libs/miracl/include/mirdef.h
    COPYONLY
)

# 包含目录
include_directories(
    ${CMAKE_SOURCE_DIR}/libs/miracl/include
    ${CMAKE_SOURCE_DIR}/include
)

# 创建MIRACL静态库
add_library(miracl STATIC ${MIRACL_SOURCES})

# 设置库的属性
set_target_properties(miracl PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION ${PROJECT_VERSION_MAJOR}
    ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
    COMPILE_FLAGS "/TC"
)

# 安装MIRACL库
install(TARGETS miracl
    EXPORT miracl-targets
    LIBRARY DESTINATION ${INSTALL_LIB_DIR}
    ARCHIVE DESTINATION ${INSTALL_LIB_DIR}
    RUNTIME DESTINATION ${INSTALL_BIN_DIR}
)

# 安装头文件
install(DIRECTORY ${CMAKE_SOURCE_DIR}/libs/miracl/include/
    DESTINATION ${INSTALL_INCLUDE_DIR}/miracl
    FILES_MATCHING PATTERN "*.h"
)

# 添加示例可执行文件
add_executable(miracl_example src/miracl_example.cpp)

# 链接MIRACL库
target_link_libraries(miracl_example miracl)

# 设置示例可执行文件的属性
set_target_properties(miracl_example PROPERTIES
    COMPILE_FLAGS "/TP /utf-8"
)

# 安装示例程序
install(TARGETS miracl_example
    RUNTIME DESTINATION ${INSTALL_BIN_DIR}
)

# 添加自定义命令，确保在构建前mirdef.h存在
add_custom_command(
    TARGET miracl PRE_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
    ${CMAKE_SOURCE_DIR}/libs/miracl/include/mirdef.w64
    ${CMAKE_SOURCE_DIR}/libs/miracl/include/mirdef.h
)

# 提示信息
message(STATUS "配置完成。您可以使用以下命令构建项目：")
message(STATUS "  mkdir build && cd build")
message(STATUS "  cmake ..")
message(STATUS "  cmake --build . --config Debug")
message(STATUS "  cmake --install . --config Debug")
message(STATUS "或者直接在Visual Studio中打开文件夹并使用CMake集成功能。") 