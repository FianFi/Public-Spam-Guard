const config = require('../config.json')
const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    execute(message){ 
        let args = "";
        config.PREFIX.forEach ((prefix) => {
            if(message.content.startsWith(prefix)){
                args = message.content.substring(prefix.length);
            }
        });
        if(!args) return;
        if (message.author.bot) return;
        
        console.log(message.content + " - "+message.author.username+" - "+args);
        switch (args){
            case "ping":
                message.reply("pong! Latency "+ message.client.ws.ping + "ms");
            break;
            case "halo":
                message.reply(`Halo juga <@${message.author.id}>! semoga harimu menyenangkan!`);
            break;
        
            default:
            break;
        }
    }
}