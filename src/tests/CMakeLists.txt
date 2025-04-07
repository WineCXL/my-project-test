# 添加Google Test
include(FetchContent)
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG release-1.12.1
)
FetchContent_MakeAvailable(googletest)

# 添加测试可执行文件
add_executable(miracl_tests
    miracl_tests.cpp
)

# 链接测试库
target_link_libraries(miracl_tests
    PRIVATE
    miracl
    GTest::gtest_main
)

# 添加测试
add_test(NAME miracl_tests COMMAND miracl_tests) 