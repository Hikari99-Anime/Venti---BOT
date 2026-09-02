
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
        "Xem bảng xếp hạng Mora.",

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
                            "#f2a7a7"
                        )

                        .setDescription(
                            "● `🍃` **Chưa có dữ liệu leaderboard.**"
                        )
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
                discordUser?.username ||
                "Unknown Traveler";

            const balance =
                Number(
                    user.balance || 0
                );

            // =================================
            // 🏅 RANK SYMBOL
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

                `● ${rank} **${name}**\n` +

                `> \`💰\` +${balance.toLocaleString(
                    "vi-VN"
                )} Mora`
            );
        }

        // =====================================
        // 🏆 EMBED
        // =====================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8FD3FF"
                )

                .setTitle(
                    "`🏆` Mora Leaderboard"
                )

                .setDescription(
                    [
                        "● `🍃` **Top 10 người chơi giàu nhất**",
                        "",
                        lines.join(
                            "\n\n"
                        )
                    ].join("\n")
                )

                .setFooter({
                    text:
                        "Venti • May the wind guide your fortune."
                })

                .setTimestamp();

        return message.reply({

            embeds: [
                embed
            ]

        });
    }
};

