const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * 群组模型 - 存储节点群组信息及其公钥
 *
 * 每条记录代表一个节点群组
 * 包含群组标识、名称、状态以及用于加密的公钥
 */
const Group = sequelize.define(
    "Group",
    {
        // 主键
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "自增主键ID",
        },
        // 群组ID
        groupId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: "群组ID",
        },
        // 群组名称
        groupName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "群组名称",
        },
        // 群组公钥R部分 - 64位十六进制字符串
        publicKeysR: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "群组公钥R部分",
        },
        // 群组公钥Phi部分 - 32位十六进制字符串
        publicKeysPhi: {
            type: DataTypes.STRING(32),
            allowNull: true,
            comment: "群组公钥Phi部分",
        },
        // 群组状态
        status: {
            type: DataTypes.ENUM("idle", "busy", "error"), // 空闲、占用、异常
            defaultValue: "idle",
            comment: "群组状态: 空闲、占用、异常",
        },
    },
    {
        timestamps: true,
        comment: "群组表",
    }
);

module.exports = Group;
