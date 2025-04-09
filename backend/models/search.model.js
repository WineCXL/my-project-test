module.exports = (sequelize, Sequelize) => {
    const Search = sequelize.define("search", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        keyword: {
            type: Sequelize.STRING,
            allowNull: false
        },
        trapdoor: {
            type: Sequelize.TEXT
        },
        result: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        searchTime: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        executionTime: {
            type: Sequelize.FLOAT
        },
        searcherId: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.ENUM('success', 'failed', 'pending'),
            defaultValue: 'pending'
        }
    });

    return Search;
}; 