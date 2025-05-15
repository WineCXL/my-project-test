const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * 节点模型 - 存储系统中的节点信息
 *
 * 每条记录代表系统中的一个计算节点
 * 包含节点标识、名称、私钥、随机数及其所属群组
 */
const Node = sequelize.define(
    "Node",
    {
        // 主键
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "自增主键ID",
        },
        // 节点ID
        nodeId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: "节点ID",
        },
        // 节点名称
        nodeName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "节点名称",
        },
        // 节点私钥
        privateKey: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "节点私钥si",
        },
        // 节点随机数
        randomNumber: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "节点随机数xi",
        },
        // 节点状态
        status: {
            type: DataTypes.ENUM("idle", "busy", "error"),
            defaultValue: "idle",
            comment: "节点状态: 空闲、占用、异常",
        },
        // 所属群组ID，外键关联到Group表
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Groups",
                key: "id",
            },
            comment: "节点所属的群组ID，可为空表示备用节点",
        },
    },
    {
        timestamps: true,
        comment: "节点表",
        indexes: [
            // 为groupId添加索引
            {
                fields: ["groupId"],
            },
        ],
    }
);

module.exports = Node;
