const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require("discord.js");

const config = require("../../config");

function createHelp() {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: "Venti • Help",
            iconURL: "https://cdn.discordapp.com/embed/avatars/0.png"
        })
        .setDescription(
            "🍃 **Welcome, traveler!**\n" +
            "Choose a category below and let the wind guide you."
        )
        .addFields(
            {
                name: "💰 Economy",
                value: "`Vbalance` `Vdaily` `Vwork` `Vpay`",
                inline: false
            },
            {
                name: "🎮 Minigames",
                value: "`Vslots` `Vcoinflip` `Vdice` `Vblackjack`",
                inline: false
            },
            {
                name: "🎒 Venti",
                value: "`Vprofile` `Vinventory` `Vshop`",
                inline: false
            }
        )
        .setFooter({
            text: "Venti • Wandering Bard of Mondstadt"
        })
        .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("help_economy")
            .setLabel("Economy")
            .setEmoji("💰")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("help_games")
            .setLabel("Games")
            .setEmoji("🎮")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("help_venti")
            .setLabel("Venti")
            .setEmoji("🍃")
            .setStyle(ButtonStyle.Secondary)
    );

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("help_menu")
            .setPlaceholder("🍃 Choose a category...")
            .addOptions(
                {
                    label: "Economy",
                    description: "Mora, daily, work and payments",
                    value: "economy",
                    emoji: "💰"
                },
                {
                    label: "Minigames",
                    description: "Play games and win Mora",
                    value: "games",
                    emoji: "🎮"
                },
                {
                    label: "Venti",
                    description: "Profile, inventory and shop",
                    value: "venti",
                    emoji: "🍃"
                }
            )
    );

    return {
        embeds: [embed],
        components: [buttons, menu]
    };
}

module.exports = {
    name: "help",
    aliases: ["h", "commands"],
    description: "Xem danh sách lệnh.",

    async execute(message) {
        return message.reply(createHelp());
    }
};
