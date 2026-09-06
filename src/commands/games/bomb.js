
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
// 🎲 RANDOM BOMBS
// ==========================================

function randomBombs() {
    const bombs = [];

    while (bombs.length < BOMBS) {
        const position =
            Math.floor(
                Math.random() *
                (SIZE * SIZE)
            );

        if (
            !bombs.includes(position)
        ) {
            bombs.push(position);
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
                    .setLabel(label)
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
                        `Rút ${reward.toLocaleString()}`
                    )
                    .setEmoji("💰")
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
                    .setLabel("Dừng")
                    .setEmoji("🛑")
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

    // Tổng cộng:
    // 4 board rows + 1 control row
    // = 5 rows, Discord cho phép
    return rows;
}

// ==========================================
// 📋 EMBED
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
        .setColor("#5865F2")
        .setTitle(
            "💣 Dò Bom"
        )
        .setDescription(
            "💠 Chọn ô để tìm đá quý.\n" +
            "💣 Trúng bom sẽ mất cược.\n" +
            "💎 Càng mở nhiều ô, thưởng càng cao.\n" +

            `> 💸 Cược: **${game.bet.toLocaleString()} Mora**\n` +
            `> 💎 An toàn: **${game.revealed.length}**\n` +
            `> 📈 Multiplier: **x${multiplier}**\n` +
            `> 💰 Có thể nhận: **${reward.toLocaleString()} Mora**`
        )
        .setFooter({
            text:
                "💣 Venti • Dò Bom"
        });
}

// ==========================================
// 🚀 COMMAND
// ==========================================

module.exports = {
    name: "bomb",

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

        let bet =
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

        if (
            bet > MAX_BET
        ) {
            return message.reply(
                `💣 Cược tối đa **${MAX_BET.toLocaleString()} Mora**.`
            );
        }

        const balance =
            Number(
                user.balance || 0
            );

        if (
            balance < bet
        ) {
            return message.reply(
                `💸 Bạn không đủ Mora.\n\n` +
                `> 💰 Cần: **${bet.toLocaleString()}**\n` +
                `> 🪙 Có: **${balance.toLocaleString()}**`
            );
        }

        // ==================================
        // 💸 TRỪ CƯỢC
        // ==================================

        User.removeBalance(
            userId,
            bet
        );

        const game = {
            userId,
            bet,
            bombs:
                randomBombs(),
            revealed: [],
            finished: false
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

        collector.on(
            "collect",
            async interaction => {
                try {
                    if (
                        interaction.user.id !==
                        userId
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Đây không phải ván chơi của bạn.",
                            ephemeral: true
                        });
                    }

                    if (
                        game.finished
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Ván chơi đã kết thúc.",
                            ephemeral: true
                        });
                    }

                    // ==============================
                    // 💰 CASH OUT
                    // ==============================

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
                                ephemeral: true
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

                        const embed =
                            new EmbedBuilder()
                                .setColor(
                                    "#57F287"
                                )
                                .setTitle(
                                    "💰 Rút tiền thành công!"
                                )
                                .setDescription(
                                    `> 💎 Ô an toàn: **${game.revealed.length}**\n` +
                                    `> 📈 Multiplier: **x${multiplier}**\n` +
                                    `> 💰 Nhận: **+${reward.toLocaleString()} Mora**\n` +
                                    `> 📊 Lãi: **${profit >= 0 ? "+" : ""}${profit.toLocaleString()} Mora**\n` 
                                    
                                );

                        await interaction.update({
                            embeds: [
                                embed
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

                    // ==============================
                    // 🛑 STOP
                    // ==============================

                    if (
                        interaction.customId ===
                        `bomb_stop_${userId}`
                    ) {
                        game.finished =
                            true;

                        const embed =
                            new EmbedBuilder()
                                .setColor(
                                    "#95A5A6"
                                )
                                .setTitle(
                                    "🛑 Đã dừng"
                                )
                                .setDescription(
                                    `> 💎 Ô an toàn: **${game.revealed.length}**\n` +
                                    `> 💸 Mất cược: **${game.bet.toLocaleString()} Mora**`
                                );

                        await interaction.update({
                            embeds: [
                                embed
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

                    // ==============================
                    // 💠 TILE
                    // ==============================

                    const prefix =
                        `bomb_tile_${userId}_`;

                    if (
                        !interaction.customId.startsWith(
                            prefix
                        )
                    ) {
                        return;
                    }

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
                            ephemeral: true
                        });
                    }

                    if (
                        game.revealed.includes(
                            index
                        )
                    ) {
                        return interaction.reply({
                            content:
                                "💎 Ô này đã mở.",
                            ephemeral: true
                        });
                    }

                    // ==============================
                    // 💣 BOMB
                    // ==============================

                    if (
                        game.bombs.includes(
                            index
                        )
                    ) {
                        game.finished =
                            true;

                        const embed =
                            new EmbedBuilder()
                                .setColor(
                                    "#ED4245"
                                )
                                .setTitle(
                                    "💣 BOOM!"
                                )
                                .setDescription(
                                    "୨୧ ───────── ୨୧\n" +
                                    "> 💣 Bạn đã chọn trúng bom!\n" +
                                    `> 💎 Ô an toàn: **${game.revealed.length}**\n` +
                                    `> 💸 Mất cược: **${game.bet.toLocaleString()} Mora**\n` +
                                    "୨୧ ───────── ୨୧\n\n" +
                                    "🍃 Cẩn thận hơn ở ván sau nhé!"
                                );

                        await interaction.update({
                            embeds: [
                                embed
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

                    // ==============================
                    // 💎 SAFE
                    // ==============================

                    game.revealed.push(
                        index
                    );

                    const safeTiles =
                        SIZE * SIZE -
                        BOMBS;

                    // ==============================
                    // 🏆 WIN
                    // ==============================

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

                        const embed =
                            new EmbedBuilder()
                                .setColor(
                                    "#F1C40F"
                                )
                                .setTitle(
                                    "🏆 Dò sạch bàn!"
                                )
                                .setDescription(
                                    `> 💎 Tìm thấy toàn bộ **${safeTiles} ô an toàn**!\n` +
                                    `> 📈 Multiplier: **x${multiplier}**\n` +
                                    `> 💰 Nhận: **+${reward.toLocaleString()} Mora**`
                                );

                        await interaction.update({
                            embeds: [
                                embed
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

                    // ==============================
                    // 🔄 UPDATE
                    // ==============================

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
                            new EmbedBuilder()
                                .setColor(
                                    "#95A5A6"
                                )
                                .setTitle(
                                    "⏰ Hết thời gian"
                                )
                                .setDescription(
                                    `> 💣 Ván chơi đã hết thời gian.\n` +
                                    `> 💸 Mất cược: **${game.bet.toLocaleString()} Mora**`
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

