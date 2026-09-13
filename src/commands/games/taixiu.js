
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
        "taixiu"
    ],

    description:
        "Chơi Tài Xỉu với Columbina.",

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

        // ======================================
        // 💰 CHECK BALANCE
        // ======================================

        if (
            Number(user.balance || 0) <
            bet
        ) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#ED4245")
                        .setTitle(
                            "💸 Không đủ Mora"
                        )
                        .setDescription(
                            `> Bạn cần **${bet.toLocaleString()} Mora** để chơi.\n` +
                            `> 💰 Số dư: **${Number(
                                user.balance || 0
                            ).toLocaleString()} Mora**`
                        )
                        .setFooter({
                            text:
                                "❄️ Columbina • Tài Xỉu"
                        })
                ]
            });
        }

        // ======================================
        // 🔘 BUTTONS
        // ======================================

        function createButtons() {
            return new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            `tx_tai_${userId}`
                        )
                        .setLabel("Tài")
                        .setEmoji("🔴")
                        .setStyle(
                            ButtonStyle.Danger
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `tx_xiu_${userId}`
                        )
                        .setLabel("Xỉu")
                        .setEmoji("🔵")
                        .setStyle(
                            ButtonStyle.Primary
                        )
                );
        }

        // ======================================
        // ⏱️ COUNTDOWN
        // ======================================

        let remaining = 30;

        function createWaitingEmbed() {
            return new EmbedBuilder()
                .setColor("#9B59B6")
                .setAuthor({
                    name:
                        `${message.author.globalName ||
                        message.author.username} • Columbina`,
                    iconURL:
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 128
                        })
                })
                .setTitle(
                    "🎲 Tài Xỉu"
                )
                .setDescription(
                    "❄️ `Columbina` đang chờ lựa chọn của bạn...\n\n" +

                    `> 💰 **Cược:** \`${bet.toLocaleString()} Mora\`\n` +
                    `> ⏳ **Thời gian:** \`${remaining}s\`\n\n` +

                    "🔴 **Tài** — Tổng từ **11 → 17**\n" +
                    "🔵 **Xỉu** — Tổng từ **4 → 10**\n\n" +

                    "────────────────────\n" +
                    "> 🎯 Chọn cửa trước khi hết thời gian."
                )
                .setFooter({
                    text:
                        "❄️ Columbina • Tài Xỉu"
                })
                .setTimestamp();
        }

        // ======================================
        // 📤 SEND GAME
        // ======================================

        const msg =
            await message.reply({
                embeds: [
                    createWaitingEmbed()
                ],
                components: [
                    createButtons()
                ]
            });

        // ======================================
        // 🎮 GAME STATE
        // ======================================

        let finished = false;

        const collector =
            msg.createMessageComponentCollector({
                time: 30000
            });

        // ======================================
        // ⏱️ COUNTDOWN UPDATE
        // ======================================

        const countdown =
            setInterval(
                async () => {

                    if (
                        finished
                    ) {
                        clearInterval(
                            countdown
                        );

                        return;
                    }

                    remaining--;

                    if (
                        remaining <= 0
                    ) {
                        clearInterval(
                            countdown
                        );

                        return;
                    }

                    try {
                        await msg.edit({
                            embeds: [
                                createWaitingEmbed()
                            ],
                            components: [
                                createButtons()
                            ]
                        });
                    } catch {}
                },
                1000
            );

        // ======================================
        // 🎮 COLLECT
        // ======================================

        collector.on(
            "collect",
            async interaction => {

                // ==================================
                // 👤 CHECK PLAYER
                // ==================================

                if (
                    interaction.user.id !==
                    userId
                ) {
                    return interaction.reply({
                        content:
                            "❌ Đây không phải ván Tài Xỉu của bạn.",
                        ephemeral: true
                    });
                }

                if (
                    finished
                ) {
                    return interaction.reply({
                        content:
                            "❌ Ván chơi đã kết thúc.",
                        ephemeral: true
                    });
                }

                // ==================================
                // 🎯 CHOICE
                // ==================================

                const choice =
                    interaction.customId.split(
                        "_"
                    )[1];

                if (
                    choice !== "tai" &&
                    choice !== "xiu"
                ) {
                    return;
                }

                finished = true;

                clearInterval(
                    countdown
                );

                collector.stop(
                    "choice"
                );

                // ==================================
                // 💰 CHECK MONEY AGAIN
                // ==================================

                const currentUser =
                    User.getOrCreate(
                        userId
                    );

                if (
                    Number(
                        currentUser.balance || 0
                    ) < bet
                ) {
                    return interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    "#ED4245"
                                )
                                .setTitle(
                                    "💸 Không đủ Mora"
                                )
                                .setDescription(
                                    "> Bạn không còn đủ Mora để đặt cược."
                                )
                                .setFooter({
                                    text:
                                        "❄️ Columbina • Tài Xỉu"
                                })
                        ],
                        components: []
                    });
                }

                // ==================================
                // 💸 TAKE BET
                // ==================================

                User.removeBalance(
                    userId,
                    bet
                );

                // ==================================
                // 🎲 DICE
                // ==================================

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

                // ==================================
                // 🎯 RESULT
                // ==================================

                const result =
                    total >= 11
                        ? "tai"
                        : "xiu";

                const win =
                    choice === result;

                // ==================================
                // 📊 UPDATE STATS
                // ==================================

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

                // ==================================
                // 💰 REWARD
                // ==================================

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

                // ==================================
                // 🏷️ TEXT
                // ==================================

                const resultName =
                    result === "tai"
                        ? "🔴 **TÀI**"
                        : "🔵 **XỈU**";

                const choiceName =
                    choice === "tai"
                        ? "🔴 **Tài**"
                        : "🔵 **Xỉu**";

                // ==================================
                // 🎨 RESULT EMBED
                // ==================================

                const resultEmbed =
                    new EmbedBuilder()
                        .setColor(
                            win
                                ? "#57F287"
                                : "#ED4245"
                        )
                        .setAuthor({
                            name:
                                `${message.author.globalName ||
                                message.author.username} • Columbina`,
                            iconURL:
                                message.author.displayAvatarURL({
                                    extension: "png",
                                    size: 128
                                })
                        })
                        .setTitle(
                            win
                                ? "🎉 Tài Xỉu • Thắng!"
                                : "💀 Tài Xỉu • Thua!"
                        )
                        .setDescription(
                            "❄️ `Columbina` đã tung xúc xắc...\n\n" +

                            `> 🎲 **Xúc xắc:** \`${dice1}\` • \`${dice2}\` • \`${dice3}\`\n` +
                            `> 🔢 **Tổng:** \`${total}\`\n\n` +

                            `> 👤 **Bạn chọn:** ${choiceName}\n` +
                            `> 🎯 **Kết quả:** ${resultName}\n\n` +

                            "────────────────────\n" +

                            (
                                win
                                    ? `> 💰 **Cược:** \`${bet.toLocaleString()} Mora\`\n` +
                                      `> 💵 **Nhận:** **+${reward.toLocaleString()} Mora**`
                                    : `> 💸 **Mất:** \`${bet.toLocaleString()} Mora\``
                            )
                        )
                        .setFooter({
                            text:
                                "❄️ Columbina • Tài Xỉu"
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

        // ======================================
        // ⏰ TIMEOUT
        // ======================================

        collector.on(
            "end",
            async (
                collected,
                reason
            ) => {

                clearInterval(
                    countdown
                );

                if (
                    reason === "choice"
                ) {
                    return;
                }

                if (
                    finished
                ) {
                    return;
                }

                finished = true;

                try {

                    await msg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    "#95A5A6"
                                )
                                .setAuthor({
                                    name:
                                        `${message.author.globalName ||
                                        message.author.username} • Columbina`,
                                    iconURL:
                                        message.author.displayAvatarURL({
                                            extension: "png",
                                            size: 128
                                        })
                                })
                                .setTitle(
                                    "⏰ Tài Xỉu • Hết giờ"
                                )
                                .setDescription(
                                    "❄️ Bạn đã không đưa ra lựa chọn.\n\n" +
                                    `> 💰 **Cược:** \`${bet.toLocaleString()} Mora\`\n` +
                                    "> 💸 **Không mất tiền cược.**\n\n" +
                                    "Hãy chơi lại khi bạn sẵn sàng."
                                )
                                .setFooter({
                                    text:
                                        "❄️ Columbina • Tài Xỉu"
                                })
                                .setTimestamp()
                        ],
                        components: []
                    });

                } catch {}
            }
        );
    }
};
