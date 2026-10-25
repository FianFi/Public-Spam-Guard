const { Events } = require('discord.js');
const SqlDB = require('../services/connection.js');
module.exports = {
    name: Events.ClientReady,
    async execute(client){
        console.log(`Ready! Logged in as ${client.user.tag}`);
        for(const [guildId, guild] of client.guilds.cache){
            let guildInformations = {}
            try {
                [guildInformations] = await SqlDB.query(
                    "SELECT * FROM guild_info WHERE guild_id = ?",
                    [guild.id]
                )
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
                } catch (error) {
                    console.error(error);
                    return;
                }
            }
        }
        console.log("Database ready!")
    }
}


