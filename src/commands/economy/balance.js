
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

const config =
    require("../../config");

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 💰 BALANCE COMMAND
// ==========================================

module.exports = {
    name: "balance",

    aliases: [
        "bal",
        "money",
        "cash"
    ],

    description:
        "Xem số dư Mora.",

    usage:
        "Vbalance",

    async execute(message) {

        const user =
            User.getOrCreate(
                message.author.id
            );

        const balance =
            Number(
                user.balance || 0
            );

        const bank =
            Number(
                user.bank || 0
            );

        const total =
            balance + bank;

        // ======================================
        // 📊 EMBED
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    config.colors.primary
                )

                .setAuthor({
                    name:
                        `${message.author.username} • Wallet`,
                    iconURL:
                        message.author
                            .displayAvatarURL()
                })

                .setDescription(
                    [
                        "**MORA WALLET**",
                        "",
                        "> `💰` **Tiền mặt**",
                        `> \`+\` **${money(balance)} Mora**`,
                        "",
                        "> `🏦` **Ngân hàng**",
                        `> \`+\` **${money(bank)} Mora**`,
                        "",
                        "────────────────────",
                        "",
                        "> `💎` **Tổng tài sản**",
                        `> \`+\` **${money(total)} Mora**`
                    ].join("\n")
                )

                .setFooter({
                    text:
                        "Venti • Wandering Bard of Mondstadt"
                })

                .setTimestamp();

        // ======================================
        // 🔘 BUTTONS
        // ======================================

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            "profile_refresh"
                        )
                        .setLabel(
                            "Làm mới"
                        )
                        .setEmoji(
                            "🔃"
                        )
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            "profile_shop"
                        )
                        .setLabel(
                            "Shop"
                        )
                        .setEmoji(
                            "🛍️"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                );

        return message.reply({
            embeds: [
                embed
            ],
            components: [
                row
            ]
        });
    }
};

