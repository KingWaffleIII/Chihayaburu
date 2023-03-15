"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.db = void 0;
const sequelize_1 = require("sequelize");
exports.db = new sequelize_1.Sequelize({
    dialect: "sqlite",
    storage: "db.sqlite",
    logging: false,
});
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: false,
    },
    uid: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    ltuid: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    ltoken: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    autoCheckIn: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: exports.db,
    tableName: "Users",
});
