const db = require("../models");
const config = require("../config/auth.config");
const User = db.User;

const jwt = require("jsonwebtoken");

// 用户登录
exports.signin = async (req, res) => {
    try {
        // 验证请求
        if (!req.body.username || !req.body.password) {
            return res.status(400).send({
                success: false,
                message: "用户名和密码不能为空!",
            });
        }

        // 查找用户
        const user = await User.findOne({
            where: {
                username: req.body.username,
            },
        });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "用户不存在!",
            });
        }

        // 验证密码
        // 直接比较明文密码，不使用bcrypt
        const passwordIsValid = req.body.password === user.password;

        if (!passwordIsValid) {
            return res.status(401).send({
                success: false,
                message: "密码不正确!",
            });
        }

        // 使用用户模型中的role字段
        const userRole = user.role || "user";

        // 生成token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: userRole,
            },
            config.secret,
            {
                expiresIn: config.jwtExpiration,
            }
        );

        // 更新最后登录时间
        await user.update({ lastLogin: new Date() });

        // 返回用户信息和token（不包括密码）
        const { password, ...userWithoutPassword } = user.toJSON();

        res.send({
            success: true,
            message: "登录成功!",
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    } catch (err) {
        console.error("登录失败:", err);
        res.status(500).send({
            success: false,
            message: err.message || "登录过程中发生错误.",
        });
    }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "用户不存在!",
            });
        }

        res.send({
            success: true,
            data: user,
        });
    } catch (err) {
        console.error("获取用户信息失败:", err);
        res.status(500).send({
            success: false,
            message: err.message || "获取用户信息时发生错误.",
        });
    }
};
