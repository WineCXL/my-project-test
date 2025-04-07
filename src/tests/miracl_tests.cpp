#include <gtest/gtest.h>

extern "C" {
#include "../../libs/miracl/include/miracl.h"
}

class MiraclTest : public ::testing::Test {
protected:
    void SetUp() override {
        mip = mirsys(100, 0);
        mip->IOBASE = 10;
    }

    void TearDown() override {
        mirkill(a);
        mirkill(b);
        mirkill(c);
    }

    miracl *mip;
    big a, b, c;
};

TEST_F(MiraclTest, BasicArithmetic) {
    // 初始化大整数
    a = mirvar(0);
    b = mirvar(0);
    c = mirvar(0);

    // 测试加法
    cinstr(a, "12345");
    cinstr(b, "67890");
    add(a, b, c);
    EXPECT_STREQ("80235", cotstr(c, NULL));

    // 测试减法
    subtract(a, b, c);
    EXPECT_STREQ("-55545", cotstr(c, NULL));

    // 测试乘法
    multiply(a, b, c);
    EXPECT_STREQ("838102050", cotstr(c, NULL));

    // 测试除法
    divide(a, b, c);
    EXPECT_STREQ("0", cotstr(c, NULL));
}

TEST_F(MiraclTest, LargeNumbers) {
    // 初始化大整数
    a = mirvar(0);
    b = mirvar(0);
    c = mirvar(0);

    // 测试大数加法
    cinstr(a, "987654321098765432109876543210");
    cinstr(b, "123456789012345678901234567890");
    add(a, b, c);
    EXPECT_STREQ("1111111110111111111011111111100", cotstr(c, NULL));

    // 测试大数乘法
    multiply(a, b, c);
    EXPECT_STREQ("12193263113702179522618503273386624822642062263750", cotstr(c, NULL));
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
} 