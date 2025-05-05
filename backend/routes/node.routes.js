/**
 * 边缘节点路由模块
 *
 * 负责处理边缘节点的注册、查询和管理等功能
 * 实现基于《Metadata-Private Resource Allocation in Edge Computing Withstands Semi-Malicious Edge Nodes》论文
 * 边缘节点是系统的基础计算单元，可以组织成群组执行加密计算任务
 */
const express = require('express');
const router = express.Router();
const db = require('../models');
const Node = db.Node;

/**
 * 获取所有节点列表
 * GET /api/nodes
 *
 * 返回系统中所有注册的边缘节点
 */
router.get('/', async (req, res) => {
  try {
    const nodes = await Node.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('获取节点列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取节点列表失败'
    });
  }
});

/**
 * 获取单个节点详情
 * GET /api/nodes/:id
 *
 * 返回特定节点的详细信息
 * @param {string} id - 节点ID
 */
router.get('/:id', async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '节点不存在'
      });
    }
    res.json({ success: true, data: node });
  } catch (error) {
    console.error('获取节点详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取节点详情失败'
    });
  }
});

/**
 * 创建新节点
 * POST /api/nodes
 *
 * 创建新的边缘节点记录
 * @body {string} nodeId - 节点唯一标识符
 * @body {string} nodeName - 节点名称
 * @body {string} [publicKey] - 节点公钥（可选）
 * @body {string} [randomNumber] - 节点随机数（可选）
 */
router.post('/', async (req, res) => {
  try {
    const { nodeId, nodeName, publicKey, randomNumber } = req.body;

    // 检查节点ID是否已存在
    const existingNode = await Node.findOne({ where: { nodeId } });
    if (existingNode) {
      return res.status(400).json({
        success: false,
        message: '节点ID已存在'
      });
    }

    // 创建新节点
    const newNode = await Node.create({
      nodeId,
      nodeName,
      publicKey,
      randomNumber,
      status: 'idle'
    });

    res.status(201).json({
      success: true,
      message: '节点创建成功',
      data: newNode
    });
  } catch (error) {
    console.error('创建节点失败:', error);
    res.status(500).json({
      success: false,
      message: '创建节点失败'
    });
  }
});

/**
 * 注册节点
 * POST /api/nodes/register
 *
 * 注册新节点或更新已存在节点的信息
 * 实现论文中的EdgeNodeReg算法，生成节点密钥和随机数
 * @body {string} nodeId - 节点唯一标识符
 * @body {string} nodeName - 节点名称
 * @body {string} [publicKey] - 节点公钥（可选）
 * @body {string} [randomNumber] - 节点随机数（可选）
 */
router.post('/register', async (req, res) => {
  try {
    const { nodeId, nodeName, publicKey } = req.body;

    // 检查节点ID是否已存在
    let node = await Node.findOne({ where: { nodeId } });

    if (node) {
      // 更新现有节点
      node = await node.update({
        nodeName: nodeName || node.nodeName,
        publicKey: publicKey || node.publicKey,
        status: 'idle'
      });

      return res.json({
        success: true,
        message: '节点更新成功',
        data: node
      });
    }

    // 创建新节点
    node = await Node.create({
      nodeId,
      nodeName: nodeName || `节点-${nodeId}`,
      publicKey,
      status: 'idle'
    });

    res.status(201).json({
      success: true,
      message: '节点注册成功',
      data: node
    });
  } catch (error) {
    console.error('节点注册失败:', error);
    res.status(500).json({
      success: false,
      message: '节点注册失败'
    });
  }
});

/**
 * 更新节点信息
 * PUT /api/nodes/:id
 *
 * 更新特定节点的信息
 * @param {string} id - 要更新的节点ID
 * @body {string} [nodeName] - 新的节点名称
 * @body {string} [publicKey] - 新的公钥
 * @body {string} [randomNumber] - 新的随机数
 * @body {string} [status] - 新的状态
 */
router.put('/:id', async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '节点不存在'
      });
    }

    // 更新节点信息
    await node.update(req.body);

    res.json({
      success: true,
      message: '节点更新成功',
      data: node
    });
  } catch (error) {
    console.error('更新节点失败:', error);
    res.status(500).json({
      success: false,
      message: '更新节点失败'
    });
  }
});

/**
 * 删除节点
 * DELETE /api/nodes/:id
 *
 * 从系统中删除特定节点
 * @param {string} id - 要删除的节点ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '节点不存在'
      });
    }

    await node.destroy();

    res.json({
      success: true,
      message: '节点删除成功'
    });
  } catch (error) {
    console.error('删除节点失败:', error);
    res.status(500).json({
      success: false,
      message: '删除节点失败'
    });
  }
});

module.exports = router;
