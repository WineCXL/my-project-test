module.exports = (app) => {
    const systems = require("../controllers/system.controller.js");
    const router = require("express").Router();

    // 获取所有系统参数
    router.get("/", systems.findAll);

    // 获取系统参数 (用于前端获取系统参数的API)
    router.get("/params", systems.findAll);

    // 获取单个系统参数
    router.get("/:id", systems.findOne);

    // 按名称获取系统参数
    router.get("/name/:name", systems.findByName);

    app.use("/api/system", router);
};
