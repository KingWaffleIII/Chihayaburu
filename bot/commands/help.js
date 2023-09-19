import { EmbedBuilder, SlashCommandBuilder, } from "discord.js";
export const data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Information about Chihayaburu, how to get your cookie and how to contact the developer.");
export async function execute(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Chihayaburu v3.0.0")
        .setURL("https://github.com/KingWaffleIII/chihayaburu")
        .setAuthor({
        name: "KingWaffleIII @ PlanetWaffle",
        iconURL: "https://i.imgur.com/TMhlCMb.jpeg",
        url: "https://github.com/KingWaffleIII/",
    })
        .setDescription(`
A Discord bot that automates HoYoLab check-ins (Genshin Impact and Honkai: Star Rail).
\n
__**Obtaining a token**__
Every endpoint in HoYoVerse's API requires authentication, this is in the form of a cookie.

Getting your cookie is really simple. All you need to do is is head to https://www.hoyolab.com/accountCenter/ and log in. 
Then, you open Developer Tools with CTRL+SHIFT+I and open the console tab and paste the following: 
\`\`\`js
javascript:(function(){var script=document.createElement("script");script.src="//cdn.takagg.com/eruda-v1/eruda.js";document.body.appendChild(script);script.onload=function(){eruda.init()}})();
\`\`\`
(credit to TakaGG) 
This will create a settings icon in the bottom right corner - simply click on it and look for \`ltuid\` and \`ltoken\`. This is your ID and token respectively.
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
- **KingWaffleIII#9031** - Lead developer and maintainer
			`)
        .setThumbnail("https://i.imgur.com/pq6ejR9.png")
        .setTimestamp()
        .setFooter({
        text: "Chihayaburu - Help",
        iconURL: "https://i.imgur.com/pq6ejR9.png",
    });
    await interaction.reply({ embeds: [embed] });
}
