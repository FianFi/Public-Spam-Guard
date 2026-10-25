const discord = require('discord.js')
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_void")
        .setDescription("Removing void feature for this bot."),
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
        const isMod = await modChecker(interaction);
        if(interaction.user.id !== guildData[0].owner_id && !isMod){
            await interaction.reply({
                content: "Only the server owner and admins can use this command.",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        if(guildData[0].void_channel_id === null){
            await interaction.reply({
                content: "No void channel has been set up yet",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        const voidCh = await interaction.guild.channels.cache.get(guildData[0].void_channel_id);
        try {
            await voidCh.delete();
        } catch (error) {
            console.error(error);
        }
        try {
            await SqlDB.query(
                `UPDATE guild_info 
                SET void_channel_id = null,
                void_msg_id = null
                WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            await interaction.reply({
                content: "An error occurred! Please try again later!",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error(error);
            return;
        }
        await interaction.reply({
            content: "The void channel has been successfully deleted.",
            flags: discord.MessageFlags.Ephemeral
        });
    }
}
async function modChecker(interaction) {
    try {
        console.log("Menjalankan prosedur pengecekan status mod checker");
        const [modRole] = await SqlDB.query(
            "SELECT `admin_role` FROM guild_info WHERE `guild_id` = ?",
            [interaction.guild.id]
        ) 
        const clicker = await interaction.guild.members.fetch(interaction.user.id);
        const roles = clicker.roles.cache
            .filter(role => role.id !== interaction.guild.id) // exclude @everyone
            .map(role => ({
                role: role.id,
                name: role.name
            }));
        const tMods = modRole[0].admin_role;
        let isMods = false;
        for(const role of roles){
            if(tMods.includes(role.role)){
                console.log("Mods True");
                isMods = true;
            }
        }
        console.log("Mengecek status mod")
        if(!isMods){
            return false; 
        }
        console.log("Mereturn value function")
        return true;
    } catch (error) {
        console.error("Error in modChecker function: ", error);
        return false
    }
}