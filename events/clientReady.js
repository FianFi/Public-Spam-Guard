const { Events } = require('discord.js');
const SqlDB = require('../services/connection.js');
module.exports = {
    name: Events.ClientReady,
    async execute(client){
        console.log(`Ready! Logged in as ${client.user.tag}`);
        // 1. Fetch semua command dari Discord
        const discordCommands = await client.application.commands.fetch();
        // 2. Simpan ID-nya ke dalam client.commands lokal Anda
        discordCommands.forEach(appCmd => {
            const myCmd = client.commands.get(appCmd.name);
            if (myCmd) {
                myCmd.id = appCmd.id; // Pasangkan ID-nya di sini
            }
        });
    }
}


