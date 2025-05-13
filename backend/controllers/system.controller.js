/**
 * 系统控制器
 * 负责系统参数管理、系统初始化等功能
 * 内部实现调用core/setup.controller.js
 */

// 导入核心算法控制器
const setupController = require("./core/setup.controller");

// 初始化系统参数
exports.initializeSystem = setupController.initialize;

// 获取系统参数
exports.getSystemParams = setupController.getPublicParams;

// 重置系统（仅用于测试）
exports.resetSystem = setupController.resetSystem;

// 为保持向后兼容性，保留旧的API命名
exports.initialize = setupController.initialize;
exports.getParams = setupController.getPublicParams;

const db = require("../models");

// 获取所有系统参数
exports.findAll = (req, res) => {
    try {
        // 直接返回加密系统参数，不依赖数据库
        // 使用硬编码的128作为AES安全级别，与C++版本保持一致
        const systemParams = [
            {
                id: 1,
                key: "securityLevel",
                value: "128", // 与C++实现中的AES_SECURITY 128保持一致
                description: "AES安全级别",
            },
            {
                id: 2,
                key: "curveType",
                value: "secp256k1", // JavaScript实现中使用的曲线类型
                description: "椭圆曲线类型",
            },
            {
                id: 3,
                key: "maxGroupSize",
                value: "4", // 更新为4，以反映节点组从6个改为4个节点
                description: "最大群组大小",
            },
        ];

        res.json({
            success: true,
            data: systemParams,
        });
    } catch (err) {
        console.error("获取系统参数出错:", err);
        // 即使出错也返回基本的系统参数信息
        res.json({
            success: true,
            data: [
                {
                    id: 1,
                    key: "securityLevel",
                    value: "128",
                    description: "AES安全级别",
                },
            ],
        });
    }
};

// 获取单个系统参数 - 返回硬编码值
exports.findOne = (req, res) => {
    const id = parseInt(req.params.id);

    // 硬编码参数
    const systemParams = {
        1: {
            id: 1,
            key: "securityLevel",
            value: "128",
            description: "AES安全级别",
        },
        2: {
            id: 2,
            key: "curveType",
            value: "secp256k1",
            description: "椭圆曲线类型",
        },
        3: {
            id: 3,
            key: "maxGroupSize",
            value: "4",
            description: "最大群组大小",
        },
    };

    if (systemParams[id]) {
        res.send(systemParams[id]);
    } else {
        res.status(404).send({
            message: `未找到ID为${id}的系统参数。`,
        });
    }
};

// 按名称查找系统参数 - 返回硬编码值
exports.findByName = (req, res) => {
    const name = req.params.name;

    // 硬编码参数
    const systemParamsByName = {
        securityLevel: {
            id: 1,
            key: "securityLevel",
            value: "128",
            description: "AES安全级别",
        },
        curveType: {
            id: 2,
            key: "curveType",
            value: "secp256k1",
            description: "椭圆曲线类型",
        },
        maxGroupSize: {
            id: 3,
            key: "maxGroupSize",
            value: "4",
            description: "最大群组大小",
        },
    };

    if (systemParamsByName[name]) {
        res.send(systemParamsByName[name]);
    } else {
        res.status(404).send({
            message: `未找到名称为${name}的系统参数。`,
        });
    }
};
