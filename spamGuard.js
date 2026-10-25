// Require the necessary discord.js classes
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const commands = require('./events/commandHandler.js');   
const restart = require('./deploy-commands.js');   

// Create a new client instance
const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
] });

client.commands = commands;
// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
// client.once(Events.ClientReady, (interaction) => {
	// 	console.log(`Ready! Logged in as ${interaction.user.tag}`);
// });

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

// client.on(Events.MessageCreate, message => {
// 	event.clientMessageCreate(message)
// });
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	// console.log(command)
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
			// Tangkap jika token interaksi sudah expired agar bot TIDAK CRASH
        	console.error('Gagal mengirim pesan error ke pengguna (interaksi expired):', replyError.message);
		}
	}
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);