"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("login")
    .setDescription("Create a user account.")
    .addStringOption((option) => option
    .setName("uid")
    .setDescription("Your Genshin UID.")
    .setRequired(true))
    .addStringOption((option) => option
    .setName("ltuid")
    .setDescription("Your HoYoLab LTUID.")
    .setRequired(true))
    .addStringOption((option) => option
    .setName("ltoken")
    .setDescription("Your HoYoLab LTOKEN.")
    .setRequired(true));
async function execute(interaction) {
    const uid = interaction.options.getString("uid");
    const ltuid = interaction.options.getString("ltuid");
    const ltoken = interaction.options.getString("ltoken");
    await interaction.deferReply();
    const user = await models_1.User.findByPk(interaction.user.id);
    if (user) {
        await interaction.editReply({
            content: "You already have an account.",
        });
        return;
    }
    await models_1.User.create({
        id: interaction.user.id,
        username: interaction.user.username,
        uid,
        ltuid,
        ltoken,
        autoCheckIn: false,
        disableDmAlerts: false,
    });
    await interaction.editReply({
        content: "Account created successfully.",
    });
}
exports.execute = execute;
