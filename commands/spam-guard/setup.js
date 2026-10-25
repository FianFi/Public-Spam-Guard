const discord = require('discord.js');
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("setup")
        .setDescription("Manual void setup."),
    async execute(interaction) {
        console.log(
            interaction.user.id, "\n", interaction.guild.ownerId
        )
        if(interaction.user.id !== interaction.guild.ownerId){
            await interaction.reply({
                content: "Only the server owner can set up void!",
                flags: discord.MessageFlags.Ephemeral
            });
            return;
        }
        let guildData;
        try {
            [guildData] = await SqlDB.query(
                `SELECT * FROM guild_info WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            await interaction.reply({
                content: "An error occurred! Please try again later!",
                flags: discord.MessageFlags.Ephemeral
            });
            console.error(error);
            return;
        }
        if(guildData[0]){
            const giEmbed = await guildInformationEmbed(interaction);
            await interaction.reply({
                embeds: [giEmbed],
                components: 
                    giEmbed.data.title === "Error" ?
                    [] :
                    [await setupComponents()],
                flags: discord.MessageFlags.Ephemeral
            });
            console.log(giEmbed.data.title);
        }else if(!guildData[0]){
            const guildId = interaction.guild.id;
            const guildName = interaction.guild.name;
            const guildOwnerId = interaction.guild.ownerId;
            let modRole;
            try {
                modRole = await interaction.guild.roles.create({
                    name: 'Spam Guard Moderator',
                    colors: {
                        primaryColor: 0x3498DB
                    },
                    reason: 'This bot creates this role during setup'
                });
            } catch (error) {
                console.error("Error occurred while inserting table:",error)
                await interaction.reply({
                    content: "An error occurred! Please try again later!",
                    flags: discord.MessageFlags.Ephemeral
                });
                return;
            }
            const adminRoleId = modRole.id;
            let insertStatus;
            try {
                [insertStatus] = await SqlDB.query(
                    "INSERT INTO `guild_info`(`guild_id`, `guild_name`, `owner_id`, `admin_role`) VALUES (?,?,?,?)",
                    [guildId, guildName, guildOwnerId, adminRoleId]
                )
            } catch (error) {
                console.error("Error occurred while inserting table:",error)
                await interaction.reply({
                    content: "An error occurred! Please try again later!",
                    flags: discord.MessageFlags.Ephemeral
                });
                return;
            }
            if(insertStatus.affectedRows === 1){
                await interaction.reply({
                    content: "Server setup was successful!\nYou can adjust the moderator role however you like",
                    flags: discord.MessageFlags.Ephemeral
                });
            }else{
                await interaction.reply({
                    content: "An error occurred! Please try again later!\nOr send a report if you think this is a system error.",
                    flags: discord.MessageFlags.Ephemeral
                });
            }
        }
    }
}

async function guildInformationEmbed(interaction){
    let guildData;
    try {
        [guildData] = await SqlDB.query(
            `SELECT * FROM guild_info WHERE guild_id = ?`,
            [interaction.guild.id]
        );
    } catch (error) {
        await interaction.reply({
            content: "An error occurred! Please try again later!",
            flags: discord.MessageFlags.Ephemeral
        });
        console.error(error);
        return new discord.EmbedBuilder()
            .setColor([187, 33, 36])
            .setTitle("Error")
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.");
    }
    const fsaUnixTime = Math.floor(
        new Date(guildData[0].first_setup_at).getTime() / 1000
    );
    const fsaText = `<t:${fsaUnixTime}:R>`;

    const peaUnixTime = Math.floor(
        new Date(guildData[0].premium_expires_at).getTime() / 1000
    );
    const peaText = `<t:${peaUnixTime}:R>`;
    return new discord.EmbedBuilder()
            .setColor([76, 175, 80])
            .setTitle("Guild Information")
            .setDescription("Your server has been set up, here’s the server information recorded in the bot")
            .addFields(
                {
                    name: "Server name:",
                    value: `${guildData[0].guild_name}`,
                    inline: true
                },
                {
                    name: "Owner:",
                    value: `<@${guildData[0].owner_id}>`,
                    inline: true
                },
                {
                    name: "Bot Moderator role:",
                    value: `${guildData[0].admin_role ? `<@&${guildData[0].admin_role}>` : `No Mod`}`
                },
                {
                    name: "First setup:",
                    value: fsaText,
                    inline: true
                },
                {
                    name: "Bot log channel:",
                    value: `${guildData[0].log_channel_id ? `<#${guildData[0].log_channel_id}>` : "Default at System Log"}`,
                    inline: true
                },
                {
                    name: "",
                    value: ``
                },
                {
                    name: "Premium:",
                    value: `${guildData[0].is_premium ? "True" : "False"}`,
                    inline: true
                },
                {
                    name: "Premium end:",
                    value: `${guildData[0].premium_expires_at ? peaText : "-"}`,
                    inline: true
                }
            )
}
async function setupComponents(){
    const dropdown = new discord.StringSelectMenuBuilder()
    .setCustomId('pick_setup_menu')
    .setPlaceholder('Choose one of the menu options...')
    .addOptions([
        {
            label: 'Set mods',
            description: 'Adding a moderator role for this bot! Can only have 1 moderator role',
            value: 'set_mods',
            emoji: '👮🏻'
        },
        {
            label: 'Set bot log Ch',
            description: 'Make a channel for bot logs',
            value: 'set_bot_log_ch',
            emoji: '📪'
        }
    ]);
    return new discord.ActionRowBuilder().addComponents(dropdown);
}