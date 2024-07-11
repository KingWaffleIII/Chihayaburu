import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

import { checkIn, getCheckInInfo, getMonthlyRewards } from "../api.js";
import { createCheckInJob } from "../createCheckInJob.js";
import { User } from "../models.js";

const doCheckIn = async (
	interaction: ChatInputCommandInteraction,
	user: User,
	game: "GENSHIN_IMPACT" | "HONKAI_STAR_RAIL" | "ZENLESS_ZONE_ZERO",
	autoCheckIn: boolean,
	dmAlerts: boolean
) => {
	try {
		const result = await checkIn(
			{
				ltuid: user.ltuid,
				ltoken: user.ltoken,
			},
			game,
			() => user.ltoken.startsWith("v2") as boolean
		);

		const info = await getCheckInInfo(
			{
				ltuid: user.ltuid,
				ltoken: user.ltoken,
			},
			game,
			() => user.ltoken.startsWith("v2") as boolean
		);

		let missed;
		if (!("sign_cnt_missed" in info.data)) {
			// subtract streak from todays date
			const dayOfMonth = new Date().getDate();
			missed = dayOfMonth - info.data.total_sign_day;
			if (missed < 0) missed = 0;
		} else {
			missed = info.data.sign_cnt_missed;
		}

		switch (result.retcode) {
			case 0: {
				await user.update({ lastCheckIn: new Date() });

				const monthRewards = await getMonthlyRewards(game);

				let reward;
				if (info.data.total_sign_day > 0) {
					reward =
						monthRewards.data.awards[info.data.total_sign_day - 1];
				} else {
					reward = monthRewards.data.awards[0];
				}

				const embed = new EmbedBuilder()
					.setTitle(
						`${game.replaceAll("_", " ")}: You've been checked in!`
					)
					.setDescription(`You got ${reward.name} x${reward.cnt}!`)
					.addFields(
						{
							name: "Streak:",
							value: `${info.data.total_sign_day} days`,
							inline: true,
						},
						{
							name: "Missed:",
							value: `${missed} days`,
							inline: true,
						},
						{ name: "\u200B", value: "\u200B" },
						{
							name: "Auto check-in:",
							value: autoCheckIn ? "Enabled" : "Disabled",
							inline: true,
						},
						{
							name: "DM alerts:",
							value: dmAlerts ? "Enabled" : "Disabled",
							inline: true,
						}
					)
					.setThumbnail(reward.icon)
					.setTimestamp()
					.setFooter({
						text: `${game} - Check In`,
						iconURL: "https://i.imgur.com/pq6ejR9.png",
					});

				switch (game) {
					case "HONKAI_STAR_RAIL": {
						embed.setColor(0x2b6aaf);
						break;
					}
					case "ZENLESS_ZONE_ZERO": {
						embed.setColor(0xef780d);
						break;
					}
					default: {
						embed.setColor(0xfefef4);
						break;
					}
				}

				await interaction.followUp({ embeds: [embed] });
				break;
			}
			case -5003: {
				const embed = new EmbedBuilder()
					.setTitle(
						`${game.replaceAll(
							"_",
							" "
						)}: You've already checked in today!`
					)
					.addFields(
						{
							name: "Streak:",
							value: `${info.data.total_sign_day} days`,
							inline: true,
						},
						{
							name: "Missed:",
							value: `${missed} days`,
							inline: true,
						},
						{ name: "\u200B", value: "\u200B" },
						{
							name: "Auto check-in:",
							value: autoCheckIn ? "Enabled" : "Disabled",
							inline: true,
						},
						{
							name: "DM alerts:",
							value: dmAlerts ? "Enabled" : "Disabled",
							inline: true,
						}
					)
					.setTimestamp()
					.setFooter({
						text: `${game} - Check In`,
						iconURL: "https://i.imgur.com/pq6ejR9.png",
					});

				switch (game) {
					case "HONKAI_STAR_RAIL": {
						embed.setColor(0x2b6aaf);
						break;
					}
					case "ZENLESS_ZONE_ZERO": {
						embed.setColor(0xef780d);
						break;
					}
					default: {
						embed.setColor(0xfefef4);
						break;
					}
				}

				await interaction.followUp({ embeds: [embed] });
				break;
			}
			default: {
				await interaction.editReply(
					`An error occurred while checking you in: \`${result.message}\`. Please check your \`ltuid\` and \`ltoken\` are correct, you can edit them with \`/edit-details\`.`
				);
				break;
			}
		}
	} catch (error) {
		console.error(error);
		await interaction.editReply(
			`An error occurred while checking you in. Please check your \`ltuid\` and \`ltoken\` are correct, you can edit them with \`/edit-details\`.`
		);
	}
};

export const data = new SlashCommandBuilder()
	.setName("check-in")
	.setDescription("Checks you into HoYoLab.")
	.addBooleanOption((option) =>
		option
			.setName("auto_check_in")
			.setDescription(
				"Enable automatic daily check-in. Defaults to false if not set."
			)
	)
	.addBooleanOption((option) =>
		option
			.setName("dm_alerts")
			.setDescription("Enables DM alerts. Defaults to true if not set.")
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.deferReply();

	const user = await User.findByPk(interaction.user.id);
	if (!user) {
		await interaction.editReply({
			content: "You don't have an account. Use `/login` first.",
		});
		return;
	}

	const autoCheckIn =
		interaction.options.getBoolean("auto_check_in") ?? user.autoCheckIn;
	const dmAlerts =
		interaction.options.getBoolean("dm_alerts") ?? user.dmAlerts;

	await doCheckIn(interaction, user, "GENSHIN_IMPACT", autoCheckIn, dmAlerts);

	await doCheckIn(
		interaction,
		user,
		"HONKAI_STAR_RAIL",
		autoCheckIn,
		dmAlerts
	);

	await doCheckIn(
		interaction,
		user,
		"ZENLESS_ZONE_ZERO",
		autoCheckIn,
		dmAlerts
	);

	if (autoCheckIn && !user.autoCheckIn) {
		const job = await createCheckInJob(interaction.client, user);
		job.start();
	}

	await user.update({
		dmAlerts,
		autoCheckIn,
	});
}
