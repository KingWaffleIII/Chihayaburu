"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("get-data")
    .setDescription("Retrieves your user account data");
async function execute(interaction) {
    await interaction.deferReply();
    const user = await models_1.User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.editReply({
            content: "You don't have an account.",
        });
        return;
    }
    const userData = user.toJSON();
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Your Data")
        .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL() ?? undefined,
    })
        .setDescription(`
\`\`\`json
${JSON.stringify(userData, null, 2)}
\`\`\`
			`)
        .setTimestamp();
    await interaction.editReply({
        embeds: [embed],
    });
}
exports.execute = execute;
