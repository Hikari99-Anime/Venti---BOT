const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("../../config");

async function execute(interaction) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: `${interaction.user.username} • Inventory`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setDescription(
            "🎒 **Your Inventory**\n" +
            "Your collection is currently waiting for new adventures."
        )
        .addFields({
            name: "🎒 Items",
            value: "`Your inventory is empty.`",
            inline: false
        })
        .setFooter({
            text: "Venti • Wandering Bard of Mondstadt"
        })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("inventory_shop")
            .setLabel("Shop")
            .setEmoji("🛍️")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("inventory_back")
            .setLabel("Profile")
            .setEmoji("👤")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("inventory_close")
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
