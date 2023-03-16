"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("edit-details")
    .setDescription("Edits your user account details.")
    .addStringOption((option) => option.setName("uid").setDescription("Your Genshin UID."))
    .addStringOption((option) => option.setName("ltuid").setDescription("Your HoYoLab LTUID."))
    .addStringOption((option) => option.setName("ltoken").setDescription("Your HoYoLab LTOKEN."));
async function execute(interaction) {
    const uid = interaction.options.getString("uid") ?? null;
    const ltuid = interaction.options.getString("ltuid") ?? null;
    const ltoken = interaction.options.getString("ltoken") ?? null;
    await interaction.deferReply();
    const user = await models_1.User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.editReply({
            content: "You don't have an account.",
        });
        return;
    }
    if (uid) {
        user.uid = uid;
    }
    if (ltuid) {
        user.ltuid = ltuid;
    }
    if (ltoken) {
        user.ltoken = ltoken;
    }
    await user.save();
    await interaction.editReply({
        content: "Account updated successfully.",
    });
}
exports.execute = execute;
