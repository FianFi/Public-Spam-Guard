const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js')
const {modCheck} = require('./utils/modChecker.js')
const SqlDB = require('../../services/connection.js');
const { errorEmbed } = require('./utils/embeds.js');

module.exports = {
    data: new SlashCommandBuilder()
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
        const isMod = await modCheck(interaction);
        if(interaction.user.id !== interaction.guild.ownerId && !isMod){
            await interaction.reply({
                embeds: [await errorEmbed()],
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        if(guildData[0].guild_invite_link !== null){
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(embedColor.alert)
                        .setTitle("Invite link already listed!")
                        .setDescription("Link: "+guildData[0].guild_invite_link) 
                    
                ],
                flags: MessageFlags.Ephemeral
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
                embeds: [await errorEmbed()],
                flags: MessageFlags.Ephemeral
            });
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
            return;
        }
        Logger.info(interaction.guild.id, `[INVITE_LINK_SET] ${interaction.user.username}(${interaction.user.id}) has set server invite link "${inviteLink}"`);
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(embedColor.success)
                    .setTitle("Invite link seted!")
                    .setDescription("Link: "+inviteLink) 
            ],
            flags: MessageFlags.Ephemeral
        }); 
    }
}