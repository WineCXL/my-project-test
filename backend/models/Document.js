const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * 关键词模型 - 存储加密关键词及相关陷门值
 *
 * 每条记录代表一个关键词的加密形式
 * 包含关键词的两个主要加密部分(X,Y)和陷门值
 */
const Keyword = sequelize.define(
    "Keyword",
    {
        // 主键
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "自增主键ID",
        },
        // 关键词ID
        keywordId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: "关键词ID",
        },
        // 关键词X部分 - 64位十六进制字符串
        keywordX: {
            type: DataTypes.STRING(64),
            allowNull: false,
            comment: "加密关键词X部分",
        },
        // 关键词Y部分 - 32位十六进制字符串
        keywordY: {
            type: DataTypes.STRING(32),
            allowNull: false,
            comment: "加密关键词Y部分",
        },
        // 关键词的陷门值
        trapdoorValue: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: "关键词对应陷门值",
        },
        // 所属群组ID，外键关联到Group表
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Groups",
                key: "id",
            },
            comment: "关键词所属的群组ID",
        }
    },
    {
        timestamps: true,
        // 只保留 createdAt 字段
        updatedAt: false,
        comment: "关键词表",
    }
);

/**
 * 文档模型 - 存储用户上传的文档信息
 *
 * 每条记录代表一个用户上传的文档
 * 包含文档标题、内容及其关联的关键词和所有者
 */
const Document = sequelize.define(
    "Document",
    {
        // 主键
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "自增主键ID",
        },
        // 文档ID
        documentId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: "文档ID",
        },
        // 文档标题
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "文档标题",
        },
        // 文档内容
        content: {
            type: DataTypes.STRING(64),
            allowNull: false,
            comment: "文档内容",
        },
        // 关联的关键词ID，外键关联到Keyword表
        keywordId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Keywords",
                key: "id",
            },
            comment: "文档关联的关键词ID",
        },
        // 所有者用户ID，外键关联到User表
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Users",
                key: "id",
            },
            comment: "文档所有者的用户ID",
        }
    },
    {
        timestamps: true,
        // 只保留 createdAt 字段
        updatedAt: false,
        comment: "文档表",
        indexes: [
            // 为userId添加索引，提高按用户查询的性能
            {
                fields: ["userId"],
            },
            // 为keywordId添加索引
            {
                fields: ["keywordId"],
            },
        ],
    }
);

/**
 * 文档关键词模型 - 存储文档处理状态和匹配结果
 *
 * 每条记录代表一个文档的处理状态和匹配结果
 * 记录文档与关键词的关联关系以及处理该任务的节点组
 */
const DocumentKeyword = sequelize.define(
    "DocumentKeyword",
    {
        // 主键
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: "自增主键ID",
        },
        // 文档ID，外键关联到Document表
        documentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Documents",
                key: "id",
            },
            comment: "关联的文档ID",
        },
        // 关键词ID，外键关联到Keyword表
        keywordId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Keywords",
                key: "id",
            },
            comment: "关联的关键词ID",
        },
        // 关键词匹配结果
        keywordMatched: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: null,
            comment: "关键词是否匹配成功",
        },
        // 文档处理状态
        status: {
            type: DataTypes.ENUM("pending", "executing", "completed", "error"),
            defaultValue: "pending",
            comment: "文档处理状态: 等待中、执行中、已完成、异常",
        },
        // 处理该任务的节点组ID，外键关联到Group表
        assignedGroupId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Groups",
                key: "id",
            },
            comment: "负责处理该任务的节点组ID",
        }
    },
    {
        timestamps: true,
        comment: "文档关键词匹配表",
        indexes: [
            // 为documentId添加唯一索引，确保一个文档只有一条记录
            {
                unique: true,
                fields: ["documentId"],
            },
            // 为assignedGroupId添加索引
            {
                fields: ["assignedGroupId"],
            },
        ],
    }
);

// 建立模型之间的关联关系
// DocumentKeyword 与 Document 的关联
DocumentKeyword.belongsTo(Document, { foreignKey: 'documentId' });
Document.hasMany(DocumentKeyword, { foreignKey: 'documentId' });

// DocumentKeyword 与 Keyword 的关联
DocumentKeyword.belongsTo(Keyword, { foreignKey: 'keywordId' });
Keyword.hasMany(DocumentKeyword, { foreignKey: 'keywordId' });

// Document 与 Keyword 的关联
Document.belongsTo(Keyword, { foreignKey: 'keywordId' });
Keyword.hasMany(Document, { foreignKey: 'keywordId' });

// 导出模型
module.exports = { Document, Keyword, DocumentKeyword };
