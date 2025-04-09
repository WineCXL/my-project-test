const db = require("../models");
const SystemParam = db.systemParams;

// 创建新的系统参数
exports.create = (req, res) => {
    // 验证请求
    if (!req.body.name || !req.body.value) {
        res.status(400).send({
            message: "参数名称和值不能为空！"
        });
        return;
    }

    // 创建参数对象
    const systemParam = {
        name: req.body.name,
        value: req.body.value,
        description: req.body.description,
        type: req.body.type || 'string'
    };

    // 保存到数据库
    SystemParam.create(systemParam)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "创建系统参数时发生错误。"
            });
        });
};

// 获取所有系统参数
exports.findAll = (req, res) => {
    SystemParam.findAll()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "获取系统参数时发生错误。"
            });
        });
};

// 获取单个系统参数
exports.findOne = (req, res) => {
    const id = req.params.id;

    SystemParam.findByPk(id)
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到ID为${id}的系统参数。`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `获取ID为${id}的系统参数时发生错误。`
            });
        });
};

// 按名称查找系统参数
exports.findByName = (req, res) => {
    const name = req.params.name;

    SystemParam.findOne({ where: { name: name } })
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `未找到名称为${name}的系统参数。`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `获取名称为${name}的系统参数时发生错误。`
            });
        });
};

// 更新系统参数
exports.update = (req, res) => {
    const id = req.params.id;

    SystemParam.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "系统参数更新成功。"
                });
            } else {
                res.send({
                    message: `无法更新ID为${id}的系统参数。可能参数不存在或请求体为空！`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `更新ID为${id}的系统参数时发生错误。`
            });
        });
};

// 删除系统参数
exports.delete = (req, res) => {
    const id = req.params.id;

    SystemParam.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "系统参数删除成功！"
                });
            } else {
                res.send({
                    message: `无法删除ID为${id}的系统参数。可能参数不存在！`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `删除ID为${id}的系统参数时发生错误。`
            });
        });
}; 