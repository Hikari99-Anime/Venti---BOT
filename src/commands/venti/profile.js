const User = require("../../database/models/User");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("../../config");

module.exports = {
    name: "profile",
    aliases: ["pf", "me"],
    description: "Xem profile của bạn.",

    async execute(message) {
        const user = User.getOrCreate(
            message.author.id
        );

        const nextXP = user.level * 500;

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({
                name: `${message.author.username} • Profile`,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(
                "🍃 **Your adventure begins with the wind.**"
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
                    name: "🌟 XP",
                    value: `\`${user.xp} / ${nextXP}\``,
                    inline: false
                }
            )
            .setThumbnail(
                message.author.displayAvatarURL()
            )
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

        return message.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
