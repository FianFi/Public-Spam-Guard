const { Events } = require('discord.js');
const SqlDB = require('../services/connection.js');
module.exports = {
    name: Events.ClientReady,
    async execute(client){
        // Fetch all command from Discord
        const discordCommands = await client.application.commands.fetch();
        // Save ID inside local client.commands 
        discordCommands.forEach(appCmd => {
            const myCmd = client.commands.get(appCmd.name);
            if (myCmd) {
                myCmd.id = appCmd.id; // Pasangkan ID-nya di sini
            }
        });
        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
}


