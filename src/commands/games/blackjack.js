const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 🃏 BLACKJACK
// ==========================================

const SUITS = [
    "♠️",
    "♥️",
    "♦️",
    "♣️"
];

const VALUES = [
    { name: "A", value: 11 },
    { name: "2", value: 2 },
    { name: "3", value: 3 },
    { name: "4", value: 4 },
    { name: "5", value: 5 },
    { name: "6", value: 6 },
    { name: "7", value: 7 },
    { name: "8", value: 8 },
    { name: "9", value: 9 },
    { name: "10", value: 10 },
    { name: "J", value: 10 },
    { name: "Q", value: 10 },
    { name: "K", value: 10 }
];

// ==========================================
// 🎨 COLORS
// ==========================================

const COLORS = {
    primary: "#A8DCC0",
    success: "#A8D8A8",
    error: "#F2A7A7",
    warning: "#FFD166"
};

// ==========================================
// 🃏 DECK
// ==========================================

function createDeck() {
    const deck = [];

    for (const suit of SUITS) {
        for (const card of VALUES) {
            deck.push({
                name: card.name,
                value: card.value,
                suit
            });
        }
    }

    return shuffle(deck);
}

function shuffle(deck) {
    const result = [...deck];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}

// ==========================================
// 🔢 HAND VALUE
// ==========================================

function getHandValue(hand) {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
        total += card.value;

        if (card.name === "A") {
            aces++;
        }
    }

    while (
        total > 21 &&
        aces > 0
    ) {
        total -= 10;
        aces--;
    }

    return total;
}

function isBlackjack(hand) {
    return (
        hand.length === 2 &&
        getHandValue(hand) === 21
    );
}

function formatHand(hand) {
    return hand
        .map(
            card =>
                `\`${card.name}${card.suit}\``
        )
        .join("  ");
}

// ==========================================
// 📊 STATS
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
// 🎮 COMMAND
// ==========================================

module.exports = {
    name: "blackjack",

    aliases: [
        "bj",
        "21",
        "vblackjack"
    ],

    description:
        "Chơi Blackjack với Columbina.",

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
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            COLORS.error
                        )
                        .setDescription(
                            [
                                "- `❌` **Không đủ Mora**",
                                "",
                                `> \`💰\` Cần: **${bet.toLocaleString("vi-VN")} Mora**`,
                                `> \`💳\` Có: **${Number(user.balance || 0).toLocaleString("vi-VN")} Mora**`
                            ].join("\n")
                        )
                ]
            });
        }

        User.removeBalance(
            userId,
            bet
        );

        const deck =
            createDeck();

        const player = [
            deck.pop(),
            deck.pop()
        ];

        const dealer = [
            deck.pop(),
            deck.pop()
        ];

        let finished = false;

        // ======================================
        // 🃏 BLACKJACK NGAY TỪ ĐẦU
        // ======================================

        if (
            isBlackjack(player)
        ) {
            const dealerBlackjack =
                isBlackjack(
                    dealer
                );

            if (
                dealerBlackjack
            ) {
                User.addBalance(
                    userId,
                    bet
                );

                recordGame(
                    userId,
                    "draw"
                );

                return message.reply({
                    embeds: [
                        createResultEmbed(
                            player,
                            dealer,
                            "draw",
                            bet,
                            bet
                        )
                    ]
                });
            }

            const reward =
                Math.floor(
                    bet * 2.5
                );

            User.addBalance(
                userId,
                reward
            );

            recordGame(
                userId,
                "win"
            );

            return message.reply({
                embeds: [
                    createResultEmbed(
                        player,
                        dealer,
                        "blackjack",
                        bet,
                        reward
                    )
                ]
            });
        }

        // ======================================
        // 🎮 GAME
        // ======================================

        const msg =
            await message.reply({
                embeds: [
                    createGameEmbed(
                        message,
                        player,
                        dealer,
                        bet
                    )
                ],
                components: [
                    createButtons(
                        userId
                    )
                ]
            });

        const collector =
            msg.createMessageComponentCollector({
                time: 120000
            });

        // ======================================
        // 🔘 BUTTON
        // ======================================

        collector.on(
            "collect",
            async interaction => {
                if (
                    interaction.user.id !==
                    userId
                ) {
                    return interaction.reply({
                        content:
                            "🍃 Đây không phải ván Blackjack của bạn.",
                        ephemeral: true
                    });
                }

                if (
                    finished
                ) {
                    return;
                }

                // ==================================
                // 🎴 HIT
                // ==================================

                if (
                    interaction.customId ===
                    `bj_hit_${userId}`
                ) {
                    player.push(
                        deck.pop()
                    );

                    const value =
                        getHandValue(
                            player
                        );

                    if (
                        value > 21
                    ) {
                        finished =
                            true;

                        recordGame(
                            userId,
                            "lose"
                        );

                        collector.stop(
                            "finished"
                        );

                        return interaction.update({
                            embeds: [
                                createResultEmbed(
                                    player,
                                    dealer,
                                    "lose",
                                    bet,
                                    0
                                )
                            ],
                            components: []
                        });
                    }

                    if (
                        value === 21
                    ) {
                        return dealerTurn(
                            interaction
                        );
                    }

                    return interaction.update({
                        embeds: [
                            createGameEmbed(
                                message,
                                player,
                                dealer,
                                bet
                            )
                        ],
                        components: [
                            createButtons(
                                userId
                            )
                        ]
                    });
                }

                // ==================================
                // 🛑 STAND
                // ==================================

                if (
                    interaction.customId ===
                    `bj_stand_${userId}`
                ) {
                    return dealerTurn(
                        interaction
                    );
                }
            }
        );

        // ======================================
        // 🏁 DEALER
        // ======================================

        async function dealerTurn(
            interaction
        ) {
            while (
                getHandValue(
                    dealer
                ) < 17
            ) {
                dealer.push(
                    deck.pop()
                );
            }

            const playerValue =
                getHandValue(
                    player
                );

            const dealerValue =
                getHandValue(
                    dealer
                );

            let result;
            let reward = 0;

            if (
                dealerValue > 21
            ) {
                result = "win";
                reward = bet * 2;
            } else if (
                playerValue >
                dealerValue
            ) {
                result = "win";
                reward = bet * 2;
            } else if (
                playerValue ===
                dealerValue
            ) {
                result = "draw";
                reward = bet;
            } else {
                result = "lose";
                reward = 0;
            }

            if (
                reward > 0
            ) {
                User.addBalance(
                    userId,
                    reward
                );
            }

            recordGame(
                userId,
                result
            );

            finished = true;

            collector.stop(
                "finished"
            );

            return interaction.update({
                embeds: [
                    createResultEmbed(
                        player,
                        dealer,
                        result,
                        bet,
                        reward
                    )
                ],
                components: []
            });
        }

        // ======================================
        // ⏰ TIMEOUT
        // ======================================

        collector.on(
            "end",
            async () => {
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
                                .setTitle(
                                    "🃏 Blackjack • Hết giờ"
                                )
                                .setDescription(
                                    [
                                        "- `⏰` **Ván Blackjack đã hết thời gian**",
                                        "",
                                        "> `💸` Tiền cược đã bị mất."
                                    ].join("\n")
                                )
                                .setFooter({
                                    text:
                                        "☁️ Columbina • Cozy Corner"
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

// ==========================================
// 🎮 GAME EMBED
// ==========================================

function createGameEmbed(
    message,
    player,
    dealer,
    bet
) {
    const name =
        message.author.globalName ||
        message.author.username;

    return new EmbedBuilder()
        .setColor(
            COLORS.primary
        )

        .setAuthor({
            name:
                `☁️ ${name} · Columbina`,
            iconURL:
                message.author.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        })

        .setTitle(
            "🃏 Blackjack"
        )

        .setDescription(
            [
                "☁️ `🍃` **Một ván bài nhỏ trong hành trình**",
                "",

                "- `💰` **Cược**",
                `> \`${bet.toLocaleString("vi-VN")} Mora\``,
                "",

                "- `🤵` **Dealer**",
                `> \`${dealer[0].name}${dealer[0].suit}\`  \`??\``,
                "",

                "- `👤` **Bạn**",
                `> ${formatHand(player)}`,
                `> \`⭐\` Điểm: **${getHandValue(player)}**`,
                "",

                "- `🎴` **Lựa chọn**",
                "> Nhấn **Hit** để rút thêm",
                "> Nhấn **Stand** để dừng"
            ].join("\n")
        )

        .setFooter({
            text:
                "☁️ Columbina • Cozy Corner"
        })

        .setTimestamp();
}

// ==========================================
// 🏆 RESULT EMBED
// ==========================================

function createResultEmbed(
    player,
    dealer,
    result,
    bet,
    reward
) {
    let color =
        COLORS.error;

    let title =
        "🃏 Blackjack • Thua";

    let resultText =
        `> \`💸\` -${bet.toLocaleString("vi-VN")} Mora`;

    if (
        result === "win"
    ) {
        color =
            COLORS.success;

        title =
            "🃏 Blackjack • Thắng";

        resultText =
            `> \`💰\` +${reward.toLocaleString("vi-VN")} Mora`;
    }

    if (
        result === "draw"
    ) {
        color =
            COLORS.warning;

        title =
            "🃏 Blackjack • Hòa";

        resultText =
            `> \`💰\` Hoàn lại **${reward.toLocaleString("vi-VN")} Mora**`;
    }

    if (
        result === "blackjack"
    ) {
        color =
            "#E8C36A";

        title =
            "👑 Blackjack!";

        resultText =
            `> \`💎\` +${reward.toLocaleString("vi-VN")} Mora`;
    }

    return new EmbedBuilder()
        .setColor(
            color
        )

        .setTitle(
            title
        )

        .setDescription(
            [
                "☁️ `🍃` **Kết quả ván bài**",
                "",

                "- `🤵` **Dealer**",
                `> ${formatHand(dealer)}`,
                `> \`⭐\` Điểm: **${getHandValue(dealer)}**`,
                "",

                "- `👤` **Bạn**",
                `> ${formatHand(player)}`,
                `> \`⭐\` Điểm: **${getHandValue(player)}**`,
                "",

                "- `💰` **Cược**",
                `> \`${bet.toLocaleString("vi-VN")} Mora\``,
                "",

                "- `🎁` **Kết quả**",
                resultText
            ].join("\n")
        )

        .setFooter({
            text:
                "☁️ Columbina • Cozy Corner"
        })

        .setTimestamp();
}

// ==========================================
// 🔘 BUTTONS
// ==========================================

function createButtons(
    userId
) {
    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `bj_hit_${userId}`
                )
                .setLabel(
                    "Hit"
                )
                .setEmoji(
                    "🎴"
                )
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    `bj_stand_${userId}`
                )
                .setLabel(
                    "Stand"
                )
                .setEmoji(
                    "🛑"
                )
                .setStyle(
                    ButtonStyle.Success
                )
        );
}