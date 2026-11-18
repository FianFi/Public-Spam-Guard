const discord = require('discord.js')
const {modCheck} = require('./utils/modChecker.js')
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
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
            return;
        }
        Logger.info(interaction.guild.id, `[INVITE_LINK_SET] ${interaction.user.username}(${interaction.user.id}) has set server invite link "${inviteLink}"`);
        await interaction.reply({
            content: `The invitation link has been set: ${inviteLink}`,
            flags: discord.MessageFlags.Ephemeral
        }); 
    }
}