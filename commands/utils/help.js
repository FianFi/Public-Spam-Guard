const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js')
const {modCheck} = require('./utils/modChecker.js')
const SqlDB = require('../../services/connection.js');
const { errorEmbed } = require('./utils/embeds.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Spam guardian bot command list."),
    async execute(interaction) {
        let guildData;
        try {
            [guildData] = await SqlDB.query(
                `SELECT guild_invite_link FROM guild_info WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            await interaction.reply({
                embeds: [await errorEmbed()],
                flags: MessageFlags.Ephemeral
            });
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
            return;
        }
        if(!guildData[0]){
            await interaction.reply({
                content: "This server hasn't been set up for the spam guard feature yet, please contact the server owner to set up this feature.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
    }
}