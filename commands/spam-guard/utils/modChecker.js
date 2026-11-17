const SqlDB = require('../../../services/connection.js');

module.exports = {
    async modCheck(interaction){
        try {
            const [modRole] = await SqlDB.query(
                "SELECT `admin_role` FROM guild_info WHERE `guild_id` = ?",
                [interaction.guild.id]
            ) 
            const clicker = await interaction.guild.members.fetch(interaction.user.id);
            const tMods = modRole[0].admin_role;
            const isMods = clicker.roles.cache.has(tMods);
            console.log(isMods);
            if(isMods){
                console.log("Mods True");
            }
            return isMods; 
        } catch (error) {
            console.error("Error in modChecker function: ", error);
            return false
        }
    }
}