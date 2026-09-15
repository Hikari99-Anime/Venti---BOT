const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
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
    primary: 0xA8DCC0,
    success: 0xA8D8A8,
    error: 0xF2A7A7,
    warning: 0xFFD166,
    neutral: 0x95A5A6,
    blackjack: 0xE8C36A
};

// ==========================================
// 💰 MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

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

// ==========================================
// 👑 BLACKJACK
// ==========================================

function isBlackjack(hand) {
    return (
        hand.length === 2 &&
        getHandValue(hand) === 21
    );
}

// ==========================================
// 🃏 FORMAT HAND
// ==========================================

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
// 🧱 COMPONENT HEADER
// ==========================================

function createHeader(
    title,
    color
) {
    const container =
        new ContainerBuilder()
            .setAccentColor(
                color
            );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                `# ${title}`
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    return container;
}

// ==========================================
// 🎮 GAME COMPONENT
// ==========================================

function createGameComponents(
    message,
    player,
    dealer,
    bet
) {
    const name =
        message.author.globalName ||
        message.author.username;

    const container =
        createHeader(
            "🃏 BLACKJACK",
            COLORS.primary
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                [
                    `### ☁️ ${name}`,
                    "",
                    "☁️ `🍃` **Một ván bài nhỏ trong hành trình**"
                ].join("\n")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                [
                    "### 💰 Cược",
                    `> \`${money(bet)} Mora\``,
                    "",
                    "### 🤵 Dealer",
                    `> \`${dealer[0].name}${dealer[0].suit}\`  \`??\``,
                    "",
                    "### 👤 Bạn",
                    `> ${formatHand(player)}`,
                    `> \`⭐\` Điểm: **${getHandValue(player)}**`
                ].join("\n")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                [
                    "### 🎴 Lựa chọn",
                    "> 🎴 **Hit** để rút thêm",
                    "> 🛑 **Stand** để dừng"
                ].join("\n")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "☁️ Columbina • Cozy Corner"
            )
    );

    return container;
}

// ==========================================
// 🏆 RESULT COMPONENT
// ==========================================

function createResultComponents(
    player,
    dealer,
    result,
    bet,
    reward
) {
    let color =
        COLORS.error;

    let title =
        "🃏 BLACKJACK • THUA";

    let resultText =
        `> \`💸\` **-${money(bet)} Mora**`;

    // ======================================
    // 🏆 WIN
    // ======================================

    if (
        result === "win"
    ) {
        color =
            COLORS.success;

        title =
            "🃏 BLACKJACK • THẮNG";

        resultText =
            `> \`💰\` **+${money(reward)} Mora**`;
    }

    // ======================================
    // 🤝 DRAW
    // ======================================

    if (
        result === "draw"
    ) {
        color =
            COLORS.warning;

        title =
            "🃏 BLACKJACK • HÒA";

        resultText =
            `> \`💰\` Hoàn lại **${money(reward)} Mora**`;
    }

    // ======================================
    // 👑 BLACKJACK
    // ======================================

    if (
        result === "blackjack"
    ) {
        color =
            COLORS.blackjack;

        title =
            "👑 BLACKJACK!";

        resultText =
            `> \`💎\` **+${money(reward)} Mora**`;
    }

    const container =
        createHeader(
            title,
            color
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "☁️ `🍃` **Kết quả ván bài**"
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                [
                    "### 🤵 Dealer",
                    `> ${formatHand(dealer)}`,
                    `> \`⭐\` Điểm: **${getHandValue(dealer)}**`,
                    "",
                    "### 👤 Bạn",
                    `> ${formatHand(player)}`,
                    `> \`⭐\` Điểm: **${getHandValue(player)}**`
                ].join("\n")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                [
                    "### 💰 Cược",
                    `> \`${money(bet)} Mora\``,
                    "",
                    "### 🎁 Kết quả",
                    resultText
                ].join("\n")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "☁️ Columbina • Cozy Corner"
            )
    );

    return container;
}

// ==========================================
// ⏰ TIMEOUT COMPONENT
// ==========================================

function createTimeoutComponents() {
    const container =
        createHeader(
            "🃏 BLACKJACK • HẾT GIỜ",
            COLORS.neutral
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                [
                    "### ⏰ Trạng thái",
                    "> Ván Blackjack đã hết thời gian.",
                    "",
                    "### 💸 Cược",
                    "> Tiền cược đã bị mất."
                ].join("\n")
            )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                "☁️ Columbina • Cozy Corner"
            )
    );

    return container;
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

// ==========================================
// 🚀 COMMAND
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

        // ======================================
        // 👤 USER
        // ======================================

        const userId =
            message.author.id;

        const user =
            User.getOrCreate(
                userId
            );

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

        // ======================================
        // 💸 BALANCE
        // ======================================

        if (
            Number(user.balance || 0) <
            bet
        ) {

            const container =
                createHeader(
                    "❌ KHÔNG ĐỦ MORA",
                    COLORS.error
                );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        [
                            "### 💰 Tiền cược",
                            `> Cần: **${money(bet)} Mora**`,
                            `> Có: **${money(user.balance)} Mora**`
                        ].join("\n")
                    )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "☁️ Columbina • Cozy Corner"
                    )
            );

            return message.reply({

                flags:
                    MessageFlags.IsComponentsV2,

                components: [
                    container
                ]
            });
        }

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
        // 🃏 CREATE DECK
        // ======================================

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

        let finished =
            false;

        // ======================================
        // 👑 NATURAL BLACKJACK
        // ======================================

        if (
            isBlackjack(player)
        ) {

            const dealerBlackjack =
                isBlackjack(
                    dealer
                );

            // ==================================
            // 🤝 BOTH BLACKJACK
            // ==================================

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

                    flags:
                        MessageFlags.IsComponentsV2,

                    components: [
                        createResultComponents(
                            player,
                            dealer,
                            "draw",
                            bet,
                            bet
                        )
                    ]
                });
            }

            // ==================================
            // 👑 PLAYER BLACKJACK
            // ==================================

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

                flags:
                    MessageFlags.IsComponentsV2,

                components: [
                    createResultComponents(
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
        // 🎮 GAME MESSAGE
        // ======================================

        const msg =
            await message.reply({

                flags:
                    MessageFlags.IsComponentsV2,

                components: [
                    createGameComponents(
                        message,
                        player,
                        dealer,
                        bet
                    ),
                    createButtons(
                        userId
                    )
                ]
            });

        // ======================================
        // 🎮 COLLECTOR
        // ======================================

        const collector =
            msg.createMessageComponentCollector({
                time: 120000
            });

        // ======================================
        // 🔘 BUTTON COLLECT
        // ======================================

        collector.on(
            "collect",
            async interaction => {

                try {

                    // ==============================
                    // 🔐 USER CHECK
                    // ==============================

                    if (
                        interaction.user.id !==
                        userId
                    ) {

                        return interaction.reply({
                            content:
                                "🍃 Đây không phải ván Blackjack của bạn.",
                            ephemeral:
                                true
                        });
                    }

                    // ==============================
                    // 🛑 FINISHED
                    // ==============================

                    if (
                        finished
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Ván Blackjack đã kết thúc.",
                            ephemeral:
                                true
                        });
                    }

                    // ==============================
                    // 🎴 HIT
                    // ==============================

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

                        // ==========================
                        // 💥 BUST
                        // ==========================

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

                                flags:
                                    MessageFlags.IsComponentsV2,

                                components: [
                                    createResultComponents(
                                        player,
                                        dealer,
                                        "lose",
                                        bet,
                                        0
                                    )
                                ]
                            });
                        }

                        // ==========================
                        // 🎯 EXACT 21
                        // ==========================

                        if (
                            value === 21
                        ) {

                            return dealerTurn(
                                interaction
                            );
                        }

                        // ==========================
                        // 🔄 CONTINUE
                        // ==========================

                        return interaction.update({

                            flags:
                                MessageFlags.IsComponentsV2,

                            components: [
                                createGameComponents(
                                    message,
                                    player,
                                    dealer,
                                    bet
                                ),
                                createButtons(
                                    userId
                                )
                            ]
                        });
                    }

                    // ==============================
                    // 🛑 STAND
                    // ==============================

                    if (
                        interaction.customId ===
                        `bj_stand_${userId}`
                    ) {

                        return dealerTurn(
                            interaction
                        );
                    }

                } catch (
                    error
                ) {

                    console.error(
                        "[blackjack] Interaction Error:",
                        error
                    );

                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction
                            .reply({
                                content:
                                    "❌ Có lỗi xảy ra khi xử lý ván Blackjack.",
                                ephemeral:
                                    true
                            })
                            .catch(
                                () => {}
                            );
                    }
                }
            }
        );

        // ======================================
        // 🏁 DEALER TURN
        // ======================================

        async function dealerTurn(
            interaction
        ) {

            // ==============================
            // 🤵 DEALER DRAW
            // ==============================

            while (
                getHandValue(
                    dealer
                ) < 17
            ) {

                dealer.push(
                    deck.pop()
                );
            }

            // ==============================
            // 🔢 VALUES
            // ==============================

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

            // ==============================
            // 💥 DEALER BUST
            // ==============================

            if (
                dealerValue > 21
            ) {

                result =
                    "win";

                reward =
                    bet * 2;

            // ==============================
            // 🏆 PLAYER HIGHER
            // ==============================

            } else if (
                playerValue >
                dealerValue
            ) {

                result =
                    "win";

                reward =
                    bet * 2;

            // ==============================
            // 🤝 DRAW
            // ==============================

            } else if (
                playerValue ===
                dealerValue
            ) {

                result =
                    "draw";

                reward =
                    bet;

            // ==============================
            // 💸 LOSE
            // ==============================

            } else {

                result =
                    "lose";

                reward =
                    0;
            }

            // ==============================
            // 💰 PAYOUT
            // ==============================

            if (
                reward > 0
            ) {

                User.addBalance(
                    userId,
                    reward
                );
            }

            // ==============================
            // 📊 RECORD
            // ==============================

            recordGame(
                userId,
                result
            );

            finished =
                true;

            collector.stop(
                "finished"
            );

            // ==============================
            // 📤 RESULT
            // ==============================

            return interaction.update({

                flags:
                    MessageFlags.IsComponentsV2,

                components: [
                    createResultComponents(
                        player,
                        dealer,
                        result,
                        bet,
                        reward
                    )
                ]
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

                finished =
                    true;

                try {

                    await msg.edit({

                        flags:
                            MessageFlags.IsComponentsV2,

                        components: [
                            createTimeoutComponents()
                        ]
                    });

                } catch {}
            }
        );
    }
};
