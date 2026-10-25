const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_ic_spam")
        .setDescription("Deleting spam messages in 1 channel from the given ID. (Beta) [Risk of deleting important messages!]")
        .addStringOption(option =>
            option.setName("message_id")
                .setDescription("The ID of one of the spam messages you want to delete.")
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
                content: "Only the server owner and admins can manually delete spam messages!",
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
            console.error("Error occurred while anuing message:", err);
            return;
        }
        if(!sampleMsg){
            await interaction.reply({
                content: "There’s no sample msg in this channel from the ID you entered",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error("Error occurred while finding message sample:", err);
            return;
        }
        let sampleContent, sampleAttName;
        sampleContent = sampleMsg.content;
        try{
            sampleAttName = sampleMsg.attachments.map(a => a.name);
        }catch(err){
            console.error("Error occurred while finding message sample:", err);
        }
        if(!sampleContent && sampleAttName.length === 0){
            await interaction.reply({
                content: "There's no content or attachment in this message!\nYou need to include some content or an attachment",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.reply({
            content: "Scanning and deleting in progress...",
            flags: discord.MessageFlags.Ephemeral
        });
        const DC = await deleteMessageByIds(interaction, sampleMsg);
        await interaction.editReply({
            content: `Scanning complete!\n${DC} spam messages deleted!`,
            flags: discord.MessageFlags.Ephemeral
        }); 
    }
}

async function deleteMessageByIds(interaction, sampleMsg){
    try {
        let deleteCount = 0;
        let notSpamIntv = 0;
        let channel = interaction.client.channels.cache.get(interaction.channel.id);
        if(!channel){
            channel = await interaction.client.channels.fetch(interaction.channel.id);
        }
        console.log("in "+channel.name)
        let lastId;
        const options = {limit:25};
        for(;;){
            if(notSpamIntv >= 5){
                console.log("Spam messages were intercepted as many as "+notSpamIntv+"! The scan was stopped.");
                return deleteCount;
            }
            if(lastId){
                options.before = lastId;
            }
            const messages = await channel.messages.fetch(options);
            if(!messages){
                console.log("No messages are available in this channel!");
                return deleteCount;
            }
            for(const [messageId, message] of messages){
                lastId = messageId
                let sameContent, sameAttachs, sameUser = false;
                let smlAtts;
                if(message.author.id === sampleMsg.author.id){
                    sameUser = true;
                }
                if(message.content === sampleMsg.content && sampleMsg.content !== ''){
                    sameContent = true
                }
                smlAtts = sampleMsg.attachments.map(a => a.name);
                msgAtts = message.attachments.map(a => a.name);
                if(smlAtts.length !== 0){
                    sameAttachs = smlAtts.length === msgAtts.length && smlAtts.every((val, i) => val === msgAtts[i]);
                }
                if(sameUser){
                    if(sameContent || sameAttachs){
                        await message.delete();
                        console.log(`Deleted message in channel: ${channel.name}`);
                        deleteCount++
                        notSpamIntv = 0;
                    }else{
                        notSpamIntv++
                        console.log("Message not detected as spam: "+messageId);
                    }
                }else{
                    notSpamIntv++
                    console.log("Message not detected as spam: "+messageId);
                }
            }
        }
    } catch (error) {
        console.error("Error occurred while deleting spam message:", error);
        return deleteCount;
    }
}