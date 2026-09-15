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
// 💣 CONFIG
// ==========================================

const SIZE = 4;
const BOMBS = 4;
const MAX_BET = 100000;

// ==========================================
// 🎨 COLORS
// ==========================================

const COLORS = {
    primary: 0x9ccfd8,
    success: 0xa8d8a8,
    warning: 0xffd166,
    error: 0xf2a7a7,
    neutral: 0x95a5a6
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
// 🧱 COMPONENTS V2 HEADER
// ==========================================

function createHeader(
    title,
    color
) {
    const container =
        new ContainerBuilder()
            .setAccentColor(color);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ${title}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    return container;
}

// ==========================================
// 📋 GAME COMPONENT
// ==========================================

function createGameComponents(
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

    const container =
        createHeader(
            "💣 BOMB GAME",
            COLORS.primary
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                "### 💰 Tiền cược",
                `> **${money(game.bet)} Mora**`,
                "",
                "### 💎 Ô an toàn",
                `> **${game.revealed.length}**`,
                "",
                "### 📈 Multiplier",
                `> **x${multiplier}**`,
                "",
                "### 💵 Có thể nhận",
                `> **${money(reward)} Mora**`
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                "💠 **Chọn ô** để tìm đá quý",
                "💣 **Trúng bom** sẽ mất cược",
                "💎 **Mở càng nhiều ô** → thưởng càng cao"
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "Columbina • Dò Bom"
        )
    );

    return container;
}

// ==========================================
// 💰 CASHOUT COMPONENT
// ==========================================

function createCashoutComponents(
    game,
    multiplier,
    reward,
    profit
) {
    const container =
        createHeader(
            "💰 BOMB GAME • CASH OUT",
            COLORS.success
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                "### 💎 Ô an toàn",
                `> **${game.revealed.length}**`,
                "",
                "### 📈 Multiplier",
                `> **x${multiplier}**`,
                "",
                "### 💰 Nhận được",
                `> **+${money(reward)} Mora**`,
                "",
                "### 📊 Lợi nhuận",
                `> **${profit >= 0 ? "+" : ""}${money(profit)} Mora**`
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "Columbina • Dò Bom"
        )
    );

    return container;
}

// ==========================================
// 💣 BOOM COMPONENT
// ==========================================

function createBoomComponents(
    game
) {
    const container =
        createHeader(
            "💣 BOMB GAME • KẾT THÚC",
            COLORS.error
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                "### 💣 Kết quả",
                "> Bạn đã chọn trúng bom.",
                "",
                "### 💎 Ô an toàn",
                `> **${game.revealed.length}**`,
                "",
                "### 💸 Mất cược",
                `> **-${money(game.bet)} Mora**`,
                "",
                "> 🌙 Cẩn thận hơn ở ván sau nhé."
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "Columbina • Dò Bom"
        )
    );

    return container;
}

// ==========================================
// 🏆 WIN COMPONENT
// ==========================================

function createWinComponents(
    game,
    multiplier,
    reward
) {
    const safeTiles =
        SIZE * SIZE - BOMBS;

    const container =
        createHeader(
            "🏆 BOMB GAME • HOÀN THÀNH",
            COLORS.warning
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                "### 💎 Ô an toàn",
                `> **${game.revealed.length}/${safeTiles}**`,
                "",
                "### 📈 Multiplier",
                `> **x${multiplier}**`,
                "",
                "### 💰 Nhận được",
                `> **+${money(reward)} Mora**`,
                "",
                "> 🏆 Bạn đã tìm thấy toàn bộ ô an toàn!"
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "Columbina • Dò Bom"
        )
    );

    return container;
}

// ==========================================
// 🛑 STOP COMPONENT
// ==========================================

function createStopComponents(
    game
) {
    const container =
        createHeader(
            "🛑 BOMB GAME • ĐÃ DỪNG",
            COLORS.neutral
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                "### 💎 Ô an toàn",
                `> **${game.revealed.length}**`,
                "",
                "### 💸 Mất cược",
                `> **-${money(game.bet)} Mora**`
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "Columbina • Dò Bom"
        )
    );

    return container;
}

// ==========================================
// ⏰ TIMEOUT COMPONENT
// ==========================================

function createTimeoutComponents(
    game
) {
    const container =
        createHeader(
            "⏰ BOMB GAME • HẾT THỜI GIAN",
            COLORS.neutral
        );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                "### ⏰ Trạng thái",
                "> Ván chơi đã hết thời gian.",
                "",
                "### 💸 Mất cược",
                `> **-${money(game.bet)} Mora**`
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "Columbina • Dò Bom"
        )
    );

    return container;
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

        // ==================================
        // 📦 INITIAL MESSAGE
        // ==================================

        const msg =
            await message.reply({

                flags:
                    MessageFlags.IsComponentsV2,

                components: [
                    createGameComponents(
                        game
                    ),
                    ...createBoard(
                        game
                    )
                ]
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

                            flags:
                                MessageFlags.IsComponentsV2,

                            components: [
                                createCashoutComponents(
                                    game,
                                    multiplier,
                                    reward,
                                    profit
                                ),
                                ...createBoard(
                                    game,
                                    true
                                )
                            ]
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

                            flags:
                                MessageFlags.IsComponentsV2,

                            components: [
                                createStopComponents(
                                    game
                                ),
                                ...createBoard(
                                    game,
                                    true
                                )
                            ]
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

                            flags:
                                MessageFlags.IsComponentsV2,

                            components: [
                                createBoomComponents(
                                    game
                                ),
                                ...createBoard(
                                    game,
                                    true
                                )
                            ]
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

                            flags:
                                MessageFlags.IsComponentsV2,

                            components: [
                                createWinComponents(
                                    game,
                                    multiplier,
                                    reward
                                ),
                                ...createBoard(
                                    game,
                                    true
                                )
                            ]
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

                        flags:
                            MessageFlags.IsComponentsV2,

                        components: [
                            createGameComponents(
                                game
                            ),
                            ...createBoard(
                                game
                            )
                        ]
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

        // ==========================================
        // ⏰ TIMEOUT
        // ==========================================

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

                        flags:
                            MessageFlags.IsComponentsV2,

                        components: [
                            createTimeoutComponents(
                                game
                            ),
                            ...createBoard(
                                game,
                                true
                            )
                        ]
                    });

                } catch {}
            }
        );
    }
};
