import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { User } from "../models";

export const data = new SlashCommandBuilder()
	.setName("logout")
	.setDescription("Deletes your user account.");

export async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.deferReply();

	const user = await User.findByPk(interaction.user.id);
	if (!user) {
		await interaction.editReply({
			content: "You don't have an account.",
		});
		return;
	}

	await user.destroy();
	await interaction.editReply({
		content: "Account deleted successfully.",
	});
}
