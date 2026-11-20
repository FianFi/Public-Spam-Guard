const {REST, Collection, Routes} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = new Collection(); 
const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	console.log(commandsPath)
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
	const args = commandsPath.split("\\")
	console.log(args[args.length-1])
	const fileFold = args[args.length-1];
	console.log(commandFiles)
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			command.data["folder"] = fileFold
			commands.set(command.data.name, command, fileFold);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

module.exports = commands;