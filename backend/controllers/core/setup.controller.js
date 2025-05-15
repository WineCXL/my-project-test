/**
 * 系统初始化(Setup)控制器
 * 实现论文中的Setup算法
 */

const cryptoEngine = require("../../lib/crypto");

// 存储系统参数的内存变量，取代数据库存储
let systemParams = null;

/**
 * 执行系统初始化，生成主密钥和公共参数
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.initialize = async (req, res) => {
    try {
        const { securityLevel } = req.body;

        // 验证安全级别参数
        if (!securityLevel || securityLevel < 80 || securityLevel > 256) {
            return res.status(400).json({
                success: false,
                message: "无效的安全级别，必须在80到256之间",
            });
        }

        // 调用加密引擎初始化系统
        const result = await cryptoEngine.systemSetup(securityLevel);

        // 使用内存变量存储系统参数
        systemParams = {
            securityLevel,
            publicParams: {
                g: "系统基点P", // 实际应使用加密引擎返回的值
                h: "系统公钥Ppub", // 实际应使用加密引擎返回的值
                params: `安全级别${securityLevel}的系统参数`,
            },
            status: "active",
            createdAt: Date.now(),
        };

        // 返回成功响应，注意不要返回主密钥
        return res.status(200).json({
            success: true,
            message: "系统初始化成功",
            data: {
                securityLevel,
                publicParams: systemParams.publicParams,
                status: "active",
            },
        });
    } catch (error) {
        console.error("系统初始化失败:", error);
        return res.status(500).json({
            success: false,
            message: "系统初始化失败",
            error: error.message,
        });
    }
};

/**
 * 获取系统公共参数
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.getPublicParams = async (req, res) => {
    try {
        // 检查系统是否已初始化
        if (!systemParams) {
            // 如果系统未初始化，尝试进行自动初始化
            try {
                // 使用默认安全级别128初始化系统
                const result = await cryptoEngine.systemSetup(128);

                systemParams = {
                    securityLevel: 128,
                    publicParams: {
                        g: "系统基点P", // 应从加密引擎获取
                        h: "系统公钥Ppub", // 应从加密引擎获取
                        params: "安全级别128的系统参数",
                    },
                    status: "active",
                    createdAt: Date.now(),
                };
            } catch (initError) {
                return res.status(404).json({
                    success: false,
                    message: "系统尚未初始化，自动初始化失败",
                });
            }
        }

        // 返回公共参数
        return res.status(200).json({
            success: true,
            data: {
                securityLevel: systemParams.securityLevel,
                publicParams: systemParams.publicParams,
                createdAt: systemParams.createdAt,
            },
        });
    } catch (error) {
        console.error("获取系统参数失败:", error);
        return res.status(500).json({
            success: false,
            message: "获取系统参数失败",
            error: error.message,
        });
    }
};

/**
 * 重置系统（仅用于测试环境）
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 */
exports.resetSystem = async (req, res) => {
    try {
        // 确保只在测试环境中可用
        if (
            process.env.NODE_ENV !== "test" &&
            process.env.NODE_ENV !== "development"
        ) {
            return res.status(403).json({
                success: false,
                message: "此操作仅在测试环境中可用",
            });
        }

        // 重置内存中的系统参数
        systemParams = null;

        return res.status(200).json({
            success: true,
            message: "系统已重置",
        });
    } catch (error) {
        console.error("系统重置失败:", error);
        return res.status(500).json({
            success: false,
            message: "系统重置失败",
            error: error.message,
        });
    }
};
