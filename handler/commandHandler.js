const {REST, Collection, Routes} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = new Collection(); 
// Masuk path D:\Fian\Discord\Bot\Mouri\commands
const foldersPath = path.join(__dirname, '../commands');
// console.log(foldersPath);
// Melihat folders yang ada di path D:\Fian\Discord\Bot\Mouri\commands
const commandFolders = fs.readdirSync(foldersPath);
console.log("command handler 1")
for (const folder of commandFolders) {
	// Masuk path commandFolders
	const commandsPath = path.join(foldersPath, folder);
	//melihat file berakhiran.js didalam commandsPath
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
		// console.log(foldersPath);
		// console.log(commandFolders);
		// console.log(commandsPath);
		// console.log(commandFiles);
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			// console.log(filePath);
		const command = require(filePath);
		// console.log(command)
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
		// console.log(client.commands);
	}
}

module.exports = commands;