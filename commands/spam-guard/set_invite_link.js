const discord = require('discord.js')
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("set_invite_link")
        .setDescription("Adding an invite link to appear in the bot's DM to spam users if they get kicked.")
        .addStringOption(option =>
            option.setName("link")
                .setDescription("This server invitatin link.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const inviteLink = interaction.options.getString("link");
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
        if(guildData[0].guild_invite_link !== null){
            await interaction.reply({
                content: "There’s already an invite link listed in this bot!",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        try {
            await SqlDB.query(
                `UPDATE guild_info
                SET guild_invite_link = ?
                WHERE guild_id = ? `,
                [inviteLink, interaction.guild.id]
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
            content: `The invitation link has been set: ${inviteLink}`,
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