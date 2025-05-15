const db = require("../models");
const User = db.User;
const bcrypt = require("bcryptjs");

// 获取所有用户
exports.findAll = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password"] },
            order: [["createdAt", "DESC"]],
        });

        res.send({
            success: true,
            data: users,
        });
    } catch (err) {
        console.error("获取用户列表失败:", err);
        res.status(500).send({
            success: false,
            message: err.message || "获取用户列表过程中发生错误.",
        });
    }
};

// 获取单个用户
exports.findOne = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: `未找到ID为 ${userId} 的用户.`,
            });
        }

        res.send({
            success: true,
            data: user,
        });
    } catch (err) {
        console.error(`获取ID为 ${userId} 的用户失败:`, err);
        res.status(500).send({
            success: false,
            message: err.message || `获取用户信息过程中发生错误.`,
        });
    }
};

// 更新用户
exports.update = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send({
                success: false,
                message: `未找到ID为 ${userId} 的用户.`,
            });
        }

        // 检查是否试图修改其他管理员的状态（只有管理员可以修改管理员状态）
        if (
            user.role === "manager" &&
            req.body.status &&
            req.role !== "manager"
        ) {
            return res.status(403).send({
                success: false,
                message: "只有管理员可以修改管理员账户状态!",
            });
        }

        // 准备更新数据
        const updateData = {};

        // 只有管理员可以修改角色
        if (req.body.role !== undefined && req.role === "manager") {
            updateData.role = req.body.role;
        }

        // 如果提供了新密码，则更新密码
        if (req.body.password) {
            updateData.password = bcrypt.hashSync(req.body.password, 8);
        }

        // 更新用户
        await user.update(updateData);

        // 查询更新后的用户（包含角色信息）
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ["password"] },
        });

        res.send({
            success: true,
            message: "用户更新成功!",
            data: updatedUser,
        });
    } catch (err) {
        console.error(`更新ID为 ${userId} 的用户失败:`, err);
        res.status(500).send({
            success: false,
            message: err.message || `更新用户信息过程中发生错误.`,
        });
    }
};

// 删除用户
exports.delete = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send({
                success: false,
                message: `未找到ID为 ${userId} 的用户.`,
            });
        }

        // 检查是否试图删除管理员
        if (user.role === "manager" || user.username === "admin") {
            return res.status(403).send({
                success: false,
                message: "管理员账户不能被删除!",
            });
        }

        // 删除用户
        await user.destroy();

        res.send({
            success: true,
            message: "用户删除成功!",
        });
    } catch (err) {
        console.error(`删除ID为 ${userId} 的用户失败:`, err);
        res.status(500).send({
            success: false,
            message: err.message || `删除用户过程中发生错误.`,
        });
    }
};

// 修改密码
exports.changePassword = async (req, res) => {
    try {
        // 验证请求
        if (!req.body.oldPassword || !req.body.newPassword) {
            return res.status(400).send({
                success: false,
                message: "旧密码和新密码不能为空!",
            });
        }

        // 获取当前用户
        const user = await User.findByPk(req.userId);

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "用户不存在!",
            });
        }

        // 验证旧密码
        const passwordIsValid = bcrypt.compareSync(
            req.body.oldPassword,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).send({
                success: false,
                message: "旧密码不正确!",
            });
        }

        // 更新密码
        await user.update({
            password: bcrypt.hashSync(req.body.newPassword, 8),
        });

        res.send({
            success: true,
            message: "密码修改成功!",
        });
    } catch (err) {
        console.error("修改密码失败:", err);
        res.status(500).send({
            success: false,
            message: err.message || "修改密码过程中发生错误.",
        });
    }
};
