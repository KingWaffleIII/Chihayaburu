import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { User } from "../models";

export const data = new SlashCommandBuilder()
	.setName("login")
	.setDescription("Create a user account.")
	.addStringOption((option) =>
		option
			.setName("uid")
			.setDescription("Your Genshin UID.")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("ltuid")
			.setDescription("Your HoYoLab LTUID.")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("ltoken")
			.setDescription("Your HoYoLab LTOKEN.")
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const uid = interaction.options.getString("uid")!;
	const ltuid = interaction.options.getString("ltuid")!;
	const ltoken = interaction.options.getString("ltoken")!;

	await interaction.deferReply();

	const user = await User.findByPk(interaction.user.id);
	if (user) {
		await interaction.editReply({
			content: "You already have an account.",
		});
		return;
	}

	await User.create({
		id: interaction.user.id,
		username: interaction.user.username,
		uid,
		ltuid,
		ltoken,
		autoCheckIn: false,
	});

	await interaction.editReply({
		content: "Account created successfully.",
	});
}
