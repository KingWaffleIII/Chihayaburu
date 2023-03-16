"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("cron");
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const models_1 = require("./models");
const config_json_1 = require("./config.json");
const gi = require("@rthelolchex/genshininfo_scraper");
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMembers],
    presence: {
        status: "online",
        activities: [
            {
                name: "over my cat",
                type: discord_js_1.ActivityType.Watching,
            },
        ],
    },
});
const commands = new discord_js_1.Collection();
const commandsPath = path_1.default.join(__dirname, "commands");
const commandFiles = fs_1.default
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const filePath = path_1.default.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        commands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}
client.on(discord_js_1.Events.ClientReady, (bot) => {
    console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    // if (
    // 	interaction.guild === null ||
    // 	interaction.channel instanceof ThreadChannel
    // ) {
    // 	await interaction.reply({
    // 		content:
    // 			"This command is not available. Please use it in a normal server channel instead.",
    // 		ephemeral: true,
    // 	});
    // 	return;
    // }
    const command = commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
});
const rest = new discord_js_1.REST({ version: "10" }).setToken(config_json_1.token);
(async () => {
    try {
        const commandsList = commands.map((command) => command.data.toJSON());
        await rest.put(discord_js_1.Routes.applicationCommands(config_json_1.clientId), {
            body: commandsList,
        });
        console.log(`Successfully reloaded ${commandsList.length} application (/) commands.`);
    }
    catch (error) {
        console.error(error);
    }
    await models_1.db.sync();
    client.login(config_json_1.token);
    // loop through all users and check if they have autoCheckIn enabled
    const users = await models_1.User.findAll();
    for (const user of users) {
        if (user.autoCheckIn) {
            const u = await client.users.fetch(user.id);
            const dm = await u.createDM();
            const { ltuid, ltoken } = user;
            const cookie = `ltuid=${ltuid};ltoken=${ltoken}`;
            await gi.ClaimDailyCheckIn(cookie);
            const job = new cron_1.CronJob("0 0 0 * * *", async () => {
                let result;
                try {
                    result = await gi.ClaimDailyCheckIn(cookie);
                }
                catch (error) {
                    return;
                }
                if (!user.disableDmAlerts) {
                    switch (result.retcode) {
                        case 0: {
                            await dm.send("You've been checked in successfully.");
                            break;
                        }
                        case -10: {
                            await dm.send("Your ltuid and ltoken are invalid. Please check that they are correct.");
                            break;
                        }
                        case -5003: {
                            await dm.send("You've already checked in today.");
                            break;
                        }
                        default: {
                            await dm.send(`An error occurred while checking you in.`);
                            break;
                        }
                    }
                }
            });
            job.start();
            await dm.send({
                content: "Unfortunately, there has been a problem and your automatic check-in was temporarily unavailable. Apologies for the inconvenience; your timer has been reset and you will now be automatically checked-in again.",
            });
        }
    }
})();
