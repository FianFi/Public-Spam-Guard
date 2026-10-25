const { Events } = require('discord.js');
const SqlDB = require('../services/connection.js');
module.exports = {
    name: Events.ClientReady,
    async execute(client){
        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
}


