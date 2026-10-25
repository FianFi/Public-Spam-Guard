const config = require('../config.json')
const discord = require('discord.js');
const SqlDB = require('../services/connection.js');

module.exports = {
    name: discord.Events.InteractionCreate,
    async execute(interaction){ 
        if(!interaction.isStringSelectMenu() && !interaction.isButton() && !interaction.isRoleSelectMenu() && !interaction.isChannelSelectMenu()) return;
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
        if(interaction.user.id !== interaction.guild.ownerId) return;
        console.log(interaction.customId); 
        if(interaction.customId === "pick_setup_menu"){
            console.log(interaction.values[0]); 
            switch(interaction.values[0]){
                case "set_mods":
                    const smEmbed = await setModEmbed(interaction);
                    await interaction.update({
                        content: "",
                        embeds: [smEmbed],
                        components: smEmbed.data.title === "Error" ?
                        [] : 
                        [await roleDropdown(), await saveButton()]
                    });
                break;
                case "set_bot_log_ch":
                    const slEmbed = await setLogChEmbed(interaction);
                    await interaction.update({
                        content: "",
                        embeds: [slEmbed],
                        components: slEmbed.data.title === "Error" ?
                        [] : 
                        [await channelDropdown(), await saveButton()]
                    });
                break;
            }
        }else if(interaction.customId === "back_setup"){
            const giEmbed = await guildInformationEmbed(interaction);
            await interaction.update({
                embeds: [giEmbed],
                components: 
                    giEmbed.data.title === "Error" ?
                    [] :
                    [await setupComponents()],
                flags: discord.MessageFlags.Ephemeral
            });
            console.log(giEmbed.data.title);
        }else if(interaction.customId === "set_mod_role_dropdown"){
            let updateStatus;
            try {
                [updateStatus] = await SqlDB.query(
                    "UPDATE `guild_info` SET `admin_role`= ?  WHERE `guild_id` = ?",
                    [interaction.values[0], interaction.guild.id]
                )
            } catch (error) {
                console.error("Error occurred while updating table:",error)
                await interaction.reply({
                    content: "An error occurred! Please try again later!",
                    flags: discord.MessageFlags.Ephemeral
                });
                return;
            }
            const smEmbed = await setModEmbed(interaction);
            await interaction.update({
                content: "",
                embeds: [smEmbed],
                components: smEmbed.data.title === "Error" ?
                [] : 
                [await roleDropdown(), await saveButton()]
            });
        }else if(interaction.customId === "set_bot_log_dropdown"){
            let updateStatus;
            try {
                [updateStatus] = await SqlDB.query(
                    "UPDATE `guild_info` SET `log_channel_id`= ?  WHERE `guild_id` = ?",
                    [interaction.values[0], interaction.guild.id]
                )
            } catch (error) {
                console.error("Error occurred while updating table:",error)
                await interaction.reply({
                    content: "An error occurred! Please try again later!",
                    flags: discord.MessageFlags.Ephemeral
                });
                return;
            }
            const slEmbed = await setLogChEmbed(interaction);
            await interaction.update({
                content: "",
                embeds: [slEmbed],
                components: slEmbed.data.title === "Error" ?
                [] : 
                [await channelDropdown(), await saveButton()]
            });
        }
    }
}

async function setModEmbed(interaction){
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
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.")
    }
    return new discord.EmbedBuilder()
        .setColor([76, 175, 80])
        .setTitle("Set Moderator")
        .setDescription("Choose a role to make a moderator")
        .addFields(
            {
                name: "Moderator:",
                value: `${guildData[0].admin_role ? `<@&${guildData[0].admin_role}>` : `No Mod`}`
            }
        )
}
async function setLogChEmbed(interaction){
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
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.")
    }
    return new discord.EmbedBuilder()
        .setColor([76, 175, 80])
        .setTitle("Set Bot Log Channel")
        .setDescription("Choose a channel to make a bot log channel")
        .addFields(
            {
                name: "Bot log channel:",
                value: `${guildData[0].log_channel_id ? `<#${guildData[0].log_channel_id}>` : "Default at System Log"}`
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
async function saveButton(){
    return new discord.ActionRowBuilder().addComponents(
        new discord.ButtonBuilder()
            .setCustomId("back_setup")
            .setLabel("<- Back")
            .setStyle(discord.ButtonStyle.Danger)
    ); 
}
async function roleDropdown(){
    const roleDropdown = new discord.RoleSelectMenuBuilder()
        .setCustomId('set_mod_role_dropdown')
        .setPlaceholder('Choose the moderator role...')
        .setMinValues(1)
        .setMaxValues(1);

    return new discord.ActionRowBuilder().addComponents(roleDropdown);
}
async function channelDropdown(){
    const channelDropdown = new discord.ChannelSelectMenuBuilder()
    .setCustomId('set_bot_log_dropdown')
    .setPlaceholder('Choose the bot log channel...')
    .setChannelTypes(discord.ChannelType.GuildText)
    .setMinValues(1)
    .setMaxValues(1);

    return new discord.ActionRowBuilder().addComponents(channelDropdown);
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
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.")
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