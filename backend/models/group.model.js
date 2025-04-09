module.exports = (sequelize, Sequelize) => {
    const Group = sequelize.define("group", {
        id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
        },
        groupId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        groupName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('active', 'inactive'),
            defaultValue: 'active'
        },
        groupPublicKey: {
            type: Sequelize.TEXT
        },
        groupKey: {
            type: Sequelize.TEXT
        },
        description: {
            type: Sequelize.STRING
        }
    });

    return Group;
}; 