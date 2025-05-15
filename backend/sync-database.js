const db = require("./models");
const cryptoEngine = require("./lib/crypto");

// 警告信息
console.log("警告: 此操作将清空并重建所有数据库表!");
console.log("按 Ctrl+C 取消，或等待 5 秒继续...");

// 等待 5 秒
setTimeout(async () => {
    try {
        console.log("开始重建数据库...");

        // 获取查询接口
        const queryInterface = db.sequelize.getQueryInterface();

        // 禁用外键约束检查
        console.log("禁用外键约束...");
        await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // 同步数据库，使用 force: true 选项重建所有表
        await db.sequelize.sync({ force: true });

        // 启用外键约束检查
        console.log("启用外键约束...");
        await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("数据库重建完成!");

        // 创建用户
        const users = await createUsers();

        console.log("数据初始化完成！系统已准备就绪。");
        process.exit(0);
    } catch (error) {
        console.error("数据库重建失败:", error);

        // 确保无论如何都重新启用外键约束
        try {
            await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        } catch (err) {
            console.error("重新启用外键约束失败:", err);
        }

        process.exit(1);
    }
}, 5000);

// 创建用户
async function createUsers() {
    console.log("创建用户...");
    const users = [];

    // 管理员账户
    const admin = await db.User.create({
        username: "admin",
        password: "admin123",
        role: "manager", // 管理员角色
    });
    users.push(admin);
    console.log("管理员账户创建完成! 用户名: admin, 密码: admin123");

    // 指定普通用户
    const user = await db.User.create({
        username: "user",
        password: "user123",
        role: "user", // 普通用户角色
    });
    users.push(user);
    console.log("普通用户账户创建完成! 用户名: user, 密码: user123");

    // 随机普通用户
    const randomNames = ["zhang", "wang", "liu"];
    for (let i = 0; i < 3; i++) {
        const randomUser = await db.User.create({
            username: `${randomNames[i]}`,
            password: `${randomNames[i]}123`,
            role: "user", // 普通用户角色
        });
        users.push(randomUser);
        console.log(
            `随机用户账户创建完成! 用户名: ${randomNames[i]}, 密码: ${randomNames[i]}123`
        );
    }

    console.log(`总共创建了 ${users.length} 个用户`);
    return users;
}
