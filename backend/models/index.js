const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 导入新模型
const User = require('./User');
const Node = require('./Node');
const Group = require('./Group');
const NodeGroup = require('./NodeGroup');
const { Document, Keyword } = require('./Document');

// 设置模型
db.User = User;
db.Node = Node;
db.Group = Group;
db.NodeGroup = NodeGroup;
db.Document = Document;
db.Keyword = Keyword;

// 为兼容旧代码设置别名
db.users = User;        // 用户模型别名
db.nodes = Node;        // 节点模型别名
db.groups = Group;      // 群组模型别名
db.nodeGroups = NodeGroup;

// 系统参数模型 - 精简版
db.SystemParam = sequelize.define('SystemParam', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'SystemParams'
});

// 为兼容旧代码设置别名
db.systemParams = db.SystemParam;
db.system_params = db.SystemParam;

// 陷门模型 - 论文方案核心
db.Trapdoor = sequelize.define('Trapdoor', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trapdoorId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  keyword: {
    type: Sequelize.STRING,
    allowNull: false
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  trapdoorValue: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  userId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'active'
  }
}, {
  timestamps: true
});

// 搜索记录模型
db.SearchRecord = sequelize.define('SearchRecord', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  keyword: {
    type: Sequelize.STRING,
    allowNull: true
  },
  trapdoor: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  result: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  searchTime: {
    type: Sequelize.DATE,
    allowNull: false
  },
  searcherId: {
    type: Sequelize.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

// 资源模型 - 论文方案核心
db.Resource = sequelize.define('Resource', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  resourceId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  resourceName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  resourceType: {
    type: Sequelize.STRING,
    allowNull: true
  },
  keywords: {
    type: Sequelize.JSON,
    allowNull: true
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  assignedNodeId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  encryptedRequest: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  allocationResult: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  metadataProtection: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'available'
  }
}, {
  timestamps: true
});

// 为兼容旧代码设置别名(移除roles)
db.resources = db.Resource;

// 资源与群组、节点和用户的关联
db.Resource.belongsTo(db.Group, { foreignKey: 'groupId', as: 'group' });
db.Resource.belongsTo(db.Node, { foreignKey: 'assignedNodeId', as: 'assignedNode' });
db.Resource.belongsTo(db.User, { foreignKey: 'userId' });

// 导出整个数据库对象
module.exports = db;
