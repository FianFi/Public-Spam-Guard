require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		
		// The put method is used to fully refresh all commands in tester Guild with the current set
		// await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, "1396505097382658149"), { body: [] });
		if(process.env.TESTER_GUILD){
			const dataTester = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, process.env.TESTER_GUILD), { body: []});
			console.log(`Successfully reloaded ${dataTester.length} application (/) commands in test guild.`);
		}
		// The put method is used to fully refresh all commands in global with the current set
		const data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: []});
		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();