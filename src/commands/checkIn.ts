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
			.setName("enable_auto_check_in")
			.setDescription(
				"Enables automatic daily check-in. Defaults to false."
			)
	)
	.addBooleanOption((option) =>
		option
			.setName("disable_dm_alerts")
			.setDescription("Disables DM alerts. Defaults to false")
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const enableAutoCheckIn =
		interaction.options.getBoolean("enable_auto_check_in") ?? false;
	const disableDmAlerts =
		interaction.options.getBoolean("disable_dm_alerts") ?? false;

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

	const result: CheckInData = await gi.ClaimDailyCheckIn(cookie);

	switch (result.retcode) {
		case 0: {
			await interaction.editReply("You've been checked in successfully.");
			break;
		}
		case -10: {
			await interaction.editReply(
				"Your ltuid and ltoken are invalid. Please check that they are correct."
			);
			break;
		}
		case -5003: {
			await interaction.editReply("You've already checked in today.");
			break;
		}
		default: {
			await interaction.editReply(
				"An error occurred while checking you in."
			);
			break;
		}
	}

	if (disableDmAlerts) {
		await user.update({
			disableDmAlerts: true,
		});
		await interaction.followUp({
			content: "DM alerts have been disabled.",
		});
	}

	if (enableAutoCheckIn && !user.autoCheckIn) {
		await user.update({
			autoCheckIn: true,
		});
		const job = new CronJob("0 0 0 * * *", async () => {
			let res;
			try {
				res = await gi.ClaimDailyCheckIn(cookie);
			} catch (error) {
				return;
			}

			if (!user.disableDmAlerts) {
				const dm = await interaction.user.createDM();
				switch (res.retcode) {
					case 0: {
						await dm.send("You've been checked in successfully.");
						break;
					}
					case -10: {
						await dm.send(
							"Your ltuid and ltoken are invalid. Please check that they are correct."
						);
						break;
					}
					case -5003: {
						await dm.send("You've already checked in today.");
						break;
					}
					default: {
						await dm.send(
							`An error occurred while checking you in.`
						);
						break;
					}
				}
			}
		});

		job.start();

		await interaction.followUp({
			content: "Automatic daily check-in has been enabled.",
		});
	} else if (user.autoCheckIn) {
		await interaction.followUp({
			content: "Automatic daily check-in is already enabled.",
		});
	}
}