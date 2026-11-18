const discord = require('discord.js')
const SqlDB = require('../../services/connection.js');
const {modCheck} = require('./utils/modChecker.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_invite_link")
        .setDescription("Removing the invite link for this bot."),
    async execute(interaction) {
        let guildData;
        try {
            [guildData] = await SqlDB.query(
                `SELECT * FROM guild_info WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            await interaction.reply({
                content: "An error occurred! Please try again later!",
                flags: discord.MessageFlags.Ephemeral
            });
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
            return;
        }
        if(!guildData[0]){
            await interaction.reply({
                content: "This server hasn't been set up for the spam guard feature yet, please contact the server owner to set up this feature.",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        const isMod = await modCheck(interaction);
        if(interaction.user.id !== guildData[0].owner_id && !isMod){
            await interaction.reply({
                content: "Only the server owner and admins can use this command.",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        if(guildData[0].guild_invite_link === null){
            await interaction.reply({
                content: "There’s no invite link listed in this bot yet!",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        try {
            await SqlDB.query(
                `UPDATE guild_info 
                SET guild_invite_link = null
                WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            await interaction.reply({
                content: "An error occurred! Please try again later!",
                flags: discord.MessageFlags.Ephemeral
            });
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
            return;
        }
        
        Logger.info(interaction.guild.id, `[DELETE_INVITE_LINK] Invite link has deleted by ${interaction.user.username}(${interaction.user.id})`);
        await interaction.reply({
            content: `The invite link has been deleted.`,
            flags: discord.MessageFlags.Ephemeral
        }); 
    }
}