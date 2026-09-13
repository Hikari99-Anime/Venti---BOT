
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 💣 CONFIG
// ==========================================

const SIZE = 4;
const BOMBS = 4;
const MAX_BET = 100000;

// ==========================================
// 🎨 COLORS
// ==========================================

const COLORS = {
    primary: "#9ccfd8",
    success: "#a8d8a8",
    warning: "#ffd166",
    error: "#f2a7a7",
    neutral: "#95A5A6"
};

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 🎲 RANDOM BOMBS
// ==========================================

function randomBombs() {
    const bombs = [];

    while (
        bombs.length < BOMBS
    ) {
        const position =
            Math.floor(
                Math.random() *
                (SIZE * SIZE)
            );

        if (
            !bombs.includes(
                position
            )
        ) {
            bombs.push(
                position
            );
        }
    }

    return bombs;
}

// ==========================================
// 📈 MULTIPLIER
// ==========================================

function getMultiplier(
    safeCount
) {
    const multipliers = [
        1.00,
        1.20,
        1.45,
        1.75,
        2.15,
        2.70,
        3.40,
        4.30,
        5.50,
        7.00,
        9.00,
        12.00,
        16.00
    ];

    return (
        multipliers[safeCount] ||
        multipliers[
            multipliers.length - 1
        ]
    );
}

// ==========================================
// 🧩 BOARD
// ==========================================

function createBoard(
    game,
    revealAll = false
) {
    const rows = [];

    for (
        let row = 0;
        row < SIZE;
        row++
    ) {
        const actionRow =
            new ActionRowBuilder();

        for (
            let col = 0;
            col < SIZE;
            col++
        ) {
            const index =
                row * SIZE + col;

            const isBomb =
                game.bombs.includes(
                    index
                );

            const revealed =
                game.revealed.includes(
                    index
                );

            let label = "💠";

            if (
                revealAll &&
                isBomb
            ) {
                label = "💣";
            } else if (
                revealed
            ) {
                label = "💎";
            }

            const button =
                new ButtonBuilder()
                    .setCustomId(
                        `bomb_tile_${game.userId}_${index}`
                    )
                    .setLabel(
                        label
                    )
                    .setStyle(
                        revealed ||
                        (
                            revealAll &&
                            isBomb
                        )
                            ? ButtonStyle.Secondary
                            : ButtonStyle.Primary
                    )
                    .setDisabled(
                        revealed ||
                        revealAll ||
                        game.finished
                    );

            actionRow.addComponents(
                button
            );
        }

        rows.push(
            actionRow
        );
    }

    // ======================================
    // 💰 CONTROL
    // ======================================

    const multiplier =
        getMultiplier(
            game.revealed.length
        );

    const reward =
        Math.floor(
            game.bet *
            multiplier
        );

    const controlRow =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `bomb_cashout_${game.userId}`
                    )
                    .setLabel(
                        `Rút ${money(reward)}`
                    )
                    .setEmoji(
                        "💰"
                    )
                    .setStyle(
                        ButtonStyle.Success
                    )
                    .setDisabled(
                        game.revealed.length ===
                            0 ||
                        game.finished
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `bomb_stop_${game.userId}`
                    )
                    .setLabel(
                        "Dừng"
                    )
                    .setEmoji(
                        "🛑"
                    )
                    .setStyle(
                        ButtonStyle.Danger
                    )
                    .setDisabled(
                        game.finished
                    )
            );

    rows.push(
        controlRow
    );

    return rows;
}

// ==========================================
// 📋 GAME EMBED
// ==========================================

function createEmbed(
    game
) {
    const multiplier =
        getMultiplier(
            game.revealed.length
        );

    const reward =
        Math.floor(
            game.bet *
            multiplier
        );

    return new EmbedBuilder()

        .setColor(
            COLORS.primary
        )

        .setAuthor({
            name:
                "Columbina • Bomb"
        })

        .setDescription(
            [
                "**BOMB GAME**",
                "",
                "- `💰` **Tiền cược**",
                `> **${money(game.bet)} Mora**`,
                "",
                "- `💎` **Ô an toàn**",
                `> **${game.revealed.length}**`,
                "",
                "- `📈` **Multiplier**",
                `> **x${multiplier}**`,
                "",
                "- `💵` **Có thể nhận**",
                `> **${money(reward)} Mora**`,
                "",
                "- `💠` **Chọn ô** để tìm đá quý",
                "- `💣` **Trúng bom** sẽ mất cược",
                "- `💎` **Mở càng nhiều ô** → thưởng càng cao"
            ].join("\n")
        )

        .setFooter({
            text:
                "Columbina • Dò Bom"
        })

        .setTimestamp();
}

// ==========================================
// 💰 CASHOUT EMBED
// ==========================================

function createCashoutEmbed(
    game,
    multiplier,
    reward,
    profit
) {
    return new EmbedBuilder()

        .setColor(
            COLORS.success
        )

        .setAuthor({
            name:
                "Columbina • Bomb"
        })

        .setDescription(
            [
                "**BOMB GAME • CASH OUT**",
                "",
                "- `💎` **Ô an toàn**",
                `> **${game.revealed.length}**`,
                "",
                "- `📈` **Multiplier**",
                `> **x${multiplier}**`,
                "",
                "- `💰` **Nhận được**",
                `> **+${money(reward)} Mora**`,
                "",
                "- `📊` **Lợi nhuận**",
                `> **${profit >= 0 ? "+" : ""}${money(profit)} Mora**`
            ].join("\n")
        )

        .setFooter({
            text:
                "Columbina • Dò Bom"
        })

        .setTimestamp();
}

// ==========================================
// 💣 BOOM EMBED
// ==========================================

function createBoomEmbed(
    game
) {
    return new EmbedBuilder()

        .setColor(
            COLORS.error
        )

        .setAuthor({
            name:
                "Columbina • Bomb"
        })

        .setDescription(
            [
                "**BOMB GAME • KẾT THÚC**",
                "",
                "- `💣` **Kết quả**",
                "> Bạn đã chọn trúng bom.",
                "",
                "- `💎` **Ô an toàn**",
                `> **${game.revealed.length}**`,
                "",
                "- `💸` **Mất cược**",
                `> **-${money(game.bet)} Mora**`,
                "",
                "> `🌙` Cẩn thận hơn ở ván sau nhé."
            ].join("\n")
        )

        .setFooter({
            text:
                "Columbina • Dò Bom"
        })

        .setTimestamp();
}

// ==========================================
// 🏆 WIN EMBED
// ==========================================

function createWinEmbed(
    game,
    multiplier,
    reward
) {
    const safeTiles =
        SIZE * SIZE - BOMBS;

    return new EmbedBuilder()

        .setColor(
            COLORS.warning
        )

        .setAuthor({
            name:
                "Columbina • Bomb"
        })

        .setDescription(
            [
                "**BOMB GAME • HOÀN THÀNH**",
                "",
                "- `💎` **Ô an toàn**",
                `> **${game.revealed.length}/${safeTiles}**`,
                "",
                "- `📈` **Multiplier**",
                `> **x${multiplier}**`,
                "",
                "- `💰` **Nhận được**",
                `> **+${money(reward)} Mora**`,
                "",
                "> `🏆` Bạn đã tìm thấy toàn bộ ô an toàn!"
            ].join("\n")
        )

        .setFooter({
            text:
                "Columbina • Dò Bom"
        })

        .setTimestamp();
}

// ==========================================
// 🛑 STOP EMBED
// ==========================================

function createStopEmbed(
    game
) {
    return new EmbedBuilder()

        .setColor(
            COLORS.neutral
        )

        .setAuthor({
            name:
                "Columbina • Bomb"
        })

        .setDescription(
            [
                "**BOMB GAME • ĐÃ DỪNG**",
                "",
                "- `💎` **Ô an toàn**",
                `> **${game.revealed.length}**`,
                "",
                "- `💸` **Mất cược**",
                `> **-${money(game.bet)} Mora**`
            ].join("\n")
        )

        .setFooter({
            text:
                "Columbina • Dò Bom"
        })

        .setTimestamp();
}

// ==========================================
// ⏰ TIMEOUT EMBED
// ==========================================

function createTimeoutEmbed(
    game
) {
    return new EmbedBuilder()

        .setColor(
            COLORS.neutral
        )

        .setAuthor({
            name:
                "Columbina • Bomb"
        })

        .setDescription(
            [
                "**BOMB GAME • HẾT THỜI GIAN**",
                "",
                "- `⏰` **Trạng thái**",
                "> Ván chơi đã hết thời gian.",
                "",
                "- `💸` **Mất cược**",
                `> **-${money(game.bet)} Mora**`
            ].join("\n")
        )

        .setFooter({
            text:
                "Columbina • Dò Bom"
        })

        .setTimestamp();
}

// ==========================================
// 🚀 COMMAND
// ==========================================

module.exports = {

    name:
        "bomb",

    aliases: [
        "mines",
        "mine",
        "dobom",
        "db"
    ],

    description:
        "Chơi game Dò Bom.",

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

        // ==================================
        // 💰 BET
        // ==================================

        const bet =
            parseInt(
                args[0],
                10
            );

        if (
            !Number.isInteger(
                bet
            ) ||
            bet <= 0
        ) {
            return message.reply(
                "💣 Dùng: `Vbomb <số tiền>`\n" +
                "Ví dụ: `Vbomb 1000`"
            );
        }

        // ==================================
        // 🔒 MAX BET
        // ==================================

        if (
            bet > MAX_BET
        ) {
            return message.reply(
                `💣 Cược tối đa **${money(MAX_BET)} Mora**.`
            );
        }

        // ==================================
        // 💰 BALANCE
        // ==================================

        const balance =
            Number(
                user.balance || 0
            );

        if (
            balance < bet
        ) {
            return message.reply(
                [
                    "💸 Bạn không đủ Mora.",
                    "",
                    `> 💰 Cần: **${money(bet)} Mora**`,
                    `> 🪙 Có: **${money(balance)} Mora**`
                ].join("\n")
            );
        }

        // ==================================
        // 💸 REMOVE BET
        // ==================================

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

        // ==================================
        // 🎮 CREATE GAME
        // ==================================

        const game = {

            userId,

            bet,

            bombs:
                randomBombs(),

            revealed: [],

            finished:
                false
        };

        const msg =
            await message.reply({

                embeds: [
                    createEmbed(
                        game
                    )
                ],

                components:
                    createBoard(
                        game
                    )
            });

        // ==================================
        // 🎮 COLLECTOR
        // ==================================

        const collector =
            msg.createMessageComponentCollector({
                time: 120000
            });

        // ==================================
        // 🔘 COLLECT
        // ==================================

        collector.on(
            "collect",
            async interaction => {

                try {

                    // ==========================
                    // 🔐 USER CHECK
                    // ==========================

                    if (
                        interaction.user.id !==
                        userId
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Đây không phải ván chơi của bạn.",
                            ephemeral:
                                true
                        });
                    }

                    // ==========================
                    // 🛑 FINISHED
                    // ==========================

                    if (
                        game.finished
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Ván chơi đã kết thúc.",
                            ephemeral:
                                true
                        });
                    }

                    // ==========================
                    // 💰 CASHOUT
                    // ==========================

                    if (
                        interaction.customId ===
                        `bomb_cashout_${userId}`
                    ) {

                        if (
                            game.revealed.length ===
                            0
                        ) {
                            return interaction.reply({
                                content:
                                    "💣 Hãy mở ít nhất 1 ô trước.",
                                ephemeral:
                                    true
                            });
                        }

                        const multiplier =
                            getMultiplier(
                                game.revealed.length
                            );

                        const reward =
                            Math.floor(
                                game.bet *
                                multiplier
                            );

                        game.finished =
                            true;

                        User.addBalance(
                            userId,
                            reward
                        );

                        const profit =
                            reward -
                            game.bet;

                        await interaction.update({

                            embeds: [
                                createCashoutEmbed(
                                    game,
                                    multiplier,
                                    reward,
                                    profit
                                )
                            ],

                            components:
                                createBoard(
                                    game,
                                    true
                                )
                        });

                        collector.stop(
                            "cashout"
                        );

                        return;
                    }

                    // ==========================
                    // 🛑 STOP
                    // ==========================

                    if (
                        interaction.customId ===
                        `bomb_stop_${userId}`
                    ) {

                        game.finished =
                            true;

                        await interaction.update({

                            embeds: [
                                createStopEmbed(
                                    game
                                )
                            ],

                            components:
                                createBoard(
                                    game,
                                    true
                                )
                        });

                        collector.stop(
                            "stop"
                        );

                        return;
                    }

                    // ==========================
                    // 💠 TILE PREFIX
                    // ==========================

                    const prefix =
                        `bomb_tile_${userId}_`;

                    if (
                        !interaction.customId.startsWith(
                            prefix
                        )
                    ) {
                        return;
                    }

                    // ==========================
                    // 🔢 TILE INDEX
                    // ==========================

                    const index =
                        Number(
                            interaction.customId.slice(
                                prefix.length
                            )
                        );

                    if (
                        !Number.isInteger(
                            index
                        ) ||
                        index < 0 ||
                        index >=
                            SIZE * SIZE
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Ô không hợp lệ.",
                            ephemeral:
                                true
                        });
                    }

                    // ==========================
                    // 💎 ALREADY REVEALED
                    // ==========================

                    if (
                        game.revealed.includes(
                            index
                        )
                    ) {
                        return interaction.reply({
                            content:
                                "💎 Ô này đã mở.",
                            ephemeral:
                                true
                        });
                    }

                    // ==========================
                    // 💣 BOMB
                    // ==========================

                    if (
                        game.bombs.includes(
                            index
                        )
                    ) {

                        game.finished =
                            true;

                        await interaction.update({

                            embeds: [
                                createBoomEmbed(
                                    game
                                )
                            ],

                            components:
                                createBoard(
                                    game,
                                    true
                                )
                        });

                        collector.stop(
                            "bomb"
                        );

                        return;
                    }

                    // ==========================
                    // 💎 SAFE
                    // ==========================

                    game.revealed.push(
                        index
                    );

                    const safeTiles =
                        SIZE * SIZE -
                        BOMBS;

                    // ==========================
                    // 🏆 ALL SAFE
                    // ==========================

                    if (
                        game.revealed.length >=
                        safeTiles
                    ) {

                        const multiplier =
                            getMultiplier(
                                game.revealed.length
                            );

                        const reward =
                            Math.floor(
                                game.bet *
                                multiplier
                            );

                        game.finished =
                            true;

                        User.addBalance(
                            userId,
                            reward
                        );

                        await interaction.update({

                            embeds: [
                                createWinEmbed(
                                    game,
                                    multiplier,
                                    reward
                                )
                            ],

                            components:
                                createBoard(
                                    game,
                                    true
                                )
                        });

                        collector.stop(
                            "win"
                        );

                        return;
                    }

                    // ==========================
                    // 🔄 UPDATE GAME
                    // ==========================

                    await interaction.update({

                        embeds: [
                            createEmbed(
                                game
                            )
                        ],

                        components:
                            createBoard(
                                game
                            )
                    });

                } catch (
                    error
                ) {

                    console.error(
                        "[bomb] Interaction Error:",
                        error
                    );

                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {
                        await interaction
                            .reply({
                                content:
                                    "❌ Có lỗi xảy ra khi xử lý lượt chơi.",
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

        // ==================================
        // ⏰ TIMEOUT
        // ==================================

        collector.on(
            "end",
            async () => {

                if (
                    game.finished
                ) {
                    return;
                }

                game.finished =
                    true;

                try {

                    await msg.edit({

                        embeds: [
                            createTimeoutEmbed(
                                game
                            )
                        ],

                        components:
                            createBoard(
                                game,
                                true
                            )
                    });

                } catch {}
            }
        );
    }
};

