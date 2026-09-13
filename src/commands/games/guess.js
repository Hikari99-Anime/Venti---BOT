
const {
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 📊 UPDATE GAME STATS
// ==========================================

function recordGame(
    userId,
    result
) {
    const user =
        User.getOrCreate(
            userId
        );

    const stats = {
        ...(user.stats || {})
    };

    stats.games =
        Number(
            stats.games || 0
        ) + 1;

    if (
        result === "win"
    ) {
        stats.wins =
            Number(
                stats.wins || 0
            ) + 1;
    }

    if (
        result === "lose"
    ) {
        stats.losses =
            Number(
                stats.losses || 0
            ) + 1;
    }

    User.update(
        userId,
        {
            stats
        }
    );
}

// ==========================================
// 🎨 GAME EMBED
// ==========================================

function createGameEmbed(
    message,
    bet,
    attempts,
    count = 0,
    hint = null
) {
    const remaining =
        attempts - count;

    const description = [
        "**GUESS THE NUMBER**",
        "",
        "- `🎯` **Phạm vi**",
        "> **1 → 100**",
        "",
        "- `💰` **Tiền cược**",
        `> **${money(bet)} Mora**`,
        "",
        "- `❤️` **Lượt đoán**",
        `> **${remaining}** lượt còn lại`
    ];

    if (hint) {
        description.push(
            "",
            "- `💡` **Gợi ý**",
            `> ${hint}`
        );
    }

    description.push(
        "",
        "────────────────────",
        "",
        "> Nhập một số từ **1 đến 100** vào chat."
    );

    return new EmbedBuilder()
        .setColor("#9ccfd8")
        .setAuthor({
            name:
                `${message.author.username} • Guess`,
            iconURL:
                message.author
                    .displayAvatarURL()
        })
        .setDescription(
            description.join("\n")
        )
        .setFooter({
            text:
                "Columbina • Guess The Number"
        })
        .setTimestamp();
}

// ==========================================
// 🏆 RESULT EMBED
// ==========================================

function createResultEmbed(
    message,
    target,
    bet,
    attempts,
    count,
    won,
    reward
) {
    const user =
        User.getOrCreate(
            message.author.id
        );

    const balance =
        Number(
            user.balance || 0
        );

    if (won) {
        return new EmbedBuilder()
            .setColor("#a8d8a8")
            .setAuthor({
                name:
                    `${message.author.username} • Guess`,
                iconURL:
                    message.author
                        .displayAvatarURL()
            })
            .setDescription(
                [
                    "**GUESS THE NUMBER**",
                    "",
                    "- `🎉` **Kết quả: Thắng**",
                    `> 🎯 Số bí mật: **${target}**`,
                    "",
                    "- `💰` **Tiền cược**",
                    `> **${money(bet)} Mora**`,
                    "",
                    "- `❤️` **Lượt đoán**",
                    `> **${count}/${attempts}**`,
                    "",
                    "- `💵` **Tiền nhận**",
                    `> +**${money(reward)} Mora**`,
                    "",
                    "- `💳` **Số dư**",
                    `> **${money(balance)} Mora**`
                ].join("\n")
            )
            .setFooter({
                text:
                    "Columbina • Guess The Number"
            })
            .setTimestamp();
    }

    return new EmbedBuilder()
        .setColor("#f2a7a7")
        .setAuthor({
            name:
                `${message.author.username} • Guess`,
            iconURL:
                message.author
                    .displayAvatarURL()
        })
        .setDescription(
            [
                "**GUESS THE NUMBER**",
                "",
                "- `💀` **Kết quả: Thua**",
                `> 🎯 Số bí mật: **${target}**`,
                "",
                "- `💰` **Tiền cược**",
                `> **${money(bet)} Mora**`,
                "",
                "- `❤️` **Lượt đoán**",
                `> **${count}/${attempts}**`,
                "",
                "- `💸` **Tiền mất**",
                `> -**${money(bet)} Mora**`,
                "",
                "- `💳` **Số dư**",
                `> **${money(balance)} Mora**`
            ].join("\n")
        )
        .setFooter({
            text:
                "Columbina • Guess The Number"
        })
        .setTimestamp();
}

// ==========================================
// 🎮 COMMAND
// ==========================================

module.exports = {

    name: "guess",

    aliases: [
        "guessnumber",
        "doanso"
    ],

    description:
        "Đoán số bí mật từ 1 đến 100.",

    usage:
        "Vguess <bet> <attempts>",

    async execute(
        message,
        args
    ) {

        const userId =
            message.author.id;

        const user =
            User.getOrCreate(
                userId
            );

        // ======================================
        // 🎯 SECRET NUMBER
        // ======================================

        const target =
            Math.floor(
                Math.random() * 100
            ) + 1;

        // ======================================
        // 💰 BET
        // ======================================

        const bet =
            Math.max(
                1,
                parseInt(
                    args[0],
                    10
                ) || 100
            );

        if (
            Number(
                user.balance || 0
            ) < bet
        ) {
            return message.reply(
                [
                    "💰 **Không đủ Mora.**",
                    "",
                    `> \`💸\` Cần: **${money(bet)} Mora**`,
                    `> \`💵\` Có: **${money(user.balance)} Mora**`
                ].join("\n")
            );
        }

        // ======================================
        // ❤️ ATTEMPTS
        // ======================================

        const attempts =
            Math.max(
                1,
                parseInt(
                    args[1],
                    10
                ) || 5
            );

        // ======================================
        // 💸 REMOVE BET
        // ======================================

        const removed =
            User.removeBalance(
                userId,
                bet
            );

        if (
            removed === false
        ) {
            return message.reply(
                "❌ Không thể trừ tiền cược."
            );
        }

        // ======================================
        // 📩 INITIAL EMBED
        // ======================================

        const msg =
            await message.reply({
                embeds: [
                    createGameEmbed(
                        message,
                        bet,
                        attempts
                    )
                ]
            });

        // ======================================
        // 🎮 COLLECTOR
        // ======================================

        const filter =
            response =>
                response.author.id ===
                    userId &&
                /^\d+$/.test(
                    response.content
                        .trim()
                );

        const collector =
            message.channel
                .createMessageCollector({
                    filter,
                    time: 60000,
                    max: attempts
                });

        let count = 0;

        // ======================================
        // 🔢 GUESS
        // ======================================

        collector.on(
            "collect",
            async response => {

                count++;

                const guess =
                    Number(
                        response.content
                            .trim()
                    );

                // ==================================
                // ❌ OUT OF RANGE
                // ==================================

                if (
                    guess < 1 ||
                    guess > 100
                ) {
                    count--;

                    return msg.edit({
                        embeds: [
                            createGameEmbed(
                                message,
                                bet,
                                attempts,
                                count,
                                "⚠️ Hãy chọn số từ **1 đến 100**."
                            )
                        ]
                    });
                }

                // ==================================
                // 🎯 CORRECT
                // ==================================

                if (
                    guess === target
                ) {

                    const reward =
                        bet * 4;

                    User.addBalance(
                        userId,
                        reward
                    );

                    recordGame(
                        userId,
                        "win"
                    );

                    collector.stop(
                        "win"
                    );

                    return msg.edit({
                        embeds: [
                            createResultEmbed(
                                message,
                                target,
                                bet,
                                attempts,
                                count,
                                true,
                                reward
                            )
                        ]
                    });
                }

                // ==================================
                // 💡 HINT
                // ==================================

                const hint =
                    guess < target
                        ? "⬆️ **Cao hơn!**"
                        : "⬇️ **Thấp hơn!**";

                // ==================================
                // 🔄 UPDATE SAME EMBED
                // ==================================

                return msg.edit({
                    embeds: [
                        createGameEmbed(
                            message,
                            bet,
                            attempts,
                            count,
                            hint
                        )
                    ]
                });
            }
        );

        // ======================================
        // ⏰ END
        // ======================================

        collector.on(
            "end",
            async (
                _,
                reason
            ) => {

                if (
                    reason === "win"
                ) {
                    return;
                }

                recordGame(
                    userId,
                    "lose"
                );

                try {

                    await msg.edit({
                        embeds: [
                            createResultEmbed(
                                message,
                                target,
                                bet,
                                attempts,
                                count,
                                false,
                                0
                            )
                        ]
                    });

                } catch {}
            }
        );
    }
};
