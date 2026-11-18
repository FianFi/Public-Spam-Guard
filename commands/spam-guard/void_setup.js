const {SlashCommandBuilder, MessageFlags, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, ButtonBuilder} = require('discord.js');
const {modCheck} = require('./utils/modChecker.js')
const SqlDB = require('../../services/connection.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("void_setup")
        .setDescription("Set up a black hole channel for this bot."),
    async execute(interaction) {
        let guildData;
        try {
            [guildData] = await SqlDB.query(
                `SELECT * FROM guild_info WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            await interaction.reply({
                content: "An error occurred! Please try again later!",
                flags: MessageFlags.Ephemeral
            });
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
            return;
        }
        if(!guildData[0]){
            await interaction.reply({
                content: "This server hasn't been set up for the spam guard feature yet, please contact the server owner to set up this feature.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        const isMod = await modCheck(interaction);
        if(interaction.user.id !== guildData[0].owner_id && !isMod){
            await interaction.reply({
                content: "Only the server owner and admins can use this command.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        let voidData;
        try {
            [voidData] = await SqlDB.query(
                `SELECT * FROM void_setting WHERE guild_id = ?`,
                [interaction.guild.id]
            );
        } catch (error) {
            await interaction.reply({
                content: "An error occurred! Please try again later!",
                flags: MessageFlags.Ephemeral
            });
            Logger.error(interaction.guild.id, `[DB] ${error}`);
            console.error(error);
            return;
        }
        const voidChannel = interaction.guild.channels.cache.find(
            c => c.name === 'void'
        );
        if(!voidData[0] || !voidChannel){
            await interaction.reply({
                content: "Hold on a sec, setting up automatically...",
                flags: MessageFlags.Ephemeral
            });
            if(voidChannel){
                await voidChannel.delete();
            }
            const setupRes = await channelSetup(interaction);
            try {
                await SqlDB.query(
                    "INSERT INTO `void_setting`(`guild_id`, `void_channel_id`, `void_msg_id`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE void_channel_id = VALUES(void_channel_id), void_msg_id = VALUES(void_msg_id)",
                    [interaction.guild.id, setupRes.voidId, setupRes.voidMsgId]
                );
            } catch (error) {
                await interaction.editReply({
                    content: "An error occurred! Please try again later!",
                    flags: MessageFlags.Ephemeral
                });
                Logger.error(interaction.guild.id, `[DB] ${error}`);
                console.error(error);
                return;
            }
            Logger.info(interaction.guild.id, `[VOID_SETUP] A void channel setuped by ${interaction.user.username}(${interaction.user.id})`);
            await interaction.editReply({
                content: "Automatic setup complete! Make sure the void is at the top of this server channel!\nThen, make sure to set this bot's role above all roles in this server (regular Members) so that the bot can work properly.\n\n",
                flags: MessageFlags.Ephemeral
            });
            return;
        }else{
            const setupedEmbed = await embed_alreadySetup(interaction);
            const setupedComp = await voidSetupComponents(interaction);
            const setupedBtn = await voidSetupButton(interaction);
            await interaction.reply({
                embeds: [setupedEmbed],
                components: voidData[0].void_enabled ? [setupedComp, setupedBtn.disableButton] : [setupedComp, setupedBtn.enableButton],
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

async function channelSetup(interaction){
    const voidCh = await interaction.guild.channels.create({
        name: "void",
        type: ChannelType.GuildText
    });
    const voidMsg = await voidCh.send({
        embeds: [await embed_voidChMessage(interaction)],
    });
    return{
        voidId: voidCh.id,
        voidMsgId: voidMsg.id
    };
}
async function embed_alreadySetup(interaction){
    let voidData;
    try {
        [voidData] = await SqlDB.query(
            `SELECT * FROM void_setting WHERE guild_id = ?`,
            [interaction.guild.id]
        );
    } catch (error) {
        console.error("An error occured in embed function: ",error);
        Logger.error(interaction.guild.id, `[DB] ${error}`);
        return new EmbedBuilder()
            .setColor([187, 33, 36])
            .setTitle("Error")
            .setDescription("An error occurred! Please try again later!\nOr send a report if you think this is a system error.")
            .setFooter({text:"FianBot | FiStuff"})
    }
    return new EmbedBuilder()
            .setColor([76, 175, 80])
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
async function embed_voidChMessage(){
    return new EmbedBuilder()
        .setColor([76, 175, 80])
        .setTitle("Void Channel!")
        .addFields(
            {
            name: "",
            value: `Everyone who sends a message in this channel will be automatically banned by this bot!\nDon't send any messages in this channel!`
            },
            {
                name: "Kicks count: ",
                value: "0"
            }
        )
        .setFooter({text:"FianBot | FiStuff"})
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