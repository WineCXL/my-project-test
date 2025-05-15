const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * 用户模型 - 存储系统用户信息
 *
 * 每条记录代表系统中的一个用户账户
 * 包含用户名、密码和角色信息
 */
const User = sequelize.define(
    "User",
    {
        // 主键
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "自增主键ID",
        },
        // 用户名称
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 20],
            },
            comment: "用户名称",
        },
        // 用户密码
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "用户密码",
        },
        // 用户类型
        role: {
            type: DataTypes.ENUM("manager", "user"),
            allowNull: false,
            defaultValue: "user",
            comment: "用户类型",
        },
    },
    {
        timestamps: true,
        comment: "用户表",
    }
);

// 实例方法 - 验证密码
User.prototype.validatePassword = function (password) {
    return this.password === password;
};

module.exports = User;
