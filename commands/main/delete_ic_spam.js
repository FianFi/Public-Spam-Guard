const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_ic_spam")
        .setDescription("Menghapus pesan spam di 1 channel dari id yang diberikan.(Beta)[Resiko menghapus msg penting!]")
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
                content: "Terjadi kesalahan! Harap coba lagi nanti",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error(error);
            return;
        }
        if(!guildData[0]){
            await interaction.reply({
                content: "Server ini belum di setup untuk fitur spam guard, harap hubungi owner server untuk setup fitur ini.",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        if(interaction.user.id !== guildData[0].owner_id){
            await interaction.reply({
                content: "Hanya pemilik server dan admin yang dapat pesan spam manual!",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        let sampleMsg
        try{
            sampleMsg = await interaction.channel.messages.fetch(messageId);
        }catch(err){
            await interaction.reply({
                content: "Tidak ada sample msg di channel ini dari ID yang kamu masukkan",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error("Error occurred while anuing message:", err);
            return;
        }
        if(!sampleMsg){
            await interaction.reply({
                content: "Tidak ada sample msg di channel ini dari ID yang kamu masukkan",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error("Error occurred while anuing message:", err);
            return;
        }
        let sampleContent, sampleAttName;
        sampleContent = sampleMsg.content;
        try{
            sampleAttName = sampleMsg.attachments.map(a => a.name);
        }catch(err){
            console.error("Error occurred while anuing message:", err);
        }
        if(!sampleContent && sampleAttName.length === 0){
            await interaction.reply({
                content: "Tidak ada content dan attachment di message ini!\n harus menyertakan content atau attachment",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        await interaction.reply({
            content: "Scanning dan deleting sedang berlangsung...",
            flags: discord.MessageFlags.Ephemeral
        });
        const DC = await deleteMessageByIds(interaction, sampleMsg);
        await interaction.editReply({
            content: `Scanning selesai!\n${DC} pesan spam dihapus!`,
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
        console.log("mencari di channel "+channel.name)
        let lastId;
        const options = {limit:25};
        for(;;){
            if(notSpamIntv >= 5){
                console.log("Pesan spam ter-intervensi sebanyak "+notSpamIntv+"! Scan dihentikan.");
                return deleteCount;
            }
            if(lastId){
                options.before = lastId;
            }
            const messages = await channel.messages.fetch(options);
            if(!messages){
                console.log("Tidak ada pesan yang tersedia di channel ini!");
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
                        console.log("Pesan tidak terdeteksi sebagai spam: "+messageId);
                    }
                }else{
                    notSpamIntv++
                    console.log("Pesan tidak terdeteksi sebagai spam: "+messageId);
                }
            }
        }
        console.log("endtry dmbi")
        return deleteCount;
    } catch (error) {
        console.log("error dmbi")
        console.error("Error occurred while anuing message:", error);
        return deleteCount;
    }
}