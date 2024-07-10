/* eslint-disable no-underscore-dangle */
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
} from "discord.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { checkIn, getMonthlyRewards } from "./api.js";
import config from "./config.json" assert { type: "json" };
import { createCheckInJob, doCheckIn } from "./createCheckInJob.js";
import { db, User } from "./models.js";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command: Command = await import(filePath);
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

const { token, clientId } = config;

const rest = new REST({ version: "10" }).setToken(token);
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
		const discord = await client.users.fetch(user.id);
		const dm = await discord.createDM();

		const diff =
			(new Date().getTime() - user.lastCheckIn!.getTime()) /
			1000 /
			60 /
			60 /
			24;

		if (diff >= 1) {
			await dm.send({
				content: `Unfortunately, there was a problem and your automatic check-in was temporarily unavailable (the bot may have crashed or was updated/restarted). You were last checked in approx. **${Math.floor(
					diff
				)} day(s) ago**. Your timer has restarted and you will now be automatically checked in again.`,
			});
		}

		await doCheckIn(dm, user, "GENSHIN_IMPACT");

		await doCheckIn(dm, user, "HONKAI_STAR_RAIL");

		await doCheckIn(dm, user, "ZENLESS_ZONE_ZERO");

		const job = await createCheckInJob(client, user);
		job.start();
	}
}
