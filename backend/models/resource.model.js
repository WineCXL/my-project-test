module.exports = (sequelize, Sequelize) => {
    const Resource = sequelize.define("resource", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        resourceId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        resourceName: {
            type: Sequelize.STRING,
            allowNull: false
        },
        resourceType: {
            type: Sequelize.STRING
        },
        amount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        keywords: {
            type: Sequelize.TEXT,
            get() {
                const rawValue = this.getDataValue('keywords');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('keywords', JSON.stringify(value));
            }
        },
        encryptedData: {
            type: Sequelize.TEXT
        },
        status: {
            type: Sequelize.ENUM('available', 'allocated', 'expired'),
            defaultValue: 'available'
        },
        description: {
            type: Sequelize.STRING
        }
    });

    return Resource;
}; 