import { CronJob } from "cron";
import { Client, DMChannel, EmbedBuilder } from "discord.js";

import { checkIn, getCheckInInfo, getMonthlyRewards } from "./api.js";
import { User } from "./models.js";

const doCheckIn = async (
	dm: DMChannel,
	user: User,
	game: "GENSHIN_IMPACT" | "HONKAI_STAR_RAIL" | "ZENLESS_ZONE_ZERO"
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

		if (user.dmAlerts) {
			switch (result.retcode) {
				case 0: {
					await user.update({ lastCheckIn: new Date() });

					const monthRewards = await getMonthlyRewards(game);

					let reward;
					if (info.data.total_sign_day > 0) {
						reward =
							monthRewards.data.awards[
								info.data.total_sign_day - 1
							];
					} else {
						reward = monthRewards.data.awards[0];
					}

					const embed = new EmbedBuilder()
						.setTitle(
							`${game.replaceAll(
								"_",
								" "
							)}: You've been checked in!`
						)
						.setDescription(
							`You got ${reward.name} x${reward.cnt}!`
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
								value: user.autoCheckIn
									? "Enabled"
									: "Disabled",
								inline: true,
							},
							{
								name: "DM alerts:",
								value: user.dmAlerts ? "Enabled" : "Disabled",
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

					await dm.send({ embeds: [embed] });
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
								value: user.autoCheckIn
									? "Enabled"
									: "Disabled",
								inline: true,
							},
							{
								name: "DM alerts:",
								value: user.dmAlerts ? "Enabled" : "Disabled",
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

					await dm.send({ embeds: [embed] });
					break;
				}
				default: {
					await dm.send(
						`An error occurred while checking you in: ${result.message}. Please check your \`ltuid\` and \`ltoken\` are correct, you can edit them with \`/edit-details\`.`
					);
					break;
				}
			}
		}
	} catch (error) {
		console.error(error);
		await dm.send(
			`An error occurred while checking you in. Please check your \`ltuid\` and \`ltoken\` are correct, you can edit them with \`/edit-details\`.`
		);
	}
};

const createCheckInJob = async (client: Client, user: User): Promise<CronJob> =>
	new CronJob(
		"0 0 0 * * *",
		async () => {
			await user.reload();
			const discord = await client.users.fetch(user.id);
			const dm = await discord.createDM();

			await doCheckIn(dm, user, "GENSHIN_IMPACT");

			await doCheckIn(dm, user, "HONKAI_STAR_RAIL");

			await doCheckIn(dm, user, "ZENLESS_ZONE_ZERO");
		},
		null,
		true,
		"utc"
	);

export { doCheckIn, createCheckInJob };
