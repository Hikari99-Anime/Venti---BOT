
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 🎲 TÀI XỈU
// ==========================================

module.exports = {
    name: "taixiu",

    aliases: [
        "tx",
        "taixiu",
        "taixiu"
    ],

    description:
        "Chơi Tài Xỉu với Venti.",

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

        const bet =
            Math.max(
                1,
                parseInt(
                    args[0],
                    10
                ) || 100
            );

        if (
            user.balance < bet
        ) {
            return message.reply(
                `> ❌ Bạn không đủ Mora.\n` +
                `> 💰 Cần: \`${bet.toLocaleString()}\` Mora\n` +
                `> 💵 Có: \`${Number(user.balance || 0).toLocaleString()}\` Mora`
            );
        }

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            `tx_tai_${userId}`
                        )
                        .setLabel(
                            "Tài"
                        )
                        .setEmoji(
                            "🔴"
                        )
                        .setStyle(
                            ButtonStyle.Danger
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `tx_xiu_${userId}`
                        )
                        .setLabel(
                            "Xỉu"
                        )
                        .setEmoji(
                            "🔵"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                );

        const embed =
            new EmbedBuilder()
                .setColor(
                    "#E67E22"
                )
                .setTitle(
                    "🎲 Tài Xỉu"
                )
                .setDescription(
                    `> 💰 Cược: \`${bet.toLocaleString()} Mora\`\n\n` +
                    "> 🔴 **Tài** — Tổng từ **11 → 17**\n" +
                    "> 🔵 **Xỉu** — Tổng từ **4 → 10**\n\n" +
                    "────────────────────\n" +
                    "> 🎯 Chọn cửa bạn muốn đặt cược."
                )
                .setFooter({
                    text:
                        "🍃 Venti • Tài Xỉu"
                });

        const msg =
            await message.reply({
                embeds: [embed],
                components: [row]
            });

        const collector =
            msg.createMessageComponentCollector({
                time:
                    30000
            });

        collector.on(
            "collect",
            async interaction => {

                if (
                    interaction.user.id !==
                    userId
                ) {
                    return interaction.reply({
                        content:
                            "❌ Đây không phải ván Tài Xỉu của bạn.",
                        ephemeral:
                            true
                    });
                }

                const choice =
                    interaction.customId.split(
                        "_"
                    )[1];

                // ==========================
                // 💰 TRỪ TIỀN
                // ==========================

                const currentUser =
                    User.getOrCreate(
                        userId
                    );

                if (
                    currentUser.balance <
                    bet
                ) {
                    collector.stop();

                    return interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    "#ED4245"
                                )
                                .setTitle(
                                    "❌ Không đủ Mora"
                                )
                                .setDescription(
                                    "> Bạn không còn đủ tiền để chơi."
                                )
                        ],
                        components: []
                    });
                }

                User.removeBalance(
                    userId,
                    bet
                );

                // ==========================
                // 🎲 RANDOM DICE
                // ==========================

                const dice1 =
                    Math.floor(
                        Math.random() * 6
                    ) + 1;

                const dice2 =
                    Math.floor(
                        Math.random() * 6
                    ) + 1;

                const dice3 =
                    Math.floor(
                        Math.random() * 6
                    ) + 1;

                const total =
                    dice1 +
                    dice2 +
                    dice3;

                // ==========================
                // 🎯 KẾT QUẢ
                // ==========================

                let result;

                if (
                    total >= 11
                ) {
                    result =
                        "tai";
                } else {
                    result =
                        "xiu";
                }

                const win =
                    choice ===
                    result;

                // ==========================
                // 📊 STATS
                // ==========================

                const latestUser =
                    User.getOrCreate(
                        userId
                    );

                const stats = {
                    ...(latestUser.stats || {})
                };

                stats.games =
                    Number(
                        stats.games || 0
                    ) + 1;

                if (
                    win
                ) {
                    stats.wins =
                        Number(
                            stats.wins || 0
                        ) + 1;
                } else {
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

                // ==========================
                // 💵 THƯỞNG
                // ==========================

                let reward = 0;

                if (
                    win
                ) {
                    reward =
                        bet * 2;

                    User.addBalance(
                        userId,
                        reward
                    );
                }

                collector.stop();

                // ==========================
                // 🎨 EMBED
                // ==========================

                const resultName =
                    result ===
                    "tai"
                        ? "🔴 TÀI"
                        : "🔵 XỈU";

                const choiceName =
                    choice ===
                    "tai"
                        ? "🔴 Tài"
                        : "🔵 Xỉu";

                const resultEmbed =
                    new EmbedBuilder()
                        .setColor(
                            win
                                ? "#57F287"
                                : "#ED4245"
                        )
                        .setTitle(
                            win
                                ? "🎉 Tài Xỉu • Thắng!"
                                : "💀 Tài Xỉu • Thua!"
                        )
                        .setDescription(
                            `> 🎲 Xúc xắc: \`${dice1}\` • \`${dice2}\` • \`${dice3}\`\n` +
                            `> 🔢 Tổng: **\`${total}\`**\n\n` +

                            `> 👤 Bạn chọn: ${choiceName}\n` +
                            `> 🎯 Kết quả: ${resultName}\n\n` +

                            "────────────────────\n" +

                            (
                                win
                                    ? `> 💰 Cược: \`${bet.toLocaleString()} Mora\`\n` +
                                      `> 💵 Nhận: **+${reward.toLocaleString()} Mora**`
                                    : `> 💸 Mất: \`${bet.toLocaleString()} Mora\``
                            )
                        )
                        .setFooter({
                            text:
                                "🍃 Venti • Tài Xỉu"
                        })
                        .setTimestamp();

                return interaction.update({
                    embeds: [
                        resultEmbed
                    ],
                    components: []
                });
            }
        );

        collector.on(
            "end",
            async () => {
                try {
                    if (
                        !collector.ended
                    ) {
                        return;
                    }

                    await msg.edit({
                        components: []
                    });
                } catch {}
            }
        );
    }
};

