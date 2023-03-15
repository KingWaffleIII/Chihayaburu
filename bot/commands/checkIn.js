"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const cron_1 = require("cron");
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
const gi = require("@rthelolchex/genshininfo_scraper");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("check-in")
    .setDescription("Checks you into HoYoLab.")
    .addBooleanOption((option) => option
    .setName("enable-auto-checkin")
    .setDescription("Enables automatic daily check-in."));
async function execute(interaction) {
    const enableAutoCheckIn = interaction.options.getBoolean("enable-auto-checkin") ?? false;
    await interaction.deferReply();
    const user = await models_1.User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.editReply({
            content: "You don't have an account.",
        });
        return;
    }
    const { ltuid, ltoken } = user;
    const cookie = `ltuid=${ltuid};ltoken=${ltoken}`;
    const result = await gi.ClaimDailyCheckIn(cookie);
    // if (data.message === "Traveler, you've already checked in today~")
    if (result.retcode !== 0) {
        await interaction.editReply({
            content: "You've already checked in today.",
        });
    }
    else {
        await interaction.editReply({
            content: "You've been checked in successfully.",
        });
    }
    if (enableAutoCheckIn) {
        await user.update({
            autoCheckIn: true,
        });
        const job = new cron_1.CronJob("0 0 0 * * *", async () => {
            let res;
            try {
                res = await gi.ClaimDailyCheckIn(cookie);
            }
            catch (error) {
                return;
            }
            if (res.retcode === 0) {
                const dm = await interaction.user.createDM();
                await dm.send({
                    content: `You've been checked in successfully.`,
                });
            }
        });
        job.start();
        await interaction.followUp({
            content: "Automatic daily check-in has been enabled.",
        });
    }
}
exports.execute = execute;
