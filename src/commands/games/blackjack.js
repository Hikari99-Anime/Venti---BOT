
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
    {
        name: "A",
        value: 11
    },
    {
        name: "2",
        value: 2
    },
    {
        name: "3",
        value: 3
    },
    {
        name: "4",
        value: 4
    },
    {
        name: "5",
        value: 5
    },
    {
        name: "6",
        value: 6
    },
    {
        name: "7",
        value: 7
    },
    {
        name: "8",
        value: 8
    },
    {
        name: "9",
        value: 9
    },
    {
        name: "10",
        value: 10
    },
    {
        name: "J",
        value: 10
    },
    {
        name: "Q",
        value: 10
    },
    {
        name: "K",
        value: 10
    }
];

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
        "Chơi Blackjack với Venti.",

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

        // Trừ tiền cược
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
            const playerBlackjack =
                true;

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
                            "❌ Đây không phải ván Blackjack của bạn.",
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

                    // Bust
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

                    // 21
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
                                    "> ⏰ Bạn đã không đưa ra lựa chọn.\n" +
                                    "> 💸 Tiền cược đã bị mất."
                                )
                                .setFooter({
                                    text:
                                        "🍃 Venti • Blackjack"
                                })
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
    player,
    dealer,
    bet
) {
    return new EmbedBuilder()
        .setColor(
            "#9B59B6"
        )
        .setTitle(
            "🃏 Blackjack"
        )
        .setDescription(
            `> 💰 Cược: \`${bet.toLocaleString()} Mora\`\n\n` +

            `### 🤵 Dealer\n` +
            `> \`${dealer[0].name}${dealer[0].suit}\`  \`??\`\n\n` +

            `### 👤 Bạn\n` +
            `> ${formatHand(player)}\n` +
            `> ⭐ Điểm: **${getHandValue(player)}**\n\n` +

            "────────────────────\n" +
            "> 🎴 **Hit** để rút thêm\n" +
            "> 🛑 **Stand** để dừng"
        )
        .setFooter({
            text:
                "🍃 Venti • Blackjack"
        });
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
        "#ED4245";

    let title =
        "💀 Blackjack • Thua";

    let message =
        `> 💸 -${bet.toLocaleString()} Mora`;

    if (
        result === "win"
    ) {
        color =
            "#57F287";

        title =
            "🎉 Blackjack • Thắng";

        message =
            `> 💰 +${reward.toLocaleString()} Mora`;
    }

    if (
        result === "draw"
    ) {
        color =
            "#FEE75C";

        title =
            "🤝 Blackjack • Hòa";

        message =
            `> 💰 Hoàn lại \`${reward.toLocaleString()} Mora\``;
    }

    if (
        result === "blackjack"
    ) {
        color =
            "#F1C40F";

        title =
            "👑 BLACKJACK!";

        message =
            `> 💎 +${reward.toLocaleString()} Mora`;
    }

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(
            `### 🤵 Dealer\n` +
            `> ${formatHand(dealer)}\n` +
            `> ⭐ Điểm: **${getHandValue(dealer)}**\n\n` +

            `### 👤 Bạn\n` +
            `> ${formatHand(player)}\n` +
            `> ⭐ Điểm: **${getHandValue(player)}**\n\n` +

            "────────────────────\n" +
            message
        )
        .setFooter({
            text:
                "🍃 Venti • Blackjack"
        });
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

