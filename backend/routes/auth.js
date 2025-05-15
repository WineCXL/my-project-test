const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 登录接口
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "用户名或密码错误",
            });
        }

        // 验证密码
        const isMatch = await user.validatePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "用户名或密码错误",
            });
        }

        // 生成 JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
            },
        });
    } catch (error) {
        console.error("登录错误:", error);
        res.status(500).json({
            success: false,
            message: "服务器错误，请稍后重试",
        });
    }
});

// 初始化管理员账户接口
router.post("/init-admin", async (req, res) => {
    try {
        // 检查是否已存在管理员账户
        const existingAdmin = await User.findOne({
            where: { role: "manager" },
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "管理员账户已存在",
            });
        }

        // 创建默认管理员账户
        const adminUser = await User.create({
            username: "admin",
            password: "admin123", // 在实际生产环境中应使用更复杂的密码
            role: "manager",
        });

        res.status(201).json({
            success: true,
            message: "管理员账户初始化成功",
            admin: {
                username: adminUser.username,
                email: adminUser.email,
            },
        });
    } catch (error) {
        console.error("初始化管理员账户错误:", error);
        res.status(500).json({
            success: false,
            message: "服务器错误，请稍后重试",
        });
    }
});

// 获取当前用户信息接口
router.get("/userinfo", async (req, res) => {
    try {
        // 从请求头中获取token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "未授权访问",
            });
        }

        const token = authHeader.split(" ")[1];

        // 验证token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        );

        // 获取用户信息
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "用户不存在",
            });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("获取用户信息错误:", error);

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "令牌无效或已过期",
            });
        }

        res.status(500).json({
            success: false,
            message: "服务器错误，请稍后重试",
        });
    }
});

module.exports = router;
