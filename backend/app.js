
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const nodeRoutes = require('./routes/node.routes');
const groupRoutes = require('./routes/group.routes');
const systemRoutes = require('./routes/system.routes');
const resourceRoutes = require('./routes/resource.routes');
const searchRoutes = require('./routes/search.routes');
const trapdoorRoutes = require('./routes/trapdoor.routes');
const db = require('./models/index');
const cryptoEngine = require('./lib/crypto');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 测试数据库连接
sequelize.authenticate()
  .then(() => console.log('MySQL 数据库连接成功 (端口: 3306)'))
  .catch(err => console.error('MySQL 数据库连接失败:', err));

// 启动文档执行状态检查定时任务
setupExecutionTimer();

// 路由
require('./routes/auth.routes')(app);
require('./routes/system.routes')(app);
require('./routes/resource.routes')(app);
require('./routes/user.routes')(app);

app.use('/api/nodes', nodeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/trapdoor', trapdoorRoutes);

// 测试加密引擎路由
app.get('/api/test/crypto', async (req, res) => {
  try {
    // 系统初始化
    const systemInitialized = cryptoEngine.systemSetup(128);

    // 节点注册
    const node1 = cryptoEngine.nodeRegistration('node1');
    const node2 = cryptoEngine.nodeRegistration('node2');

    // 群组生成
    const groupKey = cryptoEngine.groupGeneration([node1.id, node2.id]);

    // 关键词封装
    const keyword = "test_keyword";
    const metadata = "test_metadata";
    const encapsulatedData = cryptoEngine.encapsulateKeyword(keyword, metadata);

    // 生成搜索令牌
    // 注意: 这里使用第一个群组的ID，在实际应用中，可能需要传入正确的群组ID
    const groupId = "group_" + Date.now() + "_0"; // 模拟一个群组ID
    const searchToken = cryptoEngine.searchTokenGeneration(keyword, groupId);

    // 返回测试结果
    res.json({
      systemSetup: systemInitialized,
      nodes: [node1, node2],
      groupKey,
      encapsulatedData,
      searchToken,
      message: "JavaScript版加密引擎测试路由工作正常"
    });
  } catch (error) {
    console.error("加密引擎测试失败:", error);
    res.status(500).json({
      success: false,
      message: "加密引擎测试失败",
      error: error.message
    });
  }
});

// 添加健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器正常运行' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// API服务器端口设置为3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`后端API服务器运行在端口 ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
  console.log(`测试加密引擎: http://localhost:${PORT}/api/test/crypto`);
});

// 定时任务：检查执行中的文档，2分钟后自动完成并释放资源
function setupExecutionTimer() {
  // 每30秒检查一次
  setInterval(async () => {
    try {
      // 刷新系统状态
      console.log('正在刷新系统状态...');

      // 查找所有执行中的文档，且已分配了群组的
      const executingDocs = await db.Document.findAll({
        where: {
          executionStatus: 'executing',
          assignedGroupId: { [db.Sequelize.Op.ne]: null }
        }
      });

      if (executingDocs.length > 0) {
        console.log(`检查到 ${executingDocs.length} 个执行中的文档`);
      }

      const now = Date.now();
      let completedCount = 0;

      for (const doc of executingDocs) {
        // 获取创建时间
        const createdAt = new Date(doc.createdAt).getTime();

        // 计算时间差（毫秒）
        const timeDiff = now - createdAt;

        // 如果已经超过2分钟（120秒 = 120000毫秒）
        if (timeDiff >= 120000) {
          // 将执行状态更新为已完成
          await doc.update({ executionStatus: 'completed' });
          completedCount++;

          // 释放对应的群组资源
          if (doc.assignedGroupId) {
            const group = await db.Group.findByPk(doc.assignedGroupId);
            if (group && group.status === 'busy') {
              await group.update({ status: 'idle' });
              console.log(`文档#${doc.id} 执行完成，释放群组#${group.id} (${group.groupName})`);
            }
          }
        }
      }

      if (completedCount > 0) {
        console.log(`自动完成了 ${completedCount} 个文档的执行过程`);
      }
    } catch (error) {
      console.error('执行状态检查失败:', error);
    }
  }, 30000); // 每30秒检查一次

  console.log('文档执行状态自动检查定时任务已启动，每30秒刷新系统状态一次');
}

