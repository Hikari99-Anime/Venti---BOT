const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User = require("../../database/models/User");
const Item = require("../../database/models/Item");

const fishCommand =
    require("../../commands/games/fish");

module.exports = async function fishButton(interaction) {
    if (!interaction.isButton()) return;

    const [action, type, ownerId] =
        interaction.customId.split("_");

    if (action !== "fish") return;

    if (ownerId !== interaction.user.id) {
        return interaction.reply({
            content: "🍃 Đây không phải cần câu của bạn.",
            ephemeral: true
        });
    }

    if (type === "inventory") {
        const inventory =
            Item.getInventory(
                interaction.user.id
            );

        if (!inventory.length) {
            return interaction.reply({
                content: "🎒 Túi đồ của bạn đang trống.",
                ephemeral: true
            });
        }

        const description =
            inventory
                .map(item =>
                    `${item.emoji} **${item.name}** ×${item.amount}`
                )
                .join("\n");

        const embed =
            new EmbedBuilder()
                .setColor("#8FD3FF")
                .setAuthor({
                    name: "Venti • Inventory",
                    iconURL:
                        interaction.user.displayAvatarURL()
                })
                .setDescription(
                    `🎒 **Your Items**\n\n${description}`
                );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    if (type === "again") {
        await interaction.deferUpdate();

        const fakeMessage = {
            author: interaction.user,
            reply: options =>
                interaction.editReply(options)
        };

        return fishCommand.execute(
            fakeMessage,
            []
        );
    }
};
