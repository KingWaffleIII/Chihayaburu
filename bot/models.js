import { DataTypes, Model, Sequelize, } from "sequelize";
export const db = new Sequelize({
    dialect: "sqlite",
    storage: "db.sqlite",
    logging: false,
});
export class User extends Model {
}
User.init({
    id: {
        type: DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    ltuid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ltoken: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    autoCheckIn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    disableDmAlerts: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    lastCheckIn: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: db,
    tableName: "Users",
});
