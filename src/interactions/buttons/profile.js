const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User = require("../../database/models/User");
const config = require("../../config");

async function execute(interaction) {
    const user = User.getOrCreate(interaction.user.id);

    const nextXP = user.level * 500;
    const progress = Math.min(
        10,
        Math.floor((user.xp / nextXP) * 10)
    );

    const bar =
        "▰".repeat(progress) +
        "▱".repeat(10 - progress);

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: `${interaction.user.username} • Profile`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setDescription(
            `🍃 **${interaction.user.username}**\n` +
            `A traveler guided by the gentle wind.`
        )
        .addFields(
            {
                name: "💰 Mora",
                value: `\`${user.balance.toLocaleString()}\``,
                inline: true
            },
            {
                name: "🏦 Bank",
                value: `\`${user.bank.toLocaleString()}\``,
                inline: true
            },
            {
                name: "✨ Level",
                value: `\`${user.level}\``,
                inline: true
            },
            {
                name: "🌟 Experience",
                value: `${bar}\n\`${user.xp} / ${nextXP} XP\``,
                inline: false
            }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({
            text: "Venti • Wandering Bard of Mondstadt"
        })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("profile_inventory")
            .setLabel("Inventory")
            .setEmoji("🎒")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("profile_shop")
            .setLabel("Shop")
            .setEmoji("🛍️")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("profile_refresh")
            .setLabel("Refresh")
            .setEmoji("🍃")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("profile_close")
            .setLabel("Close")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
    );

    return interaction.update({
        embeds: [embed],
        components: [row]
    });
}

module.exports = {
    execute
};
