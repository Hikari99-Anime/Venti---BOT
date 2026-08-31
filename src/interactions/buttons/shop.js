const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("../../config");

const ITEMS = [
    {
        id: "apple",
        name: "Sweet Apple",
        emoji: "🍎",
        price: 500,
        description: "A fresh apple from Mondstadt."
    },
    {
        id: "charm",
        name: "Lucky Charm",
        emoji: "🍀",
        price: 2500,
        description: "A tiny charm said to attract fortune."
    },
    {
        id: "lyre",
        name: "Anemo Lyre",
        emoji: "🎵",
        price: 10000,
        description: "A lyre carrying the gentle breeze."
    }
];

async function execute(interaction) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: "Venti • Shop",
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setDescription(
            "🛍️ **Welcome to Venti's Shop**\n" +
            "Spend your Mora on items carried by the wind."
        )
        .addFields(
            ...ITEMS.map(item => ({
                name: `${item.emoji} ${item.name}`,
                value:
                    `${item.description}\n` +
                    `💰 \`${item.price.toLocaleString()} Mora\``,
                inline: false
            }))
        )
        .setFooter({
            text: "Venti • Wandering Bard of Mondstadt"
        })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        ...ITEMS.map(item =>
            new ButtonBuilder()
                .setCustomId(`shop_buy_${item.id}`)
                .setLabel(`Buy ${item.name}`)
                .setEmoji(item.emoji)
                .setStyle(ButtonStyle.Primary)
        )
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("shop_profile")
            .setLabel("Profile")
            .setEmoji("👤")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("shop_inventory")
            .setLabel("Inventory")
            .setEmoji("🎒")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("shop_close")
            .setLabel("Close")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
    );

    return interaction.update({
        embeds: [embed],
        components: [row, row2]
    });
}

module.exports = {
    execute
};
