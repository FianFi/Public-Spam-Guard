const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../services/connection.js');

module.exports = {
    name: discord.Events.MessageCreate,
    async execute(message) {
        if (!message.guild || message.author.bot) return;
        let voidData;
        try {
            [voidData] = await SqlDB.query(
                `SELECT * FROM void_setting WHERE guild_id = ?`,
                [message.guild.id]
            );
        } catch (error) {
            await message.guild.systemChannel.send({
                content: "An error occurred! Please delete the spam manually and file a report!",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error(error);
            return;
        }
        if(!voidData[0])return;
        if(message.channel.id !== voidData[0].void_channel_id) return;
        const logCh = voidData[0].log_channel_id ? await message.client.channels.fetch(voidData[0].log_channel_id) : message.guild.systemChannel;
        if(!message.member.kickable){
            await message.author.send({
                content: `You have been detected as spam on the **${message.guild.name}** server!! please secure your account and delete the spam manually.\n
                This bot cannot kick you out of the server! please manually delete the spam as instructed by the owner!`
            }).catch((error)=>{console.error(error)});
        	await message.delete().catch(()=>{});
            if(!logCh) return;
            await logCh.send({
                content: `**<@${message.author.id}>** can't be kicked from this server! Please manually delete the spam messages that were sent!`
            });
            return;
        }
        if(message.channel.id === voidData[0].void_channel_id){
            try {
                await SqlDB.query(
                    `UPDATE void_setting SET kick_count = kick_count + 1 WHERE guild_id = ?`,
                    [message.guild.id]
                );
            } catch (error) {
                await logCh.send({
                    content: "An error occurred! Please delete the spam manually and file a report!",
                    flags: discord.MessageFlags.Ephemeral
                });
                console.error(error);
                return;
            }
            let inviteLink;
            try {
                [inviteLink] = await SqlDB.query(
                    `SELECT guild_invite_link FROM guild_info WHERE guild_id = ?`,
                    [message.guild.id]
                );
            } catch (error) {
                console.error(error);
            }
            let dmContent = `You have been kicked from the server **${message.guild.name}** for sending messages in the Void channel!`;
            if(inviteLink){
                dmContent = inviteLink[0].guild_invite_link ? 
                `You have been kicked from the server **${message.guild.name}** for sending messages in the Void channel!\n\nIf you want to join this server again, feel free to use the following invite link: ${inviteLink[0].guild_invite_link}` : 
                dmContent;
            }
            await message.author.send({
                content: dmContent
            }).catch((error)=>{console.log(error)});
        	await message.delete().catch(()=>{});
            await message.guild.members.kick(message.author.id, {reason: "Spam Guard"});
            await embed_voidChMessage(message);
            const voidCh = await message.guild.channels.cache.get(voidData[0].void_channel_id);
            const voidMsg = await voidCh.messages.fetch(voidData[0].void_msg_id);
            await voidMsg.edit({
                embeds: [await embed_voidChMessage(message)]
            });
        }
    }
}
async function embed_voidChMessage(message){
    let kickCounts;
    try {
        [kickCounts] = await SqlDB.query(
            `SELECT kick_count FROM void_setting WHERE guild_id = ?`,
            [message.guild.id]
        );
    } catch (error) {
        console.error(error);
        return;
    }
    return new discord.EmbedBuilder()
            .setColor([76, 175, 80])
            .setTitle("Void Channel!")
            .addFields(
                {
                name: "",
                value: `Everyone who sends a message in this channel will be automatically banned by this bot\nDon't send any messages in this channel!`
                },
                {
                    name: "Kicks count: ",
                    value: kickCounts ? `${kickCounts[0].kick_count}` : `NotSure`
                }
            )
}