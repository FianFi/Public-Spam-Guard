const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js')
const {modCheck} = require('./utils/modChecker.js')
const SqlDB = require('../../services/connection.js');
const { errorEmbed } = require('./utils/embeds.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete_void")
        .setDescription("Removing void feature for this bot."),
    async execute(interaction) {
        let guildData;
        try {
            [guildData] = await SqlDB.query(
                `SELECT 
                guild_info.guild_id,
                guild_info.owner_id, 
                void_setting.void_channel_id 
                FROM guild_info 
                JOIN void_setting 
                ON guild_info.guild_id = void_setting.guild_id 
                WHERE guild_info.guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            await interaction.reply({
                embeds: [await errorEmbed()],
                flags: MessageFlags.Ephemeral
            });
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
        const isMod = await modCheck(interaction);
        if(interaction.user.id !== interaction.guild.ownerId && !isMod){
            await interaction.reply({
                content: "Only the server owner and admins can use this command.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        if(guildData[0].void_channel_id === null){
            await interaction.reply({
                content: "No void channel has been set up yet",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const voidCh = await interaction.guild.channels.cache.get(guildData[0].void_channel_id);
        try {
            await SqlDB.query(
                `DELETE FROM void_setting WHERE void_setting.guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            await interaction.reply({
                embeds: [await errorEmbed()],
                flags: MessageFlags.Ephemeral
            });
            console.error(error);
            return;
        }
        try {
            await voidCh.delete();
        } catch (error) {
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
        }
        Logger.info(interaction.guild.id, `[VOID_DELETE] Void channel has deleted by ${interaction.user.username}(${interaction.user.id})`);
        await interaction.reply({
            content: "The void channel has been successfully deleted.",
            flags: MessageFlags.Ephemeral
        });
    }
}