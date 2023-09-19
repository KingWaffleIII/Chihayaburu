import { EmbedBuilder, SlashCommandBuilder, } from "discord.js";
import { User } from "../models.js";
export const data = new SlashCommandBuilder()
    .setName("get-data")
    .setDescription("Retrieves your user account data");
export async function execute(interaction) {
    await interaction.deferReply();
    const user = await User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.editReply({
            content: "You don't have an account.",
        });
        return;
    }
    const userData = user.toJSON();
    const embed = new EmbedBuilder()
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
