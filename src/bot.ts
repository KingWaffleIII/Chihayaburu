import { CronJob } from "cron";
import {
	ActivityType,
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	Interaction,
	REST,
	Routes,
	SlashCommandBuilder,
	ThreadChannel,
} from "discord.js";
import fs from "fs";
import path from "path";

import { db, User } from "./models";
import { clientId, token } from "./config.json";

const gi = require("@rthelolchex/genshininfo_scraper");

interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: unknown) => Promise<void>;
}

const client: Client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	presence: {
		status: "online",
		activities: [
			{
				name: "over my cat",
				type: ActivityType.Watching,
			},
		],
	},
});

const commands: Collection<string, Command> = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command: Command = require(filePath);
	if ("data" in command && "execute" in command) {
		commands.set(command.data.name, command);
	} else {
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
		);
	}
}

client.on(Events.ClientReady, (bot) => {
	console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;
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
		console.error(
			`No command matching ${interaction.commandName} was found.`
		);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: "There was an error while executing this command!",
			ephemeral: true,
		});
	}
});

const rest = new REST({ version: "10" }).setToken(token);
(async () => {
	try {
		const commandsList: Array<object> = commands.map((command) =>
			command.data.toJSON()
		);

		await rest.put(Routes.applicationCommands(clientId), {
			body: commandsList,
		});

		console.log(
			`Successfully reloaded ${commandsList.length} application (/) commands.`
		);
	} catch (error) {
		console.error(error);
	}

	await db.sync();

	client.login(token);

	// loop through all users and check if they have autoCheckIn enabled
	const users = await User.findAll();
	for (const user of users) {
		if (user.autoCheckIn) {
			const u = await client.users.fetch(user.id);
			const dm = await u.createDM();

			const { ltuid, ltoken } = user;
			const cookie = `ltuid=${ltuid};ltoken=${ltoken}`;
			await gi.ClaimDailyCheckIn(cookie);

			const job = new CronJob("0 0 0 * * *", async () => {
				await user.reload();

				let result;
				try {
					result = await gi.ClaimDailyCheckIn(cookie);
					await user.update({ lastCheckIn: new Date() });
				} catch (error) {
					return;
				}

				if (!user.disableDmAlerts) {
					switch (result.retcode) {
						case 0: {
							await dm.send(
								"You've been checked in successfully."
							);
							break;
						}
						case -10: {
							await dm.send(
								"Your ltuid and ltoken are invalid. Please check that they are correct."
							);
							break;
						}
						case -5003: {
							await dm.send("You've already checked in today.");
							break;
						}
						default: {
							await dm.send(
								`An error occurred while checking you in.`
							);
							break;
						}
					}
				}
			});
			job.start();

			const diff =
				(new Date().getTime() - user.lastCheckIn!.getTime()) /
				1000 /
				60 /
				60 /
				24;
			await dm.send({
				content: `Unfortunately, there was a problem and your automatic check-in was temporarily unavailable (the bot may have crashed or was updated/restarted). You were last checked in approx. **${Math.floor(
					diff
				)} days ago**. Your timer has restarted and you will now be automatically checked in again.`,
			});
		}
	}
})();
