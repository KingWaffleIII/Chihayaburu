"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("logout")
    .setDescription("Deletes your user account.");
async function execute(interaction) {
    await interaction.deferReply();
    const user = await models_1.User.findByPk(interaction.user.id);
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
exports.execute = execute;
