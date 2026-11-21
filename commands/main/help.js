const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Spam guardian bot command list."),
    async execute(interaction) {
        const list = {
            title: "Command List",
            commandLists: {}
        }
        // Create object for folder list and command per folder.
        allComms.forEach(comm => {
            const setupId = interaction.client.commands.get(comm.data.name)?.id;
            const command = setupId ? `</${comm.data.name}:${setupId}>` : `/${comm.data.name}` ;
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
        // Read command folder and add command list per folder
        const alamak = Object.keys(list.commandLists);
        const helpEmbed = new EmbedBuilder()
            .setColor(embedColor.success)
            .setTitle("🛡️ Spam Guard Help")
            .setDescription(configs.description+"\n\n"+configs.help_description)
            .setFooter(configs.embed_footer)
        alamak.forEach(folder => {
            let comms = '';
            list.commandLists[folder].forEach(comm => {
                comms += `${comm.command} `
            })
            helpEmbed.addFields({
                name: folder,
                value: comms
            });
        })
        await interaction.reply({
            embeds: [helpEmbed],
            flags: MessageFlags.Ephemeral
        })

    }
}