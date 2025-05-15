const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * NodeGroup模型 - 用于存储节点组关系及零知识证明相关的随机数
 *
 * 每条记录代表一个节点和一个群组之间的关系
 * 记录了该节点与同组内其他节点的关系，包括其他节点的随机数xi
 */
const NodeGroup = sequelize.define(
    "NodeGroup",
    {
        // 复合主键: group_id 和 node_id
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        // 群组ID，外键关联到Group表
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Groups",
                key: "id",
            },
        },
        // 节点ID，外键关联到Node表
        nodeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Nodes",
                key: "id",
            },
        },
        // 节点在群组中的索引位置 (1-4)
        nodeIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 4,
            },
            comment: "节点在群组中的索引位置 (1-4)",
        },
        // 群组第1个节点的随机数
        node1RandomNumber: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "群组第1个节点的随机数xi",
        },
        // 群组第2个节点的随机数
        node2RandomNumber: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "群组第2个节点的随机数xi",
        },
        // 群组第3个节点的随机数
        node3RandomNumber: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "群组第3个节点的随机数xi",
        },
        // 群组第4个节点的随机数
        node4RandomNumber: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "群组第4个节点的随机数xi",
        },
    },
    {
        timestamps: true,
        comment: "节点节点组关联表",
        indexes: [
            // 创建复合唯一索引，保证每个节点在一个群组中只有一条记录
            {
                unique: true,
                fields: ["groupId", "nodeId"],
            },
            // 添加索引以便按groupId和nodeIndex排序和查找
            {
                fields: ["groupId", "nodeIndex"],
            },
        ],
    }
);

module.exports = NodeGroup;
