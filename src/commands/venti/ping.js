
const {
    EmbedBuilder
} = require("discord.js");

const config =
    require("../../config");

// ==========================================
// 🏓 PING
// ==========================================

module.exports = {
    name: "ping",

    aliases: [
        "pong",
        "vping",
        "latency"
    ],

    description:
        "Kiểm tra độ trễ của Columbina.",

    usage:
        "Vping",

    category:
        "venti",

    async execute(message) {

        const sent =
            await message.reply({
                content:
                    "🍃 Đang đo cơn gió..."
            });

        const roundtrip =
            sent.createdTimestamp -
            message.createdTimestamp;

        const apiLatency =
            Math.round(
                message.client.ws.ping
            );

        const embed =
            new EmbedBuilder()

                .setColor(
                    config.colors.primary
                )

                .setTitle(
                    "🏓 Pong!"
                )

                .setDescription(
                    [
                        "● `📡` **Độ trễ tin nhắn**",
                        `> \`${roundtrip}ms\``,
                        "",
                        "● `💓` **Độ trễ API**",
                        `> \`${apiLatency}ms\``
                    ].join("\n")
                )

                .setFooter({
                    text:
                        "🍃 Columbina • May the wind be swift."
                })

                .setTimestamp();

        return sent.edit({
            content:
                null,
            embeds: [
                embed
            ]
        });
    }
};
