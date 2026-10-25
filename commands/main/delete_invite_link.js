const discord = require('discord.js')
const fs = require('fs');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("delete_invite_link")
        .setDescription("Menghapus link undangan untuk bot ini."),
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
                content: "Hanya pemilik server yang dapat mengatur link undangan untuk bot ini.",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        if(guildData[0].guild_invite_link === null){
            await interaction.reply({
                content: "Belum ada invite link yang dicantumkan di bot ini!",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        try {
            await SqlDB.query(
                `UPDATE guild_info 
                SET guild_invite_link = null
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
            content: `Invite link telah dihapus.`,
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