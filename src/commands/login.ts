import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { User } from "../models.js";

export const data = new SlashCommandBuilder()
	.setName("login")
	.setDescription("Create a user account.")
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
		ltuid,
		ltoken,
		autoCheckIn: false,
		dmAlerts: false,
	});

	await interaction.editReply({
		content: "Account created successfully.",
	});
}
