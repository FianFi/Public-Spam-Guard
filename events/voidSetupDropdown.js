const {Events, MessageFlags, EmbedBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder} = require('discord.js');
const SqlDB = require('../services/connection.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction){ 
        if(!interaction.isStringSelectMenu() && !interaction.isButton() && !interaction.isRoleSelectMenu() && !interaction.isChannelSelectMenu()) return;
        const args = interaction.customId.split("#");
        if(args[0] !== "void")return;
        const idHandling = ["punishment", "enable", "disable"];
        if(!idHandling.includes(args[1]))return;

        let voidEnabled;
        try {
            [voidEnabled] = await SqlDB.query(
                `SELECT void_enabled FROM void_setting WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            await interaction.reply({
                content: "An error occurred! Please try again later!",
                flags: MessageFlags.Ephemeral
            });
            console.error(error);
            return;
        }
        if(interaction.user.id !== interaction.guild.ownerId) return;
        let setupedEmbed;
        let setupedComp;
        let setupedBtn;
        switch(args[1]){
            case "enable":
                try {
                    [updateStatus] = await SqlDB.query(
                        "UPDATE `void_setting` SET `void_enabled`= ?  WHERE `guild_id` = ?",
                        [true, interaction.guild.id]
                    )
                } catch (error) {
                    Logger.error(interaction.guild.id, `[DB] ${error}`);
                    await interaction.reply({
                        content: "An error occurred! Please try again later!",
                        flags: MessageFlags.Ephemeral
                    });
                    console.error(error);
                    return;
                }
                Logger.info(interaction.guild.id, `[VOID_SETUP] Void enabled by ${interaction.user.username} (${interaction.user.id})`);
                setupedEmbed = await embed_alreadySetup(interaction);
                setupedComp = await voidSetupComponents(interaction);
                setupedBtn = await voidSetupButton(interaction);
                await interaction.update({
                    embeds: [setupedEmbed],
                    components: [setupedComp, setupedBtn.disableButton],
                    flags: MessageFlags.Ephemeral
                });
            break;
            case "disable":
                try {
                    [updateStatus] = await SqlDB.query(
                        "UPDATE `void_setting` SET `void_enabled`= ?  WHERE `guild_id` = ?",
                        [false, interaction.guild.id]
                    )
                } catch (error) {
                    Logger.error(interaction.guild.id, `[DB] ${error}`);
                    await interaction.reply({
                        content: "An error occurred! Please try again later!",
                        flags: MessageFlags.Ephemeral
                    });
                    console.error(error);
                    return;
                }
                Logger.info(interaction.guild.id, `[VOID_SETUP] Void disabled by ${interaction.user.username} (${interaction.user.id})`);
                setupedEmbed = await embed_alreadySetup(interaction);
                setupedComp = await voidSetupComponents(interaction);
                setupedBtn = await voidSetupButton(interaction);
                await interaction.update({
                    embeds: [setupedEmbed],
                    components: [setupedComp, setupedBtn.enableButton],
                    flags: MessageFlags.Ephemeral
                });
            break;
            case "punishment":
                switch(interaction.values[0]){
                    case "kick":
                        try {
                            [updateStatus] = await SqlDB.query(
                                "UPDATE `void_setting` SET `void_punishment`= ?  WHERE `guild_id` = ?",
                                ["kick", interaction.guild.id]
                            )
                        } catch (error) {
                            Logger.error(interaction.guild.id, `[DB] ${error}`);
                            await interaction.reply({
                                content: "An error occurred! Please try again later!",
                                flags: MessageFlags.Ephemeral
                            });
                            console.error(error);
                            return;
                        }
                        Logger.info(interaction.guild.id, `[VOID_SETUP] Void punishment set to "KICK" by ${interaction.user.username} (${interaction.user.id})`);
                    break;
                    case "ban":
                        try {
                            [updateStatus] = await SqlDB.query(
                                "UPDATE `void_setting` SET `void_punishment`= ?  WHERE `guild_id` = ?",
                                ["ban", interaction.guild.id]
                            )
                        } catch (error) {
                            Logger.error(interaction.guild.id, `[DB] ${error}`);
                            await interaction.reply({
                                content: "An error occurred! Please try again later!",
                                flags: MessageFlags.Ephemeral
                            });
                            console.error(error);
                            return;
                        }
                        Logger.info(interaction.guild.id, `[VOID_SETUP] Void punishment set to "BAN" by ${interaction.user.username} (${interaction.user.id})`);
                    break;
                    case "timeout":
                        try {
                            [updateStatus] = await SqlDB.query(
                                "UPDATE `void_setting` SET `void_punishment`= ?  WHERE `guild_id` = ?",
                                ["timeout", interaction.guild.id]
                            )
                        } catch (error) {
                            Logger.error(interaction.guild.id, `[DB] ${error}`);
                            await interaction.reply({
                                content: "An error occurred! Please try again later!",
                                flags: MessageFlags.Ephemeral
                            });
                            console.error(error);
                            return;
                        }
                        Logger.info(interaction.guild.id, `[VOID_SETUP] Void punishment set to "TIMEOUT" by ${interaction.user.username} (${interaction.user.id})`);
                    break;
                }
                setupedEmbed = await embed_alreadySetup(interaction);
                await interaction.update({
                    embeds: [setupedEmbed],
                    flags: MessageFlags.Ephemeral
                });
            break;
        }
    }
}
async function voidSetupComponents(){
    const dropdown = new StringSelectMenuBuilder()
    .setCustomId('void#punishment')
    .setPlaceholder('Choose the void punishment')
    .addOptions([
        {
            label: 'Kick',
            description: 'Kick the spammer out of this channel',
            value: 'kick'
        },
        {
            label: 'Timeout',
            description: 'Time out the spammer for a day',
            value: 'timeout'
        },
        {
            label: 'Ban',
            description: 'Kick and ban spammer from this channel',
            value: 'ban'
        }
    ]);
    return new ActionRowBuilder().addComponents(dropdown);
}
async function voidSetupButton(){
    return {
        enableButton: new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("void#enable")
                .setLabel("Enable")
                .setStyle(ButtonStyle.Primary)
        ),
        disableButton: new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("void#disable")
                .setLabel("Disable")
                .setStyle(ButtonStyle.Danger)
        )
    }
}
async function embed_alreadySetup(interaction){
    let voidData;
    try {
        [voidData] = await SqlDB.query(
            `SELECT
            void_channel_id,
            void_enabled,
            void_punishment
            FROM void_setting WHERE guild_id = ?`,
            [interaction.guild.id]
        );
    } catch (error) {
        Logger.error(interaction.guild.id, `[DB] ${error}`);
        console.error("An error occured in embed function: ",error);
        return new EmbedBuilder()
            .setColor(embedColor.alert)
            .setTitle("Error")
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.")
            .setFooter({text:"FianBot | FiStuff"})
    }
    return new EmbedBuilder()
        .setColor(embedColor.success)
        .setTitle("Void Information")
        .addFields(
            {
                name: "Void Channel:",
                value: `<#${voidData[0].void_channel_id}>`
            },
            {
                name: "Void Enabled:",
                value: `${voidData[0].void_enabled ? "True" : "False"}`,
                inline: true
            },
            {
                name: "Void Punishment",
                value: `${voidData[0].void_punishment}`,
                inline: true
            }
        )
        .setFooter({text:"FianBot | FiStuff"})
}