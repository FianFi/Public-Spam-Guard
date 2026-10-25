const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_spam")
        .setDescription("Deleting spam messages from the given ID. (Beta) [Risk of deleting important messages!]")
        .addStringOption(option =>
            option.setName("message_id")
                .setDescription("ID dari salah satu pesan spam yang ingin dihapus.")
                .setRequired(true)),
    async execute(interaction){
        const messageId = interaction.options.getString("message_id");
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
        if(interaction.user.id !== guildData[0].owner_id){
            await interaction.reply({
                content: "Only the server owner and admins can delete spam messages.",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        let sampleMsg
        try{
            sampleMsg = await interaction.channel.messages.fetch(messageId);
        }catch(err){
            await interaction.reply({
                content: "There’s no sample msg in this channel from the ID you entered",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error("Error occurred while finding message sample:", err);
            return;
        }
        let sampleContent, sampleAttName;
        try{
            sampleContent = sampleMsg.content;
        }catch(err){
            console.error("Error occurred while finding message sample:", err);
        }
        try{
            sampleAttName = sampleMsg.attachments.map(a => a.name);
        }catch(err){
            console.error("Error occurred while finding message sample:", err);
        }
        if(!sampleContent && sampleAttName.length === 0){
            await interaction.reply({
                content: "There's no content or attachment in this message!\nYou need to include content or an attachment",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.reply({
            content: "Scanning and deleting in progress...",
            flags: discord.MessageFlags.Ephemeral
        });
        const channelIds = await takeAllChID(interaction, interaction.guild.id);
        const DC = await deleteMessageByIds(interaction, channelIds, sampleMsg);
        await interaction.editReply({
            content: `Scanning complete!\n${DC} spam messages deleted!`,
            flags: discord.MessageFlags.Ephemeral
        }); 
    }
}
async function takeAllChID(interaction, guild_id){
    try {
        const guild = await interaction.client.guilds.fetch(guild_id);
        if(guild){
            const channelIds = guild.channels.cache.filter(ch => 
                ch.type === discord.ChannelType.GuildText ||
                ch.type === discord.ChannelType.GuildVoice
            )
            .map(channel => channel.id);
            return channelIds;
        }
        return [];
    } catch (error) {
        console.error("Error occurred while finding all channel id:", error);
        return [];
    }
}
async function deleteMessageByIds(interaction, channelIds, sampleMsg){
    try {
        let deleteCount = 0;
        for(const channelId of channelIds){
            let channel = interaction.client.channels.cache.get(channelId);
            if(!channel){
                channel = await interaction.client.channels.fetch(channelId);
            }
            console.log("Finding at "+channel.name)
            const message = await channel.messages.fetch({ limit: 5 });
            for(const msg of message.values()){
                let sameContent, sameAttachs, sameUser = false;
                let smlAtts;
                if(msg.author.id === sampleMsg.author.id){
                    sameUser = true;
                }
                if(msg.content === sampleMsg.content && sampleMsg.content !== ''){
                    sameContent = true
                }
                smlAtts = sampleMsg.attachments.map(a => a.name);
                msgAtts = msg.attachments.map(a => a.name);
                if(smlAtts.length !== 0){
                    sameAttachs = smlAtts.length === msgAtts.length && smlAtts.every((val, i) => val === msgAtts[i]);
                }
                if(sameUser){
                    if(sameContent || sameAttachs){
                        await msg.delete();
                        console.log(`Deleted message in channel: ${channel.name}`);
                        deleteCount++
                    }
                }
            }
        }
        return deleteCount;
    } catch (error) {
        console.error("Error occurred while deleting spam message:", error);
        return deleteCount;
    }
}