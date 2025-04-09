const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入数据库模型
const db = require('./models');

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 简单路由
app.get('/', (req, res) => {
    res.json({ message: '欢迎使用可搜索加密元数据API' });
});

// 导入路由
require('./routes/system.routes')(app);
require('./routes/node.routes')(app);
require('./routes/group.routes')(app);
require('./routes/resource.routes')(app);
require('./routes/search.routes')(app);

// 同步数据库
db.sequelize.sync({ force: true }).then(() => {
    console.log('删除并重新创建数据库表');
    // 添加初始数据
    initialSetup();
}).catch((err) => {
    console.log('无法同步数据库:', err);
});

// 初始化数据
function initialSetup() {
    // 添加系统参数
    db.systemParams.create({
        name: "securityLevel",
        value: "medium",
        description: "系统安全级别",
        type: "string"
    });

    db.systemParams.create({
        name: "maxNodes",
        value: "100",
        description: "最大节点数",
        type: "number"
    });

    db.systemParams.create({
        name: "maxGroups",
        value: "20",
        description: "最大群组数",
        type: "number"
    });

    console.log("初始数据创建成功");
}

// 设置端口并启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});