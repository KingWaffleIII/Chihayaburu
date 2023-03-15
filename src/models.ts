import {
	DataTypes,
	Model,
	Sequelize,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
} from "sequelize";

export const db = new Sequelize({
	dialect: "sqlite",
	storage: "db.sqlite",
	logging: false,
});

export class User extends Model<
	InferAttributes<User>,
	InferCreationAttributes<User>
> {
	declare id: string;
	declare username: string;
	declare uid: string;
	declare ltuid: string;
	declare ltoken: string;
	declare autoCheckIn: boolean;

	// createdAt can be undefined during creation
	declare createdAt: CreationOptional<Date>;
	// updatedAt can be undefined during creation
	declare updatedAt: CreationOptional<Date>;
}

User.init(
	{
		id: {
			type: DataTypes.STRING,
			autoIncrement: false,
			primaryKey: true,
		},
		username: {
			type: DataTypes.STRING(32),
			allowNull: false,
		},
		uid: {
			type: DataTypes.STRING,
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
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize: db,
		tableName: "Users",
	}
);
