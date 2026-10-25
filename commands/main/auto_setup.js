const discord = require('discord.js');
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("auto_setup")
        .setDescription("Setup lubang hitam untuk bot ini secara otomatis."),
    async execute(interaction) {
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
        const voidChannel = interaction.guild.channels.cache.find(
            c => c.name === 'void'
        );
        if(guildData[0].void_channel_id === null || !voidChannel){
            await interaction.reply({
                content: "Tunggu sebentar, sedang melakukan setup otomatis...",
                flags: discord.MessageFlags.Ephemeral
            });
            if(voidChannel){
                await voidChannel.delete();
            }
            const setupRes = await channelSetup(interaction);
            try {
                await SqlDB.query(
                    `UPDATE guild_info SET void_channel_id = ?, void_msg_id = ? WHERE guild_id = ?`,
                    [setupRes.voidId, setupRes.voidMsgId, interaction.guild.id]
                );
            } catch (error) {
                await interaction.editReply({
                    content: "Terjadi kesalahan! Harap coba lagi nanti",
                    flags: discord.MessageFlags.Ephemeral
                });
                console.error(error);
                return;
            }
            await interaction.editReply({
                content: "Setup otomatis selesai! pastikan lubang hitam sudah berada di paling atas channel server ini!\nPastikan juga untuk mengatur role bot ini diatas semua role di server ini (Member biasa) agar bot ini dapat bekerja dengan baik.\n\n",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        const embedss = await embed_alreadySetup(guildData, interaction);
        await interaction.reply({
            embeds: [embedss],
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

async function channelSetup(interaction,){
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

async function writeDB(interaction, voidId, voidMsgId){
    const db = await jsonDB();
    db[interaction.guild.id] = {...db.temp}
    db[interaction.guild.id].owner_id = interaction.guild.ownerId;
    db[interaction.guild.id].setuper_id = interaction.user.id;
    db[interaction.guild.id].spam_guard_channel_id = voidId;
    db[interaction.guild.id].void_msg_id = voidMsgId;
    fs.writeFileSync("guildVoids.json", JSON.stringify(db, null, 4));
}

async function embed_alreadySetup(guildData, interaction){
    const db = await jsonDB();
    return new discord.EmbedBuilder()
            .setColor([76, 175, 80])
            .setTitle("Guild sudah di setup!")
            .addFields(
                {
                name: "Owner:",
                value: `<@${interaction.guild.ownerId}>`
                },
                {
                name: "Void Channel:",
                value: `<#${guildData[0].void_channel_id}>`
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
                value: `Semua yang mengirim pesan di channel ini akan di banned secara otomatis oleh bot ini!\nJangan kirim pesan apapun di channel ini!`
                },
                {
                    name: "Kicks count: ",
                    value: "0"
                }
            )
}