const discord = require('discord.js')
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_void")
        .setDescription("Menghapus lubang hitam untuk bot ini."),
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
        if(guildData[0].void_channel_id === null){
            await interaction.reply({
                content: "Belum ada void channel yang disetup",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        const voidCh = await interaction.guild.channels.cache.get(guildData[0].void_channel_id);
        try {
            await voidCh.delete();
        } catch (error) {
            console.error(error);
        }
        try {
            await SqlDB.query(
                `UPDATE guild_info 
                SET void_channel_id = null,
                void_msg_id = null
                WHERE guild_id = ?`,
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
        await interaction.reply({
            content: "Channel void berhasil dihapus.",
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