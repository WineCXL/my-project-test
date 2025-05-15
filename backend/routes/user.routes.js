const {
    verifyToken,
    isAdmin,
    hasPermission,
} = require("../middleware/auth.middleware");

module.exports = (app) => {
    const users = require("../controllers/user.controller.js");
    const router = require("express").Router();

    // 获取所有用户(需要管理员权限)
    router.get("/", [verifyToken, isAdmin], users.findAll);

    // 修改密码 (需要登录)
    router.post("/change-password", [verifyToken], users.changePassword);

    // 获取单个用户 (需要管理员权限或是自己)
    router.get("/:id", [verifyToken], users.findOne);

    // 更新用户 (需要管理员权限或是自己)
    router.put("/:id", [verifyToken], users.update);

    // 删除用户 (需要管理员权限)
    router.delete("/:id", [verifyToken, isAdmin], users.delete);

    app.use("/api/users", router);
};
