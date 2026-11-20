const { SlashCommandBuilder, MessageFlags, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const SqlDB = require('../../services/connection.js');
const {errorEmbed} = require('./functs/embeds.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Manual void setup."),
    async execute(interaction) {
        if(interaction.user.id !== interaction.guild.ownerId){
            await interaction.reply({
                content: "Only the server owner can set up void!",
                flags: MessageFlags.Ephemeral
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
                embeds: [await errorEmbed()],
                flags: MessageFlags.Ephemeral
            });
            Logger.error(interaction.guild.id, `[DB] ${error}`);
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
                flags: MessageFlags.Ephemeral
            });
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
                Logger.error(interaction.guild.id, `[DB] ${error}`);
                console.error("Error occurred while inserting table:",error)
                await interaction.reply({
                    embeds: [await errorEmbed()],
                    flags: MessageFlags.Ephemeral
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
                Logger.error(interaction.guild.id, `[DB] ${error}`);
                console.error("Error occurred while inserting table:",error)
                await interaction.reply({
                    content: "An error occurred! Please try again later!",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            if(insertStatus.affectedRows === 1){
                Logger.info(interaction.guild.id, `[SERV_SETUP] Server setuped by ${interaction.user.username}(${interaction.user.id})`);
                await interaction.reply({
                    content: "Server setup was successful!\nYou can adjust the moderator role however you like",
                    flags: MessageFlags.Ephemeral
                });
            }else{
                await interaction.reply({
                    content: "An error occurred! Please try again later!\nOr send a report if you think this is a system error.",
                    embeds: [await errorEmbed()],
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
}

async function guildInformationEmbed(interaction){
    let guildData;
    try {
        [guildData] = await SqlDB.query(
            `SELECT guild_name, owner_id, admin_role, first_setup_at, is_premium, premium_expires_at, log_channel_id FROM guild_info WHERE guild_id = ?`,
            [interaction.guild.id]
        );
    } catch (error) {
        Logger.error(interaction.guild.id, `[DB] ${error}`);
        await interaction.reply({
            content: "An error occurred! Please try again later!",
            flags: MessageFlags.Ephemeral
        });
        console.error(error);
        return await errorEmbed();
    }
    const fsaUnixTime = Math.floor(
        new Date(guildData[0].first_setup_at).getTime() / 1000
    );
    const fsaText = `<t:${fsaUnixTime}:R>`;

    const peaUnixTime = Math.floor(
        new Date(guildData[0].premium_expires_at).getTime() / 1000
    );
    const peaText = `<t:${peaUnixTime}:R>`;
    return new EmbedBuilder()
        .setColor(embedColor.success)
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
        .setFooter({text:"FianBot | FiStuff"})
}
async function setupComponents(){
    const dropdown = new StringSelectMenuBuilder()
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
    return new ActionRowBuilder().addComponents(dropdown);
}