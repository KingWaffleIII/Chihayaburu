import { SlashCommandBuilder } from "discord.js";
import { User } from "../models.js";
export const data = new SlashCommandBuilder()
    .setName("edit-details")
    .setDescription("Edits your user account details.")
    .addStringOption((option) => option.setName("ltuid").setDescription("Your HoYoLab LTUID."))
    .addStringOption((option) => option.setName("ltoken").setDescription("Your HoYoLab LTOKEN."));
export async function execute(interaction) {
    const ltuid = interaction.options.getString("ltuid") ?? null;
    const ltoken = interaction.options.getString("ltoken") ?? null;
    await interaction.deferReply();
    const user = await User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.editReply({
            content: "You don't have an account.",
        });
        return;
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
