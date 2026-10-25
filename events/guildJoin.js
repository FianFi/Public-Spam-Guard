/**Event ini akan berjalan saat bot dimasukkan kedalam server baru */
const { Events } = require('discord.js');
const SqlDB = require('../services/connection.js');

// const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Event ini terpicu saat bot diundang/masuk ke server baru
// client.on(Events.GuildCreate, async (guild) => {
//     console.log(`Bot bergabung ke server baru: ${guild.name} (${guild.id})`);
//     let guildInformations = {}
//     try {
//         guildInformations = await SqlDB.query(
//             "SELECT * FROM guild_info WHERE guild_id = ?",
//             [guild.id]
//         )[0]
//     } catch (error) {
//         console.error(error)
//         return;
//     }

//     if(!guildInformations){
//         try {
//             await SqlDB.query(
//                 `INSERT INTO guild_info (guild_id, guild_name, owner_id)
//                 VALUES (?,?,?)
//                 ON DUPLICATE KEY UPDATE
//                 guild_name = VALUES(guild_name),
//                 owner_id = VALUES(owner_id)`,
//                 [guild.id, guild.name, guild.ownerId]
//             )
//         } catch (error) {
//             console.error(error)
//             return;
//         }
//     }
// })
module.exports = {
    name: Events.GuildCreate, // Nama event
    async execute(guild) {
        console.log(`Bot bergabung ke server baru: ${guild.name} (${guild.id})`);
        let guildInformations = {}
        try {
            guildInformations = await SqlDB.query(
                "SELECT * FROM guild_info WHERE guild_id = ?",
                [guild.id]
            )[0]
        } catch (error) {
            console.error(error)
            return;
        }

        if(!guildInformations){
            try {
                await SqlDB.query(
                    `INSERT INTO guild_info (guild_id, guild_name, owner_id)
                    VALUES (?,?,?)
                    ON DUPLICATE KEY UPDATE
                    guild_name = VALUES(guild_name),
                    owner_id = VALUES(owner_id)`,
                    [guild.id, guild.name, guild.ownerId]
                )
                console.log(`✅ Berhasil menyimpan server ${guild.name} ke database!`);
            } catch (error) {
                console.error(`❌ Gagal menyimpan ke database:`,error);
                return;
            }
        }
    }
};