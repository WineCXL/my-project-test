/**
 * JavaScript版本的加密引擎实现
 * 使用crypto-js和elliptic库模拟MIRACL库的功能
 */

const crypto = require("crypto");
const elliptic = require("elliptic");
const EC = elliptic.ec;
const BN = require("bn.js");

// 使用椭圆曲线密码学模拟双线性配对
// 注：JavaScript中无法完全实现真正的双线性配对，这里使用椭圆曲线作为近似模拟
const ec = new EC("secp256k1");

/**
 * 将哈希结果转为固定长度的十六进制字符串
 * @param {Buffer|String} data - 输入数据
 * @param {Number} length - 目标长度 (字符数)
 * @returns {String} - 固定长度的十六进制字符串
 */
function hashToFixedHex(data, length = 64) {
    // 使用SHA-256计算哈希
    const hash = crypto.createHash("sha256").update(data).digest("hex");

    // 保证输出长度为length位，不足则补0，超过则截断
    return hash.padEnd(length, "0").substring(0, length).toUpperCase();
}

/**
 * 生成模拟的64位十六进制随机字符串
 * @returns {String} - 64位十六进制字符串
 */
function generateHexString(length = 64) {
    return crypto
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .padEnd(length, "0")
        .substring(0, length)
        .toUpperCase();
}

/**
 * CryptoEngineImpl类，实现加密引擎的核心功能
 */
class CryptoEngineImpl {
  constructor() {
    this.initialized = false;
    this.registeredNodes = new Map(); // 节点ID -> 节点密钥
    this.groups = new Map(); // 群组ID -> 成员节点ID列表
    this.groupKeys = new Map(); // 群组ID -> 群组密钥

    // G1群点缓存 (解决无法直接序列化G1点的问题)
    this.cachedG1Points = new Map();

    // 初始化系统
    this.initializeMiracl();
  }

  /**
   * 1. 系统初始化 (Setup)
   */
    async initializeMiracl() {
    try {
            // 初始化椭圆曲线
            this.ec = new EC("secp256k1");

      // 生成系统基点P (G1群的生成元)
            this.P = this.ec.g;

      // 系统阶 (G1群的阶)
            this.order = this.ec.n;

      // 生成系统主密钥 (随机数)
            this.masterPrivateKey = new BN(crypto.randomBytes(32));

      // 计算系统公钥 P_pub = masterKey * P
            this.masterPublicKey = this.P.mul(this.masterPrivateKey);

            // 初始化存储
            this.nodeIdentities = {}; // 存储节点身份标识
            this.groupInfo = {}; // 存储群组信息

      this.initialized = true;
            console.log("加密引擎初始化成功");
    } catch (error) {
            console.error("初始化失败:", error);
      this.initialized = false;
            throw error;
    }
  }

  /**
   * 系统设置
   * @param {number} securityLevel - 安全级别
   * @returns {boolean} - 设置是否成功
   */
  systemSetup(securityLevel) {
    return this.initialized;
  }

  /**
   * 2. 节点注册 (NodeReg)
   * @param {string} nodeId - 节点ID
     * @returns {object} - {id, key, privateKey, randomNumber} 格式的对象
   */
  nodeRegistration(nodeId) {
    if (!this.initialized) {
            throw new Error("加密引擎未初始化");
        }

        try {
            // 生成节点私钥 (随机数s)
            const nodePrivateKey = new BN(crypto.randomBytes(32));

            // 生成节点随机值 (随机数x，用于零知识证明)
            const nodeRandomValue = new BN(crypto.randomBytes(32));

            // 生成节点信息对象
            const nodeInfo = {
                privateKey: nodePrivateKey.toString("hex"),
                randomNumber: nodeRandomValue.toString("hex"),
            };

            // 存储节点ID和对应的信息
            this.registeredNodes.set(nodeId, nodeInfo);

            // 返回节点信息
            return {
                id: nodeId,
                privateKey: nodeInfo.privateKey,
                randomNumber: nodeInfo.randomNumber,
            };
        } catch (error) {
            console.error("节点注册失败:", error);
            throw new Error(`节点注册失败: ${error.message}`);
        }
  }

  /**
   * 3. 群组生成 (GroupGen)
   * @param {Array<string>} nodeIds - 群组成员的节点ID列表
   * @returns {string} - 群组密钥
   */
  groupGeneration(nodeIds) {
    if (!this.initialized) {
            throw new Error("加密引擎未初始化");
    }

    // 生成唯一的群组ID
        const groupId = "group_" + Date.now() + "_" + this.groups.size;

    // 验证所有节点都已注册
    for (const nodeId of nodeIds) {
      if (!this.registeredNodes.has(nodeId)) {
        throw new Error(`节点 ${nodeId} 未注册`);
      }
    }

    // 创建群组
    this.groups.set(groupId, nodeIds);

        // 计算群组密钥 - 使用所有节点ID的哈希作为群组密钥
        const groupKey = hashToFixedHex(nodeIds.join(","));
    this.groupKeys.set(groupId, groupKey);

    return groupKey;
  }

  /**
   * 计算群组密钥
   * @param {Array<string>} memberNodeIds - 群组成员的节点ID列表
   * @returns {string} - 群组密钥
   */
  computeGroupKey(memberNodeIds) {
        // 使用所有成员节点ID和它们的密钥计算哈希
        const nodeData = memberNodeIds
            .map((nodeId) => {
                return nodeId + ":" + this.registeredNodes.get(nodeId);
            })
            .join("|");

        // 返回64位十六进制哈希
        return hashToFixedHex(nodeData);
  }

  /**
   * 4. 关键词生成 (KeywordGen)
     * 生成一个固定8位长度的随机原始关键词
     *
     * @returns {string} 随机生成的原始关键词
     */
    generateOriginalKeyword() {
        // 使用crypto随机生成4字节（生成8个字符的16进制字符串）
        const randomBytes = crypto.randomBytes(4);

        // 将随机字节转换为16进制字符串，正好得到8个字符
        const randomStr = randomBytes.toString("hex").substring(0, 8);

        console.log(`生成随机关键字: ${randomStr}`);

        return randomStr;
    }

  /**
   * 5. 消息封装 (Encapsulation)
   * @param {string} keyword - 关键词
   * @param {string} metadata - 元数据
     * @param {string} groupId - 群组ID
   * @returns {string} - 封装后的JSON结果
   */
    encapsulateKeyword(keyword, metadata, groupId) {
    if (!this.initialized) {
            throw new Error("加密引擎未初始化");
        }

        // 检查群组是否存在
        if (!this.groups.has(groupId)) {
            throw new Error(`群组 ${groupId} 不存在`);
        }

        try {
            // 获取群组公钥
            const nodeIds = this.groups.get(groupId);
            const groupPublicKeyStr = Object.keys(this.groupInfo).find(
                (key) =>
                    this.groupInfo[key].nodeIds.toString() ===
                    nodeIds.toString()
            );

            if (!groupPublicKeyStr) {
                throw new Error(`找不到群组 ${groupId} 的公钥信息`);
            }

            // 解析群组公钥，提取r部分 (在论文中，r是群组的公钥部分)
            const [pkrHex] = groupPublicKeyStr.split(":");
            const r = this.hexToPoint(pkrHex);

            // 生成随机值y (在论文中，这是用于加密的随机数)
            const y = new BN(crypto.randomBytes(32)).mod(this.order);

            // 步骤1：计算 X = y·P (在论文中，P是系统基点)
            // 在C++实现中使用MIRACL的point_mul函数
            const X = this.P.mul(y);

            // 步骤2：计算 H2(GroupID||keyword)
            const gidKeyword = groupId + keyword;
            const h2_hash = crypto
                .createHash("sha256")
                .update(gidKeyword)
                .digest();
            const h2_value = this.hashToPoint(h2_hash);

            // 步骤3：计算 e(H2(GroupID||keyword), r)
            // 在C++中使用MIRACL的pairing函数，这里用我们的乘法替代
            const e_h2_r = this.simulatePairing(h2_value, r);

            // 步骤4：获取phi值 (在C++中，这是群组公钥的另一部分)
            const [_, phiHex] = groupPublicKeyStr.split(":");
            const phi = Buffer.from(phiHex, "hex");

            // 步骤5：计算 combined = e(H2(GroupID||keyword), r) * phi
            // 在C++中使用乘法，这里用加法替代
            const combined = Buffer.concat([e_h2_r, phi]);

            // 步骤6：计算 powered = combined^y
            // 在C++中使用幂运算，这里用乘法替代
            const combinedBN = new BN(combined);
            const powered = combinedBN.mul(y).mod(this.order);

            // 步骤7：计算 Y = H3(powered)
            // 在C++中使用hash_to_aes_key函数
            const Y = crypto
                .createHash("sha256")
                .update(powered.toString())
                .digest("hex");

    // 生成唯一标识符并缓存X点
            const cacheKey = Date.now() + "_" + this.cachedG1Points.size;
            this.cachedG1Points.set(cacheKey, this.pointToHex(X));

    // 返回格式化的JSON结果
    return JSON.stringify({
      X_cache: cacheKey,
      Y: Y,
                metadata: metadata,
                groupId: groupId,
                timestamp: Date.now(),
    });
        } catch (error) {
            console.error("关键词封装错误:", error);
            throw new Error(`关键词封装失败: ${error.message}`);
        }
  }

  /**
   * 6. 授权令牌生成 (TrapdoorGen)
   * @param {string} keyword - 关键词
   * @param {string} groupId - 群组ID
   * @returns {string} - 授权令牌
   */
  searchTokenGeneration(keyword, groupId) {
    if (!this.initialized) {
            throw new Error("加密引擎未初始化");
    }

        // 获取群组信息
        if (!this.groups.has(groupId)) {
      throw new Error(`群组 ${groupId} 不存在`);
    }

        try {
            // 获取群组中的所有节点ID
            const nodeIds = this.groups.get(groupId);

            // 计算 H2(GroupID||keyword) - 将关键词映射到G1上的点
            const gidKeyword = groupId + keyword;
            const h2_hash = crypto
                .createHash("sha256")
                .update(gidKeyword)
                .digest();
            const h2_value = this.hashToPoint(h2_hash);

            // 初始化陷门T
            let T = null;
            let firstNode = true;

            // 遍历群组中的所有节点
            for (const nodeId of nodeIds) {
                // 获取节点的私钥和随机值
                if (!this.registeredNodes.has(nodeId)) {
                    console.warn(`节点 ${nodeId} 未注册，跳过`);
                    continue;
                }

                // 从注册节点获取密钥信息
                const nodeInfo = this.registeredNodes.get(nodeId);

                // 获取节点私钥si (直接使用存储的私钥)
                const si = new BN(nodeInfo.privateKey, 16);

                // 获取节点随机值xi (直接使用存储的随机值)
                const xi = new BN(nodeInfo.randomNumber, 16);

                // 计算 si·P (将私钥映射到G1上的点)
                const si_point = this.P.mul(si);

                // 计算 xi·H2(GroupID||keyword)
                const xi_h2 = h2_value.mul(xi);

                // 计算部分陷门 wi = si·P + xi·H2(GroupID||keyword)
                const wi = si_point.add(xi_h2);

                // 累加到陷门T
                if (firstNode) {
                    T = wi;
                    firstNode = false;
                } else {
                    T = T.add(wi);
                }
            }

            // 如果没有有效节点，抛出错误
            if (firstNode) {
                throw new Error(`群组 ${groupId} 中没有有效节点`);
            }

    // 生成唯一标识符并缓存T点
            const cacheKey = Date.now() + "_" + this.cachedG1Points.size;
            this.cachedG1Points.set(cacheKey, this.pointToHex(T));

    // 返回格式化的JSON结果
    return JSON.stringify({
                cache_key: cacheKey,
                groupId: groupId,
                timestamp: Date.now(),
    });
        } catch (error) {
            console.error("生成搜索令牌错误:", error);
            throw new Error(`生成搜索令牌失败: ${error.message}`);
        }
  }

  /**
   * 搜索令牌生成的替代方法
   * @param {string} groupId - 群组ID
   * @param {string} keyword - 关键词
   * @returns {string} - 授权令牌
   */
  generateSearchToken(groupId, keyword) {
    return this.searchTokenGeneration(keyword, groupId);
  }

  /**
   * 7. 授权测试 (AuthTest)
   * @param {string} trapdoor - 陷门（搜索令牌）
   * @param {string} encryptedMetadata - 加密的元数据
   * @returns {boolean} - 是否匹配
   */
  verifyKeywordMatch(trapdoor, encryptedMetadata) {
    if (!this.initialized) {
            throw new Error("加密引擎未初始化");
    }

    try {
      // 解析JSON
      const trapdoorObj = JSON.parse(trapdoor);
      const encryptedMetadataObj = JSON.parse(encryptedMetadata);

            // 确保两者属于同一群组
            if (trapdoorObj.groupId !== encryptedMetadataObj.groupId) {
                return false;
            }

      // 获取缓存键
      const tokenCacheKey = trapdoorObj.cache_key;
      const metadataCacheKey = encryptedMetadataObj.X_cache;
      const Y = encryptedMetadataObj.Y;

      // 从缓存获取椭圆曲线点
            if (
                !this.cachedG1Points.has(tokenCacheKey) ||
                !this.cachedG1Points.has(metadataCacheKey)
            ) {
        return false;
      }

            // 陷门T是一个椭圆曲线点
            const THex = this.cachedG1Points.get(tokenCacheKey);
            const T = this.hexToPoint(THex);

            // X也是一个椭圆曲线点
            const XHex = this.cachedG1Points.get(metadataCacheKey);
            const X = this.hexToPoint(XHex);

            // 步骤1：计算 e(T, X)
            // 在C++版本中使用MIRACL的pairing函数，这里用我们的乘法替代
            const e_T_X = this.simulatePairing(T, X);

            // 步骤2：计算 H3(e(T, X))
            // 在C++版本中使用hash_to_aes_key函数
            const hash_result = crypto
                .createHash("sha256")
                .update(e_T_X)
                .digest("hex");

            // 步骤3：验证等式 H3(e(T, X)) ?= Y
      return hash_result === Y;
    } catch (error) {
            console.error("关键词匹配验证错误:", error);
      return false;
    }
  }

  /**
   * 资源分配功能
   * @param {string} trapdoor - 陷门（搜索令牌）
   * @param {Array<string>} encryptedMetadataList - 加密元数据列表
   * @param {Array<string>} edgeNodeIds - 边缘节点ID列表
   * @returns {string} - 资源分配结果
   */
    allocateResourcesAccordingToKeywords(
        trapdoor,
        encryptedMetadataList,
        edgeNodeIds
    ) {
    if (!this.initialized) {
            throw new Error("加密引擎未初始化");
    }

    // 存储匹配的元数据
    const matchedMetadata = [];

    // 遍历所有加密元数据
    for (const encryptedMetadata of encryptedMetadataList) {
      // 验证关键词匹配
      if (this.verifyKeywordMatch(trapdoor, encryptedMetadata)) {
        // 提取元数据
        const metadata = JSON.parse(encryptedMetadata).metadata;
        matchedMetadata.push(metadata);
      }
    }

    // 如果没有匹配项，返回空结果
    if (matchedMetadata.length === 0) {
            return "{}";
    }

    // 根据匹配的元数据分配资源
    const allocatedResources = matchedMetadata.map((metadata, index) => {
      // 为每个匹配的元数据分配边缘节点
      const nodeIndex = index % edgeNodeIds.length;
      return {
        metadata: metadata,
                allocated_node: edgeNodeIds[nodeIndex],
      };
    });

    // 返回资源分配结果
    return JSON.stringify({
            allocated_resources: allocatedResources,
        });
    }

    // 注册边缘节点 - 实现EdgeNodeReg算法
    registerEdgeNode(nodeId) {
        try {
            // 将节点ID映射到椭圆曲线上的点 q_i = h1(ID_i)
            const nodeIdBuffer = Buffer.from(nodeId);
            const q_i_hash = crypto
                .createHash("sha256")
                .update(nodeIdBuffer)
                .digest();

            // 将哈希值映射到曲线上的点
            const q_i = this.hashToPoint(q_i_hash);

            // 生成随机数x作为节点私钥
            const privateKey = new BN(crypto.randomBytes(32));

            // 计算节点公钥 r = x·P (P是系统基点)
            const publicKey = this.P.mul(privateKey);

            // 存储节点身份标识
            this.nodeIdentities[nodeId] = {
                identity: q_i,
                publicKey: publicKey,
                privateKey: privateKey,
            };

            return {
                publicKey: this.pointToHex(publicKey),
                privateKey: privateKey.toString("hex"),
                identity: this.pointToHex(q_i),
            };
        } catch (error) {
            console.error("Error registering edge node:", error);
            throw error;
        }
    }

    // 生成节点群组 - 实现GroupGen算法
    generateGroup(nodeIds) {
        try {
            // 确保节点数量为5
            if (nodeIds.length !== 5) {
                throw new Error("Group must have exactly 5 nodes");
            }

            // 累加所有节点的身份标识 q_s = q_1 + ... + q_5
            let q_s = null;

            for (const nodeId of nodeIds) {
                // 检查节点是否已经注册
                if (!this.nodeIdentities[nodeId]) {
                    throw new Error(`Node not registered: ${nodeId}`);
                }

                const q_i = this.nodeIdentities[nodeId].identity;

                if (!q_s) {
                    q_s = q_i;
                } else {
                    q_s = q_s.add(q_i);
                }
            }

            // 生成随机数r作为群组私钥
            const r = new BN(crypto.randomBytes(32));

            // 计算群组公钥中的第一部分 pk_r = r·P
            const pk_r = this.P.mul(r);

            // 计算Phi值 Phi = e(q_s, P_pub)
            // 注意：在JavaScript中模拟配对操作
            const Phi = this.simulatePairing(q_s, this.masterPublicKey);

            // 计算群组公钥的第二部分 k = Hash(Phi)
            const k = crypto.createHash("sha256").update(Phi).digest("hex");

            // 组合群组公钥 {pk_r, k}
            const groupPublicKey = this.pointToHex(pk_r) + ":" + k;

            // 存储群组信息
            this.groupInfo[groupPublicKey] = {
                nodeIds: nodeIds,
                privateKey: r.toString("hex"),
            };

            return {
                publicKey: groupPublicKey,
                privateKey: r.toString("hex"),
            };
        } catch (error) {
            console.error("Error generating group:", error);
            throw error;
        }
    }

    // 生成零知识证明身份标识
    generateZKPIdentity(nodeId) {
        try {
            // 检查节点是否已经注册
            const nodeInfo = this.nodeIdentities[nodeId];
            if (!nodeInfo) {
                throw new Error(`Node not registered: ${nodeId}`);
            }

            // 获取节点私钥和身份标识
            const privateKey = nodeInfo.privateKey;
            const q_i = nodeInfo.identity;

            // 计算零知识证明 ZKP = x·q_i
            const zkp = q_i.mul(privateKey);

            // 存储零知识证明身份
            nodeInfo.zkpIdentity = zkp;

            return this.pointToHex(zkp);
        } catch (error) {
            console.error("Error generating ZKP identity:", error);
            throw error;
        }
    }

    // 验证节点身份
    verifyNodeIdentity(nodeId, zkpIdentityHex) {
        try {
            // 检查节点是否已经注册
            const nodeInfo = this.nodeIdentities[nodeId];
            if (!nodeInfo) {
                return false;
            }

            // 解析ZKP身份
            const zkp = this.hexToPoint(zkpIdentityHex);

            // 获取节点公钥和身份标识
            const publicKey = nodeInfo.publicKey;
            const q_i = nodeInfo.identity;

            // 验证e(P, ZKP) ?= e(r, q_i)
            // 使用模拟的配对操作
            const left = this.simulatePairing(this.P, zkp);
            const right = this.simulatePairing(publicKey, q_i);

            return left === right;
        } catch (error) {
            console.error("Error verifying node identity:", error);
            return false;
        }
    }

    // 验证群组成员身份
    verifyGroupMembers(groupPublicKey) {
        try {
            // 检查群组是否存在
            const group = this.groupInfo[groupPublicKey];
            if (!group) {
                return false;
            }

            // 验证每个节点是否有效
            for (const nodeId of group.nodeIds) {
                if (!this.nodeIdentities[nodeId]) {
                    return false;
                }
            }

            // 重新计算群组公钥，检查是否匹配
            let q_s = null;

            for (const nodeId of group.nodeIds) {
                const q_i = this.nodeIdentities[nodeId].identity;

                if (!q_s) {
                    q_s = q_i;
                } else {
                    q_s = q_s.add(q_i);
                }
            }

            // 解析群组私钥
            const r = new BN(group.privateKey, 16);

            // 计算公钥第一部分
            const pk_r = this.P.mul(r);

            // 计算Phi值
            const Phi = this.simulatePairing(q_s, this.masterPublicKey);

            // 计算公钥第二部分
            const k = crypto.createHash("sha256").update(Phi).digest("hex");

            // 组合群组公钥
            const calculatedKey = this.pointToHex(pk_r) + ":" + k;

            return calculatedKey === groupPublicKey;
        } catch (error) {
            console.error("Error verifying group members:", error);
            return false;
        }
    }

    // 辅助函数：将哈希值映射到曲线上的点
    hashToPoint(hash) {
        // 简化版本，实际应使用标准的哈希到点映射算法
        let x = new BN(hash);
        let point = null;

        // 尝试找到曲线上的有效点
        while (!point) {
            try {
                point = this.ec.curve.pointFromX(x, x.mod(new BN(2)).isZero());
            } catch (e) {
                x = x.add(new BN(1));
            }
        }

        return point;
    }

    // 辅助函数：将点转换为十六进制字符串
    pointToHex(point) {
        return point.encode("hex");
    }

    // 辅助函数：将十六进制字符串转换为点
    hexToPoint(hex) {
        return this.ec.curve.decodePoint(hex, "hex");
    }

    // 辅助函数：模拟配对操作
    // 将双线性配对替换为乘法运算
    simulatePairing(point1, point2) {
        // 获取点的坐标
        const p1X = point1.getX();
        const p1Y = point1.getY();
        const p2X = point2.getX();
        const p2Y = point2.getY();

        // 使用点的坐标计算乘积模拟配对结果
        // 用乘法替代真正的双线性配对
        const productX = p1X.mul(p2X).mod(this.ec.curve.p);
        const productY = p1Y.mul(p2Y).mod(this.ec.curve.p);

        // 将结果转换为哈希值
        return crypto
            .createHash("sha256")
            .update(productX.toString() + productY.toString())
            .digest();
    }
}

module.exports = CryptoEngineImpl;
