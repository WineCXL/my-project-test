const express = require('express');
const router = express.Router();
const db = require('../models');
const { Group, NodeGroup } = db;
const Node = db.Node;
const { Op } = require('sequelize');
const groupController = require('../controllers/core/group.controller');

// 获取所有群组
router.get('/', async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [
        {
          model: Node,
          through: { attributes: [] } // 不返回中间表数据
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('获取群组列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取群组列表失败'
    });
  }
});

// 获取单个群组
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [
        {
          model: Node,
          through: { attributes: ['role'] }
        }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    res.json({ success: true, data: group });
  } catch (error) {
    console.error('获取群组详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取群组详情失败'
    });
  }
});

// 创建群组
router.post('/', async (req, res) => {
  try {
    const { name, description, secretKey, nodeIds } = req.body;

    // 检查群组名称是否已存在
    const existingGroup = await Group.findOne({ where: { name } });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: '群组名称已存在'
      });
    }

    // 生成唯一的群组ID
    const groupId = 'group_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    // 创建新群组
    const newGroup = await Group.create({
      groupId,
      name,
      description,
      secretKey,
      status: 'active'
    });

    // 如果提供了节点IDs，将节点添加到群组
    if (nodeIds && Array.isArray(nodeIds) && nodeIds.length > 0) {
      const nodes = await Node.findAll({
        where: {
          id: {
            [Op.in]: nodeIds
          }
        }
      });

      // 添加节点到群组
      await Promise.all(nodes.map(node => {
        return newGroup.addNode(node, { through: { role: 'member' } });
      }));
    }

    // 返回创建的群组（包含关联的节点）
    const groupWithNodes = await Group.findByPk(newGroup.id, {
      include: [
        {
          model: Node,
          through: { attributes: ['role'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '群组创建成功',
      data: groupWithNodes
    });
  } catch (error) {
    console.error('创建群组失败:', error);
    res.status(500).json({
      success: false,
      message: '创建群组失败'
    });
  }
});

// 更新群组
router.put('/:id', async (req, res) => {
  try {
    const { name, description, secretKey, status, nodeIds } = req.body;
    const groupId = req.params.id;

    // 检查群组是否存在
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 如果更新了名称，检查名称是否已存在
    if (name && name !== group.name) {
      const existingGroup = await Group.findOne({
        where: {
          name,
          id: { [Op.ne]: groupId }
        }
      });

      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: '群组名称已存在'
        });
      }
    }

    // 更新群组信息
    await group.update({
      name: name || group.name,
      description: description !== undefined ? description : group.description,
      secretKey: secretKey || group.secretKey,
      status: status || group.status
    });

    // 如果提供了节点IDs，更新群组节点
    if (nodeIds && Array.isArray(nodeIds)) {
      // 先移除所有现有节点
      await NodeGroup.destroy({
        where: { GroupId: groupId }
      });

      // 添加新节点
      if (nodeIds.length > 0) {
        const nodes = await Node.findAll({
          where: {
            id: {
              [Op.in]: nodeIds
            }
          }
        });

        // 添加节点到群组
        await Promise.all(nodes.map(node => {
          return group.addNode(node, { through: { role: 'member' } });
        }));
      }
    }

    // 返回更新后的群组（包含关联的节点）
    const updatedGroup = await Group.findByPk(groupId, {
      include: [
        {
          model: Node,
          through: { attributes: ['role'] }
        }
      ]
    });

    res.json({
      success: true,
      message: '群组更新成功',
      data: updatedGroup
    });
  } catch (error) {
    console.error('更新群组失败:', error);
    res.status(500).json({
      success: false,
      message: '更新群组失败'
    });
  }
});

// 删除群组
router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    await group.destroy();

    res.json({
      success: true,
      message: '群组删除成功'
    });
  } catch (error) {
    console.error('删除群组失败:', error);
    res.status(500).json({
      success: false,
      message: '删除群组失败'
    });
  }
});

// 添加节点到群组
router.post('/:groupId/nodes/:nodeId', async (req, res) => {
  try {
    const { groupId, nodeId } = req.params;
    const { role = 'member' } = req.body;

    // 检查群组是否存在
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 检查节点是否存在
    const node = await Node.findByPk(nodeId);
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '节点不存在'
      });
    }

    // 检查节点是否已在群组中
    const nodeGroup = await NodeGroup.findOne({
      where: {
        GroupId: groupId,
        NodeId: nodeId
      }
    });

    if (nodeGroup) {
      // 更新角色
      await nodeGroup.update({ role });
      return res.json({
        success: true,
        message: '节点角色更新成功'
      });
    }

    // 添加节点到群组
    await group.addNode(node, { through: { role } });

    res.json({
      success: true,
      message: '节点添加到群组成功'
    });
  } catch (error) {
    console.error('添加节点到群组失败:', error);
    res.status(500).json({
      success: false,
      message: '添加节点到群组失败'
    });
  }
});

// 从群组移除节点
router.delete('/:groupId/nodes/:nodeId', async (req, res) => {
  try {
    const { groupId, nodeId } = req.params;

    // 检查群组是否存在
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 检查节点是否存在
    const node = await Node.findByPk(nodeId);
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '节点不存在'
      });
    }

    // 移除节点
    await NodeGroup.destroy({
      where: {
        GroupId: groupId,
        NodeId: nodeId
      }
    });

    res.json({
      success: true,
      message: '节点已从群组移除'
    });
  } catch (error) {
    console.error('从群组移除节点失败:', error);
    res.status(500).json({
      success: false,
      message: '从群组移除节点失败'
    });
  }
});

// 验证节点身份
router.get('/:groupId/nodes/:nodeId/verify', groupController.verifyNodeIdentity);

module.exports = router;
