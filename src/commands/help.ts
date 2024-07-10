import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("help")
	.setDescription(
		"Information about Chihayaburu, how to get your cookie and how to contact the developer."
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const embed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle("Chihayaburu v3.0.0")
		.setURL("https://github.com/KingWaffleIII/chihayaburu")
		.setAuthor({
			name: "Developed by KingWaffleIII",
			iconURL: "https://i.imgur.com/TMhlCMb.jpeg",
			url: "https://github.com/KingWaffleIII/",
		})
		.setDescription(
			`
A Discord bot that automates HoYoLab check-ins (Genshin Impact and Honkai: Star Rail).
\n
__**Obtaining a token**__
Every endpoint in HoYoVerse's API requires authentication, this is in the form of a cookie.

All you need to do is is head to https://www.hoyolab.com/accountCenter/ and log in. 
Then, you open \`Developer Tools\` with \`CTRL+SHIFT+I\` and open the \`Application\` tab.
Under \`Storage\`, expand \`Cookies\` and click on \`https://www.hoyolab.com\`.
Find \`ltoken_v2\` and \`ltuid_v2\` and enter those values in \`/login\`.
\n
__**Known issues/suggestions**__
https://github.com/KingWaffleIII/chihayaburu/issues
\n
__**Contributing**__
The bot is maintianed by me only so any help with questions and sources are always appeciated!
If you have any questions, suggestions or find an error, you can contact me by:
- Discord: DM me or ping me on a server this bot and I am in.
- Email: support@planetwaffle.net
Please note that simply using the bot counts as a contribution!
\n
__**Credits**__
- **kingwaffleiii** - Lead developer and maintainer
			`
		)
		.setThumbnail("https://i.imgur.com/pq6ejR9.png")
		.setTimestamp()
		.setFooter({
			text: "Chihayaburu - Help",
			iconURL: "https://i.imgur.com/pq6ejR9.png",
		});

	await interaction.reply({ embeds: [embed] });
}
