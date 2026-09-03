
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User = require("../../database/models/User");

const SIZE = 5;
const BOMBS = 5;
const MAX_BET = 100000;

// ==========================================
// 🎯 HELPERS
// ==========================================

function randomBombs() {
    const positions = [];

    while (positions.length < BOMBS) {
        const position =
            Math.floor(Math.random() * (SIZE * SIZE));

        if (!positions.includes(position)) {
            positions.push(position);
        }
    }

    return positions;
}

function getMultiplier(safeCount) {
    const multipliers = [
        1.00,
        1.15,
        1.30,
        1.50,
        1.75,
        2.10,
        2.55,
        3.10,
        3.80,
        4.75,
        6.00,
        7.50,
        9.50,
        12.00,
        15.00,
        20.00,
        27.00,
        36.00,
        50.00,
        70.00,
        100.00
    ];

    return (
        multipliers[safeCount] ||
        multipliers[multipliers.length - 1]
    );
}

function createBoard(game, revealAll = false) {
    const rows = [];

    for (let row = 0; row < SIZE; row++) {
        const actionRow =
            new ActionRowBuilder();

        for (let col = 0; col < SIZE; col++) {
            const index =
                row * SIZE + col;

            const isBomb =
                game.bombs.includes(index);

            const revealed =
                game.revealed.includes(index);

            let label = "💠";

            if (revealAll && isBomb) {
                label = "💣";
            } else if (revealed) {
                label = "💎";
            }

            const button =
                new ButtonBuilder()
                    .setCustomId(
                        `bomb_tile_${game.userId}_${index}`
                    )
                    .setLabel(label)
                    .setStyle(
                        revealed || (revealAll && isBomb)
                            ? ButtonStyle.Secondary
                            : ButtonStyle.Primary
                    )
                    .setDisabled(
                        revealed ||
                        revealAll ||
                        game.finished
                    );

            actionRow.addComponents(button);
        }

        rows.push(actionRow);
    }

    return rows;
}

function createControlRow(game) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `bomb_cashout_${game.userId}`
                )
                .setLabel(
                    `Rút ${Math.floor(
                        game.bet *
                        getMultiplier(
                            game.revealed.length
                        )
                    ).toLocaleString()} Mora`
                )
                .setEmoji("💰")
                .setStyle(
                    ButtonStyle.Success
                )
                .setDisabled(
                    game.revealed.length === 0 ||
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
                .setDisabled(game.finished)
        );
}

function createEmbed(game) {
    const multiplier =
        getMultiplier(
            game.revealed.length
        );

    const potential =
        Math.floor(
            game.bet * multiplier
        );

    return new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("💣 Dò Bom")
        .setDescription(
            "Chọn từng ô để tìm 💎.\n" +
            "Nếu chọn trúng 💣, bạn mất tiền cược.\n\n" +

            `💸 Cược: **${game.bet.toLocaleString()} Mora**\n` +
            `💎 Ô an toàn: **${game.revealed.length}**\n` +
            `📈 Multiplier: **x${multiplier}**\n` +
            `💰 Có thể nhận: **${potential.toLocaleString()} Mora**`
        )
        .setFooter({
            text:
                "💣 Càng dò nhiều ô, phần thưởng càng lớn!"
        });
}

// ==========================================
// 💣 COMMAND
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

    async execute(message, args) {
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(userId);

        let bet =
            parseInt(args[0], 10);

        if (
            !Number.isInteger(bet) ||
            bet <= 0
        ) {
            return message.reply(
                "💣 Dùng: `Vbomb <số tiền>`\n" +
                "Ví dụ: `Vbomb 1000`"
            );
        }

        if (bet > MAX_BET) {
            return message.reply(
                `💣 Cược tối đa là **${MAX_BET.toLocaleString()} Mora**.`
            );
        }

        if (
            Number(user.balance || 0) <
            bet
        ) {
            return message.reply(
                `💸 Bạn không đủ Mora.\n` +
                `Cần: **${bet.toLocaleString()}**\n` +
                `Có: **${Number(
                    user.balance || 0
                ).toLocaleString()}**`
            );
        }

        // Trừ tiền cược
        User.removeBalance(
            userId,
            bet
        );

        const game = {
            userId,
            bet,
            bombs: randomBombs(),
            revealed: [],
            finished: false
        };

        const msg =
            await message.reply({
                embeds: [
                    createEmbed(game)
                ],
                components: [
                    ...createBoard(game),
                    createControlRow(game)
                ]
            });

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

                    if (game.finished) {
                        return interaction.reply({
                            content:
                                "❌ Ván chơi đã kết thúc.",
                            ephemeral: true
                        });
                    }

                    // ==================================
                    // 💰 CASH OUT
                    // ==================================

                    if (
                        interaction.customId ===
                        `bomb_cashout_${userId}`
                    ) {
                        if (
                            game.revealed.length === 0
                        ) {
                            return interaction.reply({
                                content:
                                    "💣 Hãy dò ít nhất 1 ô trước khi rút.",
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

                        game.finished = true;

                        User.addBalance(
                            userId,
                            reward
                        );

                        const profit =
                            reward - game.bet;

                        const embed =
                            new EmbedBuilder()
                                .setColor("#57F287")
                                .setTitle(
                                    "💰 Rút tiền thành công!"
                                )
                                .setDescription(
                                    `💎 Bạn đã dò **${game.revealed.length} ô an toàn**.\n\n` +
                                    `📈 Multiplier: **x${multiplier}**\n` +
                                    `💰 Nhận: **+${reward.toLocaleString()} Mora**\n` +
                                    `📊 Lãi: **${profit >= 0 ? "+" : ""}${profit.toLocaleString()} Mora**`
                                )
                                .setFooter({
                                    text:
                                        "💣 Dò Bom • Venti"
                                });

                        await interaction.update({
                            embeds: [embed],
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

                    // ==================================
                    // 🛑 STOP
                    // ==================================

                    if (
                        interaction.customId ===
                        `bomb_stop_${userId}`
                    ) {
                        game.finished = true;

                        const embed =
                            new EmbedBuilder()
                                .setColor("#95A5A6")
                                .setTitle(
                                    "🛑 Đã dừng ván chơi"
                                )
                                .setDescription(
                                    `💎 Ô an toàn: **${game.revealed.length}**\n` +
                                    `💸 Tiền cược đã mất: **${game.bet.toLocaleString()} Mora**`
                                );

                        await interaction.update({
                            embeds: [embed],
                            components:
                                createBoard(
                                    game,
                                    true
                                )
                        });

                        collector.stop(
                            "stopped"
                        );

                        return;
                    }

                    // ==================================
                    // 💠 TILE
                    // ==================================

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
                        !Number.isInteger(index) ||
                        index < 0 ||
                        index >= SIZE * SIZE
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
                                "💎 Ô này đã được dò.",
                            ephemeral: true
                        });
                    }

                    // ==================================
                    // 💣 BOMB
                    // ==================================

                    if (
                        game.bombs.includes(
                            index
                        )
                    ) {
                        game.finished = true;

                        const embed =
                            new EmbedBuilder()
                                .setColor("#ED4245")
                                .setTitle(
                                    "💣 BOOM!"
                                )
                                .setDescription(
                                    `Bạn đã chọn trúng **💣 bom**!\n\n` +
                                    `💎 Ô an toàn: **${game.revealed.length}**\n` +
                                    `💸 Mất cược: **${game.bet.toLocaleString()} Mora**\n\n` +
                                    "🍃 Lần sau cẩn thận hơn nhé!"
                                )
                                .setFooter({
                                    text:
                                        "💣 Dò Bom • Venti"
                                });

                        await interaction.update({
                            embeds: [embed],
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

                    // ==================================
                    // 💎 SAFE
                    // ==================================

                    game.revealed.push(
                        index
                    );

                    // Người chơi đã mở hết ô an toàn
                    const safeTiles =
                        SIZE * SIZE -
                        BOMBS;

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

                        game.finished = true;

                        User.addBalance(
                            userId,
                            reward
                        );

                        const embed =
                            new EmbedBuilder()
                                .setColor("#F1C40F")
                                .setTitle(
                                    "🏆 Dò sạch bàn!"
                                )
                                .setDescription(
                                    `💎 Bạn đã tìm thấy **tất cả ${safeTiles} ô an toàn**!\n\n` +
                                    `📈 Multiplier: **x${multiplier}**\n` +
                                    `💰 Nhận: **+${reward.toLocaleString()} Mora**`
                                );

                        await interaction.update({
                            embeds: [embed],
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

                    await interaction.update({
                        embeds: [
                            createEmbed(game)
                        ],
                        components: [
                            ...createBoard(game),
                            createControlRow(game)
                        ]
                    });
                } catch (error) {
                    console.error(
                        "Bomb interaction error:",
                        error
                    );

                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {
                        try {
                            await interaction.reply({
                                content:
                                    "❌ Có lỗi xảy ra khi xử lý lượt chơi.",
                                ephemeral: true
                            });
                        } catch {}
                    }
                }
            }
        );

        collector.on(
            "end",
            async () => {
                if (game.finished) {
                    return;
                }

                game.finished = true;

                try {
                    await msg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#95A5A6")
                                .setTitle(
                                    "⏰ Ván chơi hết thời gian"
                                )
                                .setDescription(
                                    "💣 Bạn không hoàn thành ván chơi.\n" +
                                    `💸 Mất cược: **${game.bet.toLocaleString()} Mora**`
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

