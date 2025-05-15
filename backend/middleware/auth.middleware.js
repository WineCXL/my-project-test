const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../models");
const User = db.User;

// 验证token
verifyToken = (req, res, next) => {
    // 从请求头获取token
    let token = req.headers["x-access-token"] || req.headers["authorization"];

    // 检查是否提供了token
    if (!token) {
        return res.status(403).send({
            success: false,
            message: "未提供认证令牌!"
        });
    }

    // 处理Bearer token格式
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    // 验证token
    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                success: false,
                message: "无效的认证令牌!"
            });
        }

        // 设置用户ID到请求对象，以便后续路由处理函数使用
        req.userId = decoded.id;
        req.user = { id: decoded.id }; // 添加这一行，确保req.user.id可用

        next();
    });
};

// 验证是否是管理员
isAdmin = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "用户不存在.",
            });
        }

        // 直接检查user.role而不是查询角色表
        if (user.role === "manager" || user.username === "admin") {
            next();
            return;
        }

        return res.status(403).send({
            success: false,
            message: "需要管理员权限!",
        });
    } catch (error) {
        console.error("验证管理员权限时出错:", error);
        return res.status(500).send({
            success: false,
            message: "验证管理员权限时出错",
        });
    }
};

// 验证是否拥有指定权限
hasPermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.userId);
            if (!user) {
                return res.status(404).send({
                    success: false,
                    message: "用户不存在.",
                });
            }

            // 检查用户角色
            if (user.role === "manager" || user.username === "admin") {
                next();
                return;
            }

            // 这里可能需要根据实际业务逻辑调整权限检查
            // 如果普通用户有某些权限，可以在这里添加

            return res.status(403).send({
                success: false,
                message: `需要管理员权限!`,
            });
        } catch (error) {
            console.error("验证权限时出错:", error);
            return res.status(500).send({
                success: false,
                message: "验证权限时出错",
            });
        }
    };
};

const authMiddleware = {
    verifyToken,
    isAdmin,
    hasPermission,
};

module.exports = authMiddleware;
