import { CronJob } from "cron";
import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { GenshinImpact, HonkaiStarRail, LanguageEnum } from "hoyoapi";

import { User } from "../models.js";
import { createCheckInJob } from "../createCheckInJob.js";

const doCheckIn = async (
	interaction: ChatInputCommandInteraction,
	user: User,
	account: GenshinImpact | HonkaiStarRail,
	enableAutoCheckIn: boolean,
	disableDmAlerts: boolean
) => {
	const game = account instanceof GenshinImpact ? "GI" : "HSR";

	try {
		const result = await account.daily.claim();
		await user.update({ lastCheckIn: new Date() });

		const monthRewards = await account.daily.rewards();

		const reward = monthRewards.awards[result.info.total_sign_day - 1];

		switch (result.code) {
			case 0: {
				const embed = new EmbedBuilder()
					.setTitle(`${game}: You've been checked in!`)
					.setDescription(`You got ${reward.name} x${reward.cnt}!`)
					.addFields(
						{
							name: "Streak:",
							value: `${result.info.total_sign_day} days`,
							inline: true,
						},
						{
							name: "Missed:",
							value: `${result.info.sign_cnt_missed} days`,
							inline: true,
						},
						{ name: "\u200B", value: "\u200B" },
						{
							name: "Auto check-in:",
							value: enableAutoCheckIn ? "Enabled" : "Disabled",
							inline: true,
						},
						{
							name: "DM alerts:",
							value: disableDmAlerts ? "Disabled" : "Enabled",
							inline: true,
						}
					)
					.setThumbnail(reward.icon)
					.setTimestamp()
					.setFooter({
						text: `${game} - Check In`,
						iconURL: "https://i.imgur.com/pq6ejR9.png",
					});

				if (account instanceof GenshinImpact) embed.setColor(0xffffff);
				else embed.setColor(0x0c1445);

				await interaction.followUp({ embeds: [embed] });
				break;
			}
			case -5003: {
				const embed = new EmbedBuilder()
					.setTitle(`${game}: You've already checked in today!`)
					.addFields(
						{
							name: "Streak:",
							value: `${result.info.total_sign_day} days`,
							inline: true,
						},
						{
							name: "Missed:",
							value: `${result.info.sign_cnt_missed} days`,
							inline: true,
						},
						{ name: "\u200B", value: "\u200B" },
						{
							name: "Auto check-in:",
							value: enableAutoCheckIn ? "Enabled" : "Disabled",
							inline: true,
						},
						{
							name: "DM alerts:",
							value: disableDmAlerts ? "Disabled" : "Enabled",
							inline: true,
						}
					)
					.setTimestamp()
					.setFooter({
						text: `${game} - Check In`,
						iconURL: "https://i.imgur.com/pq6ejR9.png",
					});

				if (account instanceof GenshinImpact) embed.setColor(0xffffff);
				else embed.setColor(0x0c1445);

				await interaction.followUp({ embeds: [embed] });
				break;
			}
			default: {
				await interaction.editReply(
					`An error occurred while checking you in: ${result.status}. Please check your \`ltuid\` and \`ltoken\` are correct, you can edit them with \`/edit-details\`.`
				);
				break;
			}
		}
	} catch (error) {
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
			content: "You don't have an genshin.",
		});
		return;
	}

	const { ltuid, ltoken } = user;

	const genshin = new GenshinImpact({
		cookie: {
			ltuid: parseInt(ltuid),
			ltoken,
		},
		lang: LanguageEnum.ENGLISH,
	});

	await doCheckIn(
		interaction,
		user,
		genshin,
		enableAutoCheckIn,
		disableDmAlerts
	);

	const hsr = new HonkaiStarRail({
		cookie: {
			ltuid: parseInt(ltuid),
			ltoken,
		},
		lang: LanguageEnum.ENGLISH,
	});

	await doCheckIn(interaction, user, hsr, enableAutoCheckIn, disableDmAlerts);

	await user.update({
		disableDmAlerts,
	});

	if (!enableAutoCheckIn) await user.update({ autoCheckIn: false });
	if (enableAutoCheckIn && !user.autoCheckIn) {
		await user.update({
			autoCheckIn: true,
		});

		const job = await createCheckInJob(interaction.client, user);
		job.start();
	}
}
