require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const commands = require('./events/commandHandler.js');   
const restart = require('./deploy-commands.js');   

const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
] });

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