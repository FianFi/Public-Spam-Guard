const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("void_setup")
        .setDescription("Set up a black hole channel for this bot."),
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
        if(interaction.user.id !== interaction.guild.ownerId){
            await interaction.reply({
                content: "Only the server owner can set up void!",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        const voidChannel = interaction.guild.channels.cache.find(
            c => c.name === 'void'
        );
        if(!guildData[0] || !voidChannel){
            await interaction.reply({
                content: "Hold on a sec, setting up automatically...",
                flags: discord.MessageFlags.Ephemeral
            });
            if(voidChannel){
                await voidChannel.delete();
            }
            const setupRes = await channelSetup(interaction);
            try {
                await SqlDB.query(
                    "INSERT INTO `void_setting`(`guild_id`, `void_channel_id`, `void_msg_id`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE void_channel_id = VALUES(void_channel_id), void_msg_id = VALUES(void_msg_id)",
                    [interaction.guild.id, setupRes.voidId, setupRes.voidMsgId]
                );
            } catch (error) {
                await interaction.editReply({
                    content: "An error occurred! Please try again later!",
                    flags: discord.MessageFlags.Ephemeral
                });
                console.error(error);
                return;
            }
            await interaction.editReply({
                content: "Automatic setup complete! Make sure the void is at the top of this server channel!\n Then, make sure to set this bot's role above all roles in this server (regular Members) so that the bot can work properly.\n\n",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        const embedss = await embed_alreadySetup(interaction);
        await interaction.reply({
            embeds: [embedss],
            flags: discord.MessageFlags.Ephemeral
        });
    }
}

async function channelSetup(interaction){
    const voidCh = await interaction.guild.channels.create({
        name: "void",
        type: discord.ChannelType.GuildText
    });
    const voidMsg = await voidCh.send({
        embeds: [await embed_voidChMessage(interaction)],
        });
    return{
        voidId: voidCh.id,
        voidMsgId: voidMsg.id
    };
}
async function embed_alreadySetup(interaction){
    let voidData;
    try {
        [voidData] = await SqlDB.query(
            `SELECT * FROM guild_info WHERE guild_id = ?`,
            [interaction.guild.id]
        );
    } catch (error) {
        console.error("An error occured in embed function: ",error);
        return new discord.EmbedBuilder()
            .setColor([187, 33, 36])
            .setTitle("Error")
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.")
    }
    return new discord.EmbedBuilder()
            .setColor([76, 175, 80])
            .setTitle("Void Information")
            .addFields(
                {
                    name: "Void Channel:",
                    value: `<#${voidData[0].void_channel_id}>`
                },
                {
                    name: "Void Enabled:",
                    value: `${voidData[0].void_enabled ? "True" : "False"}`,
                    inline: true
                },
                {
                    name: "Void Punishment",
                    value: `${voidData[0].void_punishment}`,
                    inline: true
                }
            )
}

async function embed_voidChMessage(){
    return new discord.EmbedBuilder()
            .setColor([76, 175, 80])
            .setTitle("Void Channel!")
            .addFields(
                {
                name: "",
                value: `Everyone who sends a message in this channel will be automatically banned by this bot!\nDon't send any messages in this channel!`
                },
                {
                    name: "Kicks count: ",
                    value: "0"
                }
            )
}