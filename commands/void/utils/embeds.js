const { EmbedBuilder } = require('discord.js');

module.exports = {
    errorEmbed: async function (){
        return new EmbedBuilder()
            .setColor(embedColor.alert)
            .setTitle("Error")
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.")
            .setFooter(configs.embed_footer);
    }
}