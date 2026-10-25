const discord = require('discord.js')

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("setup")
        .setDescription("Setup lubang hitam untuk bot ini secara manual."),
    async execute(interaction) {
        try {
            const cmds = await interaction.client.application.commands.fetch();
            const cmd = cmds.find(c => c.name === 'auto_setup');
            console.log(cmds)
            const cmdTag = cmd ? ` </auto_setup:${cmd.id}>` :  `/auto_setup`;
            await interaction.reply({
                content: `Tunggu update selanjutnya untuk setup manual ini!\nGunakan command **${cmdTag}** untuk setup sekarang`,
                flags: discord.MessageFlags.Ephemeral
            }); 
        } catch (error) {
            await interaction.reply({
                content: `Error saat menjalankan perintah. Harap coba lagi nanti!`,
                flags: discord.MessageFlags.Ephemeral
            });
            console.error(`Error caught while running setup program: ${error}`)
        }
    }
}