module.exports = app => {
    const searches = require("../controllers/search.controller.js");
    const router = require("express").Router();

    // 创建新搜索记录并执行搜索
    router.post("/", searches.create);

    // 获取所有搜索记录
    router.get("/", searches.findAll);

    // 获取搜索统计
    router.get("/stats", searches.getStats);

    // 获取单个搜索记录
    router.get("/:id", searches.findOne);

    // 删除搜索记录
    router.delete("/:id", searches.delete);

    app.use("/api/searches", router);
}; 