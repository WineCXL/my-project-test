const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: false,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 导入模型
db.systemParams = require("./system.model.js")(sequelize, Sequelize);
db.nodes = require("./node.model.js")(sequelize, Sequelize);
db.groups = require("./group.model.js")(sequelize, Sequelize);
db.resources = require("./resource.model.js")(sequelize, Sequelize);
db.searches = require("./search.model.js")(sequelize, Sequelize);

// 设置关联关系
db.groups.belongsToMany(db.nodes, { through: 'group_nodes' });
db.nodes.belongsToMany(db.groups, { through: 'group_nodes' });

db.resources.belongsTo(db.groups);
db.groups.hasMany(db.resources);

db.searches.belongsTo(db.groups);
db.groups.hasMany(db.searches);

module.exports = db; 