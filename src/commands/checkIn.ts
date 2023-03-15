import { CronJob } from "cron";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { User } from "../models";

const gi = require("@rthelolchex/genshininfo_scraper");

interface CheckInData {
	retcode: number;
	message: string;
	data: unknown;
}

export const data = new SlashCommandBuilder()
	.setName("check-in")
	.setDescription("Checks you into HoYoLab.")
	.addBooleanOption((option) =>
		option
			.setName("enable-auto-checkin")
			.setDescription("Enables automatic daily check-in.")
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const enableAutoCheckIn =
		interaction.options.getBoolean("enable-auto-checkin") ?? false;

	await interaction.deferReply();

	const user = await User.findByPk(interaction.user.id);
	if (!user) {
		await interaction.editReply({
			content: "You don't have an account.",
		});
		return;
	}

	const { ltuid, ltoken } = user;

	const cookie = `ltuid=${ltuid};ltoken=${ltoken}`;

	const data: CheckInData = await gi.ClaimDailyCheckIn(cookie);

	// if (data.message === "Traveler, you've already checked in today~")
	if (data.retcode !== 0) {
		await interaction.editReply({
			content: "You've already checked in today.",
		});
	} else {
		await interaction.editReply({
			content: "You've been checked in successfully.",
		});
	}

	if (enableAutoCheckIn) {
		await user.update({
			autoCheckIn: true,
		});
		const job = new CronJob("0 0 0 * * *", async () => {
			const { ltuid, ltoken } = user;
			const cookie = `ltuid=${ltuid};ltoken=${ltoken}`;
			await gi.ClaimDailyCheckIn(cookie);

			const dm = await interaction.user.createDM();
			await dm.send({
				content: `You've been checked in successfully.`,
			});
		});

		job.start();

		await interaction.followUp({
			content: "Automatic daily check-in has been enabled.",
		});
	}
}
