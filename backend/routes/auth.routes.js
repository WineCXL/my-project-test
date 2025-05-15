const { verifyToken } = require("../middleware/auth.middleware");

module.exports = (app) => {
    const auth = require("../controllers/auth.controller.js");
    const router = require("express").Router();

    // 用户登录
    router.post("/signin", auth.signin);

    // 获取当前用户信息
    router.get("/me", [verifyToken], auth.getCurrentUser);

    app.use("/api/auth", router);
};
