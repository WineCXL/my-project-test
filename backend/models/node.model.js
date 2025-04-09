module.exports = (sequelize, Sequelize) => {
    const Node = sequelize.define("node", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nodeId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        nodeType: {
            type: Sequelize.ENUM('data', 'compute', 'storage'),
            defaultValue: 'data'
        },
        status: {
            type: Sequelize.ENUM('active', 'inactive'),
            defaultValue: 'active'
        },
        publicKey: {
            type: Sequelize.TEXT
        },
        privateKey: {
            type: Sequelize.TEXT
        },
        location: {
            type: Sequelize.STRING
        },
        description: {
            type: Sequelize.STRING
        }
    });

    return Node;
}; 