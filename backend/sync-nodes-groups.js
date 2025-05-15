/**
 * 节点和群组批量创建脚本
 * 用于在已初始化的数据库上批量创建测试节点和群组
 * 使用与前端一致的API接口
 */

const axios = require('axios');
const readline = require('readline');

// API配置
const API_BASE_URL = 'http://localhost:3000/api'; // 根据实际情况修改
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 创建命令行交互界面
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 配置选项
const config = {
    nodeCount: 20,          // 要创建的节点数量
    groupCount: 3,          // 要创建的群组数量
    nodesPerGroup: 4,       // 每个群组的节点数量
    nodePrefix: 'node-',    // 节点ID前缀
    groupPrefix: 'group-'   // 群组ID前缀
};

/**
 * 创建单个节点
 * @param {string} nodeId 节点ID
 * @param {string} nodeName 节点名称
 * @returns {Promise<Object>} 创建的节点信息
 */
async function createNode(nodeId, nodeName) {
    try {
        // 使用与前端相同的节点注册API
        const response = await api.post('/nodes/register', {
            nodeId: nodeId,
            nodeName: nodeName
        });

        if (response.data && response.data.success) {
            console.log(`✅ 节点创建成功: ${nodeId} - ${nodeName}`);
            return response.data.data;
        } else {
            console.error(`❌ 节点创建失败: ${nodeId}`, response.data.message);
            return null;
        }
    } catch (error) {
        console.error(`❌ 节点创建错误: ${nodeId}`, error.response?.data?.message || error.message);
        return null;
    }
}

/**
 * 创建单个群组
 * @param {string} groupId 群组ID
 * @param {string} groupName 群组名称
 * @param {Array<string>} nodeIds 节点ID数组
 * @returns {Promise<Object>} 创建的群组信息
 */
async function createGroup(groupId, groupName, nodeIds) {
    try {
        console.log('\n' + '='.repeat(60));
        console.log(`开始创建节点组 ${groupId} - ${groupName}`);
        console.log(`节点组成员: ${nodeIds.join(', ')}`);

        // 使用与前端相同的群组创建API
        const response = await api.post('/groups', {
            groupId: groupId,
            groupName: groupName,
            nodeIds: nodeIds
        });

        if (response.data && response.data.success) {
            console.log(`✅ 节点组 ${groupId} - ${groupName} 创建成功`);
            console.log('='.repeat(60));
            return response.data.data;
        } else {
            console.error(`❌ 节点组 ${groupId} 创建失败: ${response.data.message}`);
            console.log('='.repeat(60));
            return null;
        }
    } catch (error) {
        console.error(`❌ 节点组 ${groupId} 创建错误: ${error.response?.data?.message || error.message}`);
        console.log('='.repeat(60));
        return null;
    }
}

/**
 * 批量创建节点
 * @param {number} count 要创建的节点数量
 * @returns {Promise<Array<Object>>} 创建的节点列表
 */
async function createNodes(count) {
    console.log(`\n开始批量创建 ${count} 个节点...`);
    const nodes = [];

    for (let i = 1; i <= count; i++) {
        const nodeId = `${config.nodePrefix}${i}`;
        const nodeName = `边缘节点${i}`;

        const node = await createNode(nodeId, nodeName);
        if (node) {
            nodes.push({
                ...node,
                nodeId: nodeId // 确保我们有节点ID
            });
        }

        // 简单的进度显示
        process.stdout.write(`\r创建进度: ${i}/${count}`);
    }

    console.log(`\n✅ 节点创建完成，成功创建 ${nodes.length}/${count} 个节点`);
    return nodes;
}

/**
 * 批量创建群组
 * @param {number} count 要创建的群组数量
 * @param {Array<Object>} nodes 可用节点列表
 * @returns {Promise<Array<Object>>} 创建的群组列表
 */
async function createGroups(count, nodes) {
    console.log(`\n开始批量创建 ${count} 个群组...`);

    if (nodes.length < count * config.nodesPerGroup) {
        console.warn(`⚠️ 警告：节点数量不足，需要 ${count * config.nodesPerGroup} 个节点，但只有 ${nodes.length} 个节点可用`);
    }

    const groups = [];

    for (let i = 1; i <= count; i++) {
        const groupId = `${config.groupPrefix}${i}`;
        const groupName = `节点群组${i}`;

        // 为每个组选择固定数量的节点
        const startIndex = (i - 1) * config.nodesPerGroup;
        const endIndex = startIndex + config.nodesPerGroup;

        // 检查是否有足够的节点
        if (startIndex >= nodes.length) {
            console.error(`❌ 无法创建群组 ${groupId}：没有足够的可用节点`);
            continue;
        }

        // 获取节点ID列表，如果节点不足，使用可用的最大数量
        const selectedNodes = nodes.slice(startIndex, Math.min(endIndex, nodes.length));
        const selectedNodeIds = selectedNodes.map(node => node.nodeId);

        // 创建群组
        const group = await createGroup(groupId, groupName, selectedNodeIds);
        if (group) {
            groups.push(group);
        }
    }

    console.log(`\n✅ 群组创建完成，成功创建 ${groups.length}/${count} 个群组`);
    return groups;
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('节点和群组批量创建工具');
        console.log(`配置: 创建 ${config.nodeCount} 个节点和 ${config.groupCount} 个群组（每组 ${config.nodesPerGroup} 个节点）`);

        // 确认是否继续
        rl.question('确认开始创建? (y/n): ', async (answer) => {
            if (answer.toLowerCase() !== 'y') {
                console.log('操作已取消');
                rl.close();
                process.exit(0);
            }

            console.time('创建完成，总用时');

            // 1. 创建节点
            const createdNodes = await createNodes(config.nodeCount);

            // 2. 创建群组
            if (createdNodes.length > 0) {
                await createGroups(config.groupCount, createdNodes);
            } else {
                console.error('❌ 没有成功创建节点，无法继续创建群组');
            }

            console.timeEnd('创建完成，总用时');
            rl.close();
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ 执行失败:', error);
        rl.close();
        process.exit(1);
    }
}

// 执行主函数
main();
