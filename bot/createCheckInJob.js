import { CronJob } from "cron";
import { EmbedBuilder } from "discord.js";
import { GenshinImpact, HonkaiStarRail, LanguageEnum } from "hoyoapi";
const doCheckIn = async (dm, user, account) => {
    const game = account instanceof GenshinImpact ? "GI" : "HSR";
    try {
        const result = await account.daily.claim();
        await user.update({ lastCheckIn: new Date() });
        if (user.dmAlerts) {
            const monthRewards = await account.daily.rewards();
            const reward = monthRewards.awards[result.info.total_sign_day - 1];
            // result.info.sign_cnt_missed doesn't work anymore so we have to calculate it ourselves
            // subtract result.info.total_sign_day from today's date
            const today = new Date();
            const missed = today.getDate() - result.info.total_sign_day;
            switch (result.code) {
                case 0: {
                    const embed = new EmbedBuilder()
                        .setTitle(`${game}: You've been checked in!`)
                        .setDescription(`You got ${reward.name} x${reward.cnt}!`)
                        .addFields({
                        name: "Streak:",
                        value: `${result.info.total_sign_day} days`,
                        inline: true,
                    }, {
                        name: "Missed:",
                        value: `${missed} days`,
                        inline: true,
                    }, { name: "\u200B", value: "\u200B" }, {
                        name: "Auto check-in:",
                        value: user.autoCheckIn
                            ? "Enabled"
                            : "Disabled",
                        inline: true,
                    }, {
                        name: "DM alerts:",
                        value: user.dmAlerts ? "Enabled" : "Disabled",
                        inline: true,
                    })
                        .setThumbnail(reward.icon)
                        .setTimestamp()
                        .setFooter({
                        text: `${game} - Check In`,
                        iconURL: "https://i.imgur.com/pq6ejR9.png",
                    });
                    if (account instanceof GenshinImpact)
                        embed.setColor(0xffffff);
                    else
                        embed.setColor(0x0c1445);
                    await dm.send({ embeds: [embed] });
                    break;
                }
                case -5003: {
                    const embed = new EmbedBuilder()
                        .setTitle(`${game}: You've already checked in today!`)
                        .addFields({
                        name: "Streak:",
                        value: `${result.info.total_sign_day} days`,
                        inline: true,
                    }, {
                        name: "Missed:",
                        value: `${missed} days`,
                        inline: true,
                    }, { name: "\u200B", value: "\u200B" }, {
                        name: "Auto check-in:",
                        value: user.autoCheckIn
                            ? "Enabled"
                            : "Disabled",
                        inline: true,
                    }, {
                        name: "DM alerts:",
                        value: user.dmAlerts ? "Enabled" : "Disabled",
                        inline: true,
                    })
                        .setTimestamp()
                        .setFooter({
                        text: `${game} - Check In`,
                        iconURL: "https://i.imgur.com/pq6ejR9.png",
                    });
                    if (account instanceof GenshinImpact)
                        embed.setColor(0xffffff);
                    else
                        embed.setColor(0x0c1445);
                    await dm.send({ embeds: [embed] });
                    break;
                }
                default: {
                    await dm.send(`An error occurred while checking you in: ${result.status}. Please check your \`ltuid\` and \`ltoken\` are correct, you can edit them with \`/edit-details\`.`);
                    break;
                }
            }
        }
    }
    catch (error) {
        await dm.send(`An error occurred while checking you in. Please check your \`ltuid\` and \`ltoken\` are correct, you can edit them with \`/edit-details\`.`);
    }
};
const createCheckInJob = async (client, user) => new CronJob("0 0 0 * * *", async () => {
    await user.reload();
    const discord = await client.users.fetch(user.id);
    const dm = await discord.createDM();
    const { ltuid, ltoken } = user;
    const genshin = new GenshinImpact({
        cookie: {
            ltuid: parseInt(ltuid),
            ltoken,
        },
        lang: LanguageEnum.ENGLISH,
    });
    await doCheckIn(dm, user, genshin);
    const hsr = new HonkaiStarRail({
        cookie: {
            ltuid: parseInt(ltuid),
            ltoken,
        },
        lang: LanguageEnum.ENGLISH,
    });
    await doCheckIn(dm, user, hsr);
});
export { doCheckIn, createCheckInJob };
