const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js')
const SqlDB = require('../../services/connection.js');
const { errorEmbed } = require('./functs/embeds.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Spam guardian bot command list."),
    async execute(interaction) {
        const list = {
            title: "Command List",
            commandLists: {}
        }
        allComms.forEach(comm => {
            const setupId = interaction.client.commands.get(comm.data.name)?.id;
            const command = `</${comm.data.name}:${setupId}>`;
            if(!list.commandLists[comm.data.folder]){
                console.log("ui1")
                list.commandLists[comm.data.folder] = [{
                    command: command,
                    commDesc: comm.data.description
                }];
                console.log(list)
            }else{
                console.log("ui2")
                list.commandLists[comm.data.folder].push({
                    command: command,
                    commDesc: comm.data.description
                });
            }
        });
        console.log(list);
        console.log(list.commandLists);
        const alamak = Object.keys(list.commandLists);
        alamak.forEach(folder => {
            console.log(folder);
            console.log(list.commandLists[folder]);
            list.commandLists[folder].forEach(command => {
                console.log(command)
            })
        });
        const helpEmbed = new EmbedBuilder()
            .setColor(embedColor.success)
            .setTitle("List");
        let comms;
        alamak.forEach(folder => {
            list.commandLists[folder].forEach(comm => {
                comms += `${comm.command} ${comm.commDesc}\n`
            })
            helpEmbed.addFields({
                name: folder,
                value: comms
            });
        })
        await interaction.reply({
            embeds: [helpEmbed]
            })
            // Di file command lain (misal help.js):
        // for(const comm of allComms){
        //     comm[0].data.hellasa = "uyyyy";
        //     console.log(comm[0]);
        //     console.log(comm[1].data.name);
        //     console.log(comm[1].data.description);
        //     console.log(comm[2]);
        // }
        // let guildData;
        // try {
        //     [guildData] = await SqlDB.query(
        //         `SELECT guild_invite_link FROM guild_info WHERE guild_id = ?`,
        //         [interaction.guild.id]
        //     );
        // } catch (error) {
        //     await interaction.reply({
        //         embeds: [await errorEmbed()],
        //         flags: MessageFlags.Ephemeral
        //     });
        //     Logger.error(interaction.guild.id, `[DB] ${error}`);
        //     console.error(error);
        //     return;
        // }
        // if(!guildData[0]){
        //     await interaction.reply({
        //         content: "This server hasn't been set up for the spam guard feature yet, please contact the server owner to set up this feature.",
        //         flags: MessageFlags.Ephemeral
        //     });
        //     return;
        // }
    }
}