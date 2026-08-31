const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User = require("../../database/models/User");
const config = require("../../config");

module.exports = {
    name: "balance",
    aliases: ["bal", "money", "cash"],
    description: "Xem số dư Mora.",

    async execute(message) {
        const user = User.getOrCreate(message.author.id);

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({
                name: `${message.author.username} • Wallet`,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(
                "🍃 **Your Mora**\n" +
                "The gentle wind has carried your fortune here."
            )
            .addFields(
                {
                    name: "💰 Wallet",
                    value: `\`${user.balance.toLocaleString()} Mora\``,
                    inline: true
                },
                {
                    name: "🏦 Bank",
                    value: `\`${user.bank.toLocaleString()} Mora\``,
                    inline: true
                }
            )
            .setFooter({
                text: "Venti • Wandering Bard of Mondstadt"
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("profile_refresh")
                .setLabel("Refresh")
                .setEmoji("🍃")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("profile_shop")
                .setLabel("Shop")
                .setEmoji("🛍️")
                .setStyle(ButtonStyle.Primary)
        );

        return message.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
