const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
    "graduation_db", // 数据库名
    "root", // 用户名
    "C122266679ing", // 密码
    {
        host: "localhost",
        port: 3306, // MySQL端口
        dialect: "mysql",
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

module.exports = sequelize;
