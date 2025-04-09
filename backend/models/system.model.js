module.exports = (sequelize, Sequelize) => {
    const SystemParam = sequelize.define("system_param", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        value: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        description: {
            type: Sequelize.STRING
        },
        type: {
            type: Sequelize.STRING,
            defaultValue: 'string'
        }
    });

    return SystemParam;
}; 