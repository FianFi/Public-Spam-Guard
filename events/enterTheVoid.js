const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../services/connection.js');

module.exports = {
    name: discord.Events.MessageCreate,
    async execute(message) {
        if (!message.guild || message.author.bot) return;
        let guildData;
        try {
            [guildData] = await SqlDB.query(
                `SELECT * FROM guild_info WHERE guild_id = ?`,
                [message.guild.id]
            );
        } catch (error) {
            await message.guild.systemChannel.send({
                content: "Terjadi kesalahan dengan bot guardian! Harap hapus spam manual dan beri laporan!",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error(error);
            return;
        }
        if(!guildData[0])return;
        if(message.channel.id !== guildData[0].void_channel_id) return;
        const logCh = guildData[0].log_channel_id ? await message.client.channel.fetch(guildData[0].log_channel_id) : message.guild.systemChannel;
        if(!message.member.kickable){
            await message.author.send({
                content: `Anda terdeteksi spam di server **${message.guild.name}**!! harap amankan akun anda dan hapus spam secara manual.\nBot ini tidak dapat mengeluarkan anda dari server! harap hapus spam manual sesuai perintah dari owner!`
            });
        	await message.delete().catch(()=>{});
            if(!logCh) return;
            await logCh.send({
                content: `**<@${message.author.id}>** tidak bisa dikeluarkan dari server ini! Harap hapus manual pesan spam yang dikirim!`
            });
            return;
        }
        if(message.channel.id === guildData[0].void_channel_id){
            try {
                await SqlDB.query(
                    `UPDATE guild_info SET kick_count = kick_count + 1 WHERE guild_id = ?`,
                    [message.guild.id]
                );
            } catch (error) {
                await logCh.send({
                    content: "Terjadi kesalahan dengan bot guardian! Harap hapus spam manual dan beri laporan!",
                    flags: discord.MessageFlags.Ephemeral
                });
                console.error(error);
                return;
            }
            const dmContent = guildData[0].guild_invite_link ? 
            `Anda telah di kick dari server **${message.guild.name}** karena mengirim pesan di channel lubang hitam!\n\nJika anda ingin masuk kembali ke server ini, silahkan gunakan link undangan berikut: ${guildData[0].guild_invite_link}` : 
            `Anda telah di kick dari server **${message.guild.name}** karena mengirim pesan di channel lubang hitam!`;
            await message.author.send({
                content: dmContent
            }).catch(()=>{});
        	await message.delete().catch(()=>{});
            await message.guild.members.kick(message.author.id, {reason: "Spam Guard"});
            await embed_voidChMessage(message);
            const voidCh = await message.guild.channels.cache.get(guildData[0].void_channel_id);
            const voidMsg = await voidCh.messages.fetch(guildData[0].void_msg_id);
            await voidMsg.edit({
                embeds: [await embed_voidChMessage(message)]
            });
        }
    }
}
async function jsonDB(){
    const srcTicketdb = JSON.parse(
        fs.readFileSync("guildVoids.json", "utf8")
    );
    return srcTicketdb;
}
async function embed_voidChMessage(message){
    let kickCounts;
    try {
        [kickCounts] = await SqlDB.query(
            `SELECT kick_count FROM guild_info WHERE guild_id = ?`,
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
                value: `Semua yang mengirim pesan di channel ini akan di banned secara otomatis oleh bot ini!\nJangan kirim pesan apapun di channel ini!`
                },
                {
                    name: "Kicks count: ",
                    value: kickCounts ? `${kickCounts[0].kick_count}` : `NotSure`
                }
            )
}