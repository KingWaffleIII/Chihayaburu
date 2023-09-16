/* eslint-disable no-underscore-dangle */
import { CronJob } from "cron";
import {
	ActivityType,
	Client,
	Collection,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	Interaction,
	REST,
	Routes,
	SlashCommandBuilder,
	ThreadChannel,
} from "discord.js";
import fs from "fs";
import { GenshinImpact, HonkaiStarRail, LanguageEnum } from "hoyoapi";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { db, User } from "./models.js";
import { doCheckIn, createCheckInJob } from "./createCheckInJob.js";
import config from "./config.json" assert { type: "json" };

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
		await dm.send({
			content: `Unfortunately, there was a problem and your automatic check-in was temporarily unavailable (the bot may have crashed or was updated/restarted). You were last checked in approx. **${Math.floor(
				diff
			)} days ago**. Your timer has restarted and you will now be automatically checked in again.`,
		});

		const { ltuid, ltoken } = user;

		const genshin = new GenshinImpact({
			cookie: {
				ltuid: parseInt(ltuid),
				ltoken,
			},
			lang: LanguageEnum.ENGLISH,
		});

		await doCheckIn(dm, user, genshin);

		const hsr = new HonkaiStarRail({
			cookie: {
				ltuid: parseInt(ltuid),
				ltoken,
			},
			lang: LanguageEnum.ENGLISH,
		});

		await doCheckIn(dm, user, hsr);

		const job = await createCheckInJob(client, user);
		job.start();
	}
}
