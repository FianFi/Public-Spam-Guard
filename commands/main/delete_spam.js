const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_spam")
        .setDescription("Menghapus pesan spam dari id yang diberikan.(Beta)[Resiko menghapus msg penting!]")
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
                content: "Hanya pemilik server dan admin yang dapat menghapus channel void!",
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
        let sampleContent, sampleAttName;
        try{
            sampleContent = sampleMsg.content;
        }catch(err){
            console.error("Error occurred while anuing message:", err);
        }
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
        const channelIds = await takeAllChID(interaction, interaction.guild.id);
        const DC = await deleteMessageByIds(interaction, channelIds, sampleMsg);
        await interaction.editReply({
            content: `Scanning selesai!\n${DC} pesan spam dihapus!`,
            flags: discord.MessageFlags.Ephemeral
        }); 
    }
}

async function jsonDB(){
    const srcTicketdb = JSON.parse(
        fs.readFileSync("guildVoids.json", "utf8")
    );
    return srcTicketdb;
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
        console.error("Error occurred while anuing message:", error);
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
            console.log("mencari di channel "+channel.name)
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
        console.log("endtry dmbi")
        return deleteCount;
    } catch (error) {
        console.log("error dmbi")
        console.error("Error occurred while anuing message:", error);
        return deleteCount;
    }
}