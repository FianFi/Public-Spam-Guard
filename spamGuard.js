const { Logger } = require('./handler/botLogger.js');
const embedColor = {
	success: [76, 175, 80],
	alert: [187, 33, 36]
}
const configs = require('./config.json')
globalThis.Logger = Logger;
globalThis.embedColor = embedColor;
globalThis.configs = configs;
require('dotenv').config();
const fs = require('node:fs');
const { Client, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const commands = require('./handler/commandHandler.js');

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	sweepers: {
		messages: {
		interval: 3600, // Tiap 1 jam bersihkan pesan
		lifetime: 1800, // Hapus pesan yang usianya lebih dari 30 menit
		},
	}
});
globalThis.allComms = commands;
client.commands = commands;

const eventFiles = fs
	.readdirSync('./events')
	.filter((file)=>file.endsWith('.js'));
for(const file of eventFiles){
	const event = require(`./events/${file}`);
	client[event.once ? 'once' : 'on'](
		event.name,
		(...args) => event.execute(...args, client)
    );
    console.log(`Loaded event: ${file}`);
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error('Error saat menjalankan command:',error);
		try {
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.reply({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			}
		} catch (replyError) {
			// Catch while interaction token has expired
        	console.error('Failed sending error message to user (expired interaction):', replyError.message);
		}
	}
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);