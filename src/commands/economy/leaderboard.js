
const database =
    require("../../database/database");

const {
    EmbedBuilder
} = require("discord.js");

module.exports = {

    name:
        "leaderboard",

    aliases: [
        "lb",
        "top"
    ],

    description:
        "Xem bảng xếp hạng người chơi.",

    async execute(message) {

        const users =
            database
                .getAllUsers()
                .sort(
                    (a, b) =>
                        Number(
                            b.balance || 0
                        ) -
                        Number(
                            a.balance || 0
                        )
                )
                .slice(0, 10);

        // =====================================
        // ❌ NO DATA
        // =====================================

        if (!users.length) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#A8DCC0"
                        )

                        .setAuthor({
                            name:
                                `☁️ ${message.author.globalName || message.author.username} · Columbina`,
                            iconURL:
                                message.author.displayAvatarURL({
                                    extension: "png",
                                    size: 128
                                })
                        })

                        .setTitle(
                            "🍃 Mora Leaderboard"
                        )

                        .setDescription(
                            "☁️ `🍃` **Chưa có dữ liệu leaderboard.**"
                        )

                        .setFooter({
                            text:
                                "☁️ Columbina • Cozy Corner 🍃"
                        })

                        .setTimestamp()
                ]
            });
        }

        // =====================================
        // 🏆 BUILD RANKING
        // =====================================

        const lines = [];

        for (
            let i = 0;
            i < users.length;
            i++
        ) {

            const user =
                users[i];

            const discordUser =
                await message.client.users
                    .fetch(
                        user.id
                    )
                    .catch(
                        () => null
                    );

            const name =
                discordUser?.globalName ||
                discordUser?.username ||
                "Unknown Traveler";

            const balance =
                Number(
                    user.balance || 0
                );

            const level =
                Number(
                    user.level || 1
                );

            const streak =
                Number(
                    user.dailyStreak || 0
                );

            // =================================
            // 🏅 RANK
            // =================================

            let rank;

            if (i === 0) {

                rank =
                    "`🥇`";

            } else if (i === 1) {

                rank =
                    "`🥈`";

            } else if (i === 2) {

                rank =
                    "`🥉`";

            } else {

                rank =
                    `\`${i + 1}.\``;
            }

            // =================================
            // 👤 PLAYER
            // =================================

            lines.push(

                `${rank} **${name}**\n` +

                `> \`💰\` Mora      : **${balance.toLocaleString("vi-VN")}**\n` +

                `> \`⭐\` Level     : **${level}**\n` +

                `> \`🔥\` Daily     : **${streak} ngày**`
            );
        }

        // =====================================
        // 🏆 EMBED
        // =====================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#A8DCC0"
                )

                .setAuthor({
                    name:
                        `☁️ ${message.author.globalName || message.author.username} · Columbina`,
                    iconURL:
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 128
                        })
                })

                .setTitle(
                    "🍃 Mora Leaderboard"
                )

                .setDescription(
                    [
                        "☁️ `🍃` **Bảng xếp hạng hành trình**",
                        "",
                        "- `🏆` **Top 10 người chơi**",
                        "",
                        lines.join(
                            "\n\n"
                        ),
                        "",
                        "☕ `🍃` **Chúc mọi người có một hành trình thật chill**"
                    ].join("\n")
                )

                .setFooter({
                    text:
                        "☁️ Columbina • Cozy Corner 🍃"
                })

                .setTimestamp();

        return message.reply({

            embeds: [
                embed
            ]

        });
    }
};
