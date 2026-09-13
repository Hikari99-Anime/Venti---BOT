
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 🎮 CHOICES
// ==========================================

const choices = {
    rock: {
        label: "Kéo",
        emoji: "✊"
    },

    paper: {
        label: "Bao",
        emoji: "✋"
    },

    scissors: {
        label: "Búa",
        emoji: "✌️"
    }
};

// ==========================================
// 🏆 RESULT
// ==========================================

function getResult(player, opponent) {

    if (
        player === opponent
    ) {
        return "draw";
    }

    if (
        (player === "rock" &&
            opponent === "scissors") ||

        (player === "paper" &&
            opponent === "rock") ||

        (player === "scissors" &&
            opponent === "paper")
    ) {
        return "win";
    }

    return "lose";
}

// ==========================================
// 💰 MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 📊 STATS
// ==========================================

function updateStats(
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

    return stats;
}

// ==========================================
// 📊 GET STATS
// ==========================================

function getStats(
    userId
) {

    const user =
        User.getOrCreate(
            userId
        );

    const stats =
        user.stats || {};

    return {
        games:
            Number(
                stats.games || 0
            ),

        wins:
            Number(
                stats.wins || 0
            ),

        losses:
            Number(
                stats.losses || 0
            )
    };
}

// ==========================================
// 🎮 CHOICE BUTTONS
// ==========================================

function createChoiceRow(
    gameId,
    userId
) {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `rps_choose_${gameId}_${userId}_rock`
                )
                .setLabel(
                    "Kéo"
                )
                .setEmoji(
                    "✊"
                )
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    `rps_choose_${gameId}_${userId}_paper`
                )
                .setLabel(
                    "Bao"
                )
                .setEmoji(
                    "✋"
                )
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    `rps_choose_${gameId}_${userId}_scissors`
                )
                .setLabel(
                    "Búa"
                )
                .setEmoji(
                    "✌️"
                )
                .setStyle(
                    ButtonStyle.Primary
                )
        );
}

// ==========================================
// 📩 INVITE BUTTONS
// ==========================================

function createInviteRow(
    gameId
) {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `rps_accept_${gameId}`
                )
                .setLabel(
                    "Chấp nhận"
                )
                .setEmoji(
                    "✅"
                )
                .setStyle(
                    ButtonStyle.Success
                ),

            new ButtonBuilder()
                .setCustomId(
                    `rps_decline_${gameId}`
                )
                .setLabel(
                    "Từ chối"
                )
                .setEmoji(
                    "❌"
                )
                .setStyle(
                    ButtonStyle.Danger
                ),

            new ButtonBuilder()
                .setCustomId(
                    `rps_cancel_${gameId}`
                )
                .setLabel(
                    "Hủy"
                )
                .setEmoji(
                    "🛑"
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

// ==========================================
// 🎮 CREATE GAME
// ==========================================

function createGameId() {

    return (
        Date.now()
            .toString(36) +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}

// ==========================================
// 📊 RESULT EMBED
// ==========================================

function createResultEmbed(
    winner,
    loser,
    draw,
    bet,
    reward,
    playerChoice,
    opponentChoice
) {

    let color =
        "#ED4245";

    let title =
        "💀 Kéo • Búa • Bao";

    let resultText =
        `> 💸 Bạn mất **${money(bet)} Mora**`;

    if (
        draw
    ) {

        color =
            "#FEE75C";

        title =
            "🤝 Kéo • Búa • Bao • Hòa";

        resultText =
            `> 💰 Hoàn lại **${money(reward)} Mora**`;
    }

    if (
        winner
    ) {

        color =
            "#57F287";

        title =
            "🎉 Kéo • Búa • Bao • Thắng";

        resultText =
            `> 💰 Nhận **+${money(reward)} Mora**`;
    }

    const stats =
        getStats(
            winner || loser
        );

    return new EmbedBuilder()

        .setColor(
            color
        )

        .setTitle(
            title
        )

        .setDescription(

            `> ${choices[playerChoice].emoji} Bạn: **${choices[playerChoice].label}**\n` +

            `> ${choices[opponentChoice].emoji} Đối thủ: **${choices[opponentChoice].label}**\n\n` +

            "────────────────────\n" +

            `${resultText}\n\n` +

            `### 📊 Stats\n` +

            `> 🎮 Games: **${stats.games}**\n` +

            `> 🏆 Wins: **${stats.wins}**\n` +

            `> 💀 Losses: **${stats.losses}**`
        )

        .setFooter({
            text:
                "🍃 Venti • Kéo Búa Bao"
        })

        .setTimestamp();
}

// ==========================================
// 🎮 COMMAND
// ==========================================

module.exports = {

    name:
        "rps",

    aliases: [
        "rockpaperscissors",
        "keobao",
        "vrps"
    ],

    description:
        "Chơi Kéo Búa Bao với Venti hoặc người chơi khác.",

    async execute(
        message,
        args
    ) {

        const userId =
            message.author.id;

        // ======================================
        // 👤 FIND MENTION
        // ======================================

        const opponent =
            message.mentions.users.first();

        // ======================================
        // 💰 PARSE BET
        // ======================================

        let bet;

        if (
            opponent
        ) {

            // Vrps @user 1000
            bet =
                parseInt(
                    args[
                        args.length - 1
                    ],
                    10
                );

        } else {

            // Vrps 1000
            bet =
                parseInt(
                    args[0],
                    10
                );
        }

        bet =
            Math.max(
                1,
                bet || 100
            );

        // ======================================
        // ❌ SELF
        // ======================================

        if (
            opponent &&
            opponent.id === userId
        ) {

            return message.reply(
                "❌ Bạn không thể thách đấu chính mình."
            );
        }

        // ======================================
        // ❌ BOT
        // ======================================

        if (
            opponent &&
            opponent.bot
        ) {

            return message.reply(
                "❌ Bạn không thể thách đấu bot."
            );
        }

        // ======================================
        // 💰 PLAYER
        // ======================================

        const user =
            User.getOrCreate(
                userId
            );

        if (
            Number(
                user.balance || 0
            ) < bet
        ) {

            return message.reply(
                `❌ Bạn không đủ Mora.\n\n` +

                `> 💰 Cần: **${money(bet)}**\n` +

                `> 🪙 Có: **${money(user.balance)}**`
            );
        }

        // ======================================
        // 🤖 BOT GAME
        // ======================================

        if (
            !opponent
        ) {

            User.removeBalance(
                userId,
                bet
            );

            const row =
                createChoiceRow(
                    createGameId(),
                    userId
                );

            const gameId =
                row.components[0]
                    .data.custom_id
                    .split("_")[2];

            const embed =
                new EmbedBuilder()

                    .setColor(
                        "#9B59B6"
                    )

                    .setTitle(
                        "🎮 Kéo • Búa • Bao"
                    )

                    .setDescription(

                        `> 💰 Cược: **${money(bet)} Mora**\n\n` +

                        "Chọn nước đi của bạn:\n\n" +

                        "✊ **Kéo**\n" +
                        "✋ **Bao**\n" +
                        "✌️ **Búa**"
                    )

                    .setFooter({
                        text:
                            "🍃 Venti • Kéo Búa Bao"
                    });

            const msg =
                await message.reply({
                    embeds: [
                        embed
                    ],
                    components: [
                        row
                    ]
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
                                "❌ Đây không phải game của bạn.",
                            ephemeral:
                                true
                        });
                    }

                    const parts =
                        interaction.customId.split(
                            "_"
                        );

                    const player =
                        parts[4];

                    const botChoices =
                        Object.keys(
                            choices
                        );

                    const bot =
                        botChoices[
                            Math.floor(
                                Math.random() *
                                botChoices.length
                            )
                        ];

                    const result =
                        getResult(
                            player,
                            bot
                        );

                    updateStats(
                        userId,
                        result
                    );

                    let reward =
                        0;

                    if (
                        result === "win"
                    ) {

                        reward =
                            bet * 2;

                        User.addBalance(
                            userId,
                            reward
                        );
                    }

                    if (
                        result === "draw"
                    ) {

                        reward =
                            bet;

                        User.addBalance(
                            userId,
                            reward
                        );
                    }

                    collector.stop(
                        "finished"
                    );

                    const stats =
                        getStats(
                            userId
                        );

                    let color =
                        "#ED4245";

                    let title =
                        "💀 Bạn thua!";

                    let moneyText =
                        `> 💸 Mất **${money(bet)} Mora**`;

                    if (
                        result === "win"
                    ) {

                        color =
                            "#57F287";

                        title =
                            "🎉 Bạn thắng!";

                        moneyText =
                            `> 💰 Nhận **+${money(reward)} Mora**`;
                    }

                    if (
                        result === "draw"
                    ) {

                        color =
                            "#FEE75C";

                        title =
                            "🤝 Hòa!";

                        moneyText =
                            `> 💰 Hoàn lại **${money(reward)} Mora**`;
                    }

                    return interaction.update({

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    color
                                )

                                .setTitle(
                                    title
                                )

                                .setDescription(

                                    `> ${choices[player].emoji} Bạn: **${choices[player].label}**\n` +

                                    `> ${choices[bot].emoji} Venti: **${choices[bot].label}**\n\n` +

                                    "────────────────────\n" +

                                    `${moneyText}\n\n` +

                                    "### 📊 Stats\n" +

                                    `> 🎮 Games: **${stats.games}**\n` +

                                    `> 🏆 Wins: **${stats.wins}**\n` +

                                    `> 💀 Losses: **${stats.losses}**`
                                )

                                .setFooter({
                                    text:
                                        "🍃 Venti • Kéo Búa Bao"
                                })

                                .setTimestamp()
                        ],

                        components: []
                    });
                }
            );

            collector.on(
                "end",
                async () => {

                    try {

                        await msg.edit({
                            components: []
                        });

                    } catch {}
                }
            );

            return;
        }

        // ======================================
        // ⚔️ PVP INVITE
        // ======================================

        const opponentUser =
            User.getOrCreate(
                opponent.id
            );

        if (
            Number(
                opponentUser.balance || 0
            ) < bet
        ) {

            return message.reply(
                `❌ <@${opponent.id}> không đủ Mora để tham gia.\n\n` +

                `> 💰 Cần: **${money(bet)} Mora**`
            );
        }

        const gameId =
            createGameId();

        const inviteEmbed =
            new EmbedBuilder()

                .setColor(
                    "#9B59B6"
                )

                .setTitle(
                    "⚔️ Lời mời Kéo • Búa • Bao"
                )

                .setDescription(

                    `### <@${userId}> thách đấu <@${opponent.id}>\n\n` +

                    `> 💰 Cược mỗi người: **${money(bet)} Mora**\n\n` +

                    "Người được mời hãy chọn:\n" +

                    "✅ **Chấp nhận** để bắt đầu\n" +

                    "❌ **Từ chối** để hủy\n" +

                    "🛑 **Hủy** dành cho người thách đấu"
                )

                .setFooter({
                    text:
                        "🍃 Venti • PvP Kéo Búa Bao"
                })

                .setTimestamp();

        const inviteMsg =
            await message.reply({

                embeds: [
                    inviteEmbed
                ],

                components: [
                    createInviteRow(
                        gameId
                    )
                ]
            });

        const inviteCollector =
            inviteMsg.createMessageComponentCollector({
                time:
                    30000
            });

        inviteCollector.on(
            "collect",
            async interaction => {

                // ==================================
                // ❌ DECLINE
                // ==================================

                if (
                    interaction.customId ===
                    `rps_decline_${gameId}`
                ) {

                    if (
                        interaction.user.id !==
                        opponent.id
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Chỉ người được mời mới có thể từ chối.",
                            ephemeral:
                                true
                        });
                    }

                    inviteCollector.stop(
                        "declined"
                    );

                    return interaction.update({

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    "#ED4245"
                                )

                                .setTitle(
                                    "❌ Lời mời bị từ chối"
                                )

                                .setDescription(
                                    `> <@${opponent.id}> đã từ chối lời thách đấu.\n\n` +
                                    `> 💰 Cược: **${money(bet)} Mora**`
                                )

                                .setFooter({
                                    text:
                                        "🍃 Venti • PvP"
                                })
                        ],

                        components: []
                    });
                }

                // ==================================
                // 🛑 CANCEL
                // ==================================

                if (
                    interaction.customId ===
                    `rps_cancel_${gameId}`
                ) {

                    if (
                        interaction.user.id !==
                        userId
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Chỉ người thách đấu mới có thể hủy.",
                            ephemeral:
                                true
                        });
                    }

                    inviteCollector.stop(
                        "cancelled"
                    );

                    return interaction.update({

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    "#95A5A6"
                                )

                                .setTitle(
                                    "🛑 Đã hủy lời mời"
                                )

                                .setDescription(
                                    `> <@${userId}> đã hủy lời thách đấu.`
                                )

                                .setFooter({
                                    text:
                                        "🍃 Venti • PvP"
                                })
                        ],

                        components: []
                    });
                }

                // ==================================
                // ✅ ACCEPT
                // ==================================

                if (
                    interaction.customId ===
                    `rps_accept_${gameId}`
                ) {

                    if (
                        interaction.user.id !==
                        opponent.id
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Chỉ người được mời mới có thể chấp nhận.",
                            ephemeral:
                                true
                        });
                    }

                    // Kiểm tra lại tiền
                    const challenger =
                        User.getOrCreate(
                            userId
                        );

                    const challenged =
                        User.getOrCreate(
                            opponent.id
                        );

                    if (
                        Number(
                            challenger.balance || 0
                        ) < bet ||
                        Number(
                            challenged.balance || 0
                        ) < bet
                    ) {

                        inviteCollector.stop(
                            "money"
                        );

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
                                        "> Một trong hai người chơi không còn đủ Mora để tham gia."
                                    )

                                    .setFooter({
                                        text:
                                            "🍃 Venti • PvP"
                                    })
                            ],

                            components: []
                        });
                    }

                    // Trừ cược
                    User.removeBalance(
                        userId,
                        bet
                    );

                    User.removeBalance(
                        opponent.id,
                        bet
                    );

                    inviteCollector.stop(
                        "accepted"
                    );

                    const game = {

                        id:
                            gameId,

                        player1:
                            userId,

                        player2:
                            opponent.id,

                        bet,

                        choices: {},

                        finished:
                            false
                    };

                    const pvpEmbed =
                        new EmbedBuilder()

                            .setColor(
                                "#5865F2"
                            )

                            .setTitle(
                                "⚔️ PvP • Kéo • Búa • Bao"
                            )

                            .setDescription(

                                `### <@${userId}> ⚔️ <@${opponent.id}>\n\n` +

                                `> 💰 Cược mỗi người: **${money(bet)} Mora**\n\n` +

                                "Cả hai người hãy chọn nước đi:\n\n" +

                                "✊ **Kéo**\n" +
                                "✋ **Bao**\n" +
                                "✌️ **Búa**"
                            )

                            .setFooter({
                                text:
                                    "🍃 Venti • PvP"
                            })

                            .setTimestamp();

                    const gameMsg =
                        await interaction.update({

                            embeds: [
                                pvpEmbed
                            ],

                            components: [

                                createChoiceRow(
                                    gameId,
                                    userId
                                ),

                                createChoiceRow(
                                    gameId,
                                    opponent.id
                                )
                            ]
                        });

                    // ==================================
                    // 🎮 GAME COLLECTOR
                    // ==================================

                    const gameCollector =
                        inviteMsg.createMessageComponentCollector({
                            time:
                                60000
                        });

                    gameCollector.on(
                        "collect",
                        async gameInteraction => {

                            const prefix =
                                `rps_choose_${gameId}_`;

                            if (
                                !gameInteraction.customId.startsWith(
                                    prefix
                                )
                            ) {
                                return;
                            }

                            const parts =
                                gameInteraction.customId.split(
                                    "_"
                                );

                            const targetUser =
                                parts[3];

                            const playerChoice =
                                parts[4];

                            if (
                                gameInteraction.user.id !==
                                targetUser
                            ) {

                                return gameInteraction.reply({
                                    content:
                                        "❌ Bạn không thể chọn nước đi của người khác.",
                                    ephemeral:
                                        true
                                });
                            }

                            if (
                                game.choices[
                                    targetUser
                                ]
                            ) {

                                return gameInteraction.reply({
                                    content:
                                        "❌ Bạn đã chọn rồi.",
                                    ephemeral:
                                        true
                                });
                            }

                            game.choices[
                                targetUser
                            ] =
                                playerChoice;

                            // Chưa đủ 2 người
                            if (
                                !game.choices[
                                    game.player1
                                ] ||
                                !game.choices[
                                    game.player2
                                ]
                            ) {

                                return gameInteraction.update({

                                    embeds: [

                                        new EmbedBuilder()

                                            .setColor(
                                                "#5865F2"
                                            )

                                            .setTitle(
                                                "⚔️ PvP • Đang chờ lựa chọn"
                                            )

                                            .setDescription(

                                                `### <@${game.player1}> ⚔️ <@${game.player2}>\n\n` +

                                                `> 💰 Cược mỗi người: **${money(bet)} Mora**\n\n` +

                                                `${game.choices[game.player1] ? "✅" : "⏳"} <@${game.player1}>\n` +

                                                `${game.choices[game.player2] ? "✅" : "⏳"} <@${game.player2}>\n\n` +

                                                "Chọn nước đi của bạn."
                                            )

                                            .setFooter({
                                                text:
                                                    "🍃 Venti • PvP"
                                            })
                                    ],

                                    components: [

                                        createChoiceRow(
                                            gameId,
                                            game.player1
                                        ),

                                        createChoiceRow(
                                            gameId,
                                            game.player2
                                        )
                                    ]
                                });
                            }

                            // ==================================
                            // 🏆 RESULT
                            // ==================================

                            const player1Choice =
                                game.choices[
                                    game.player1
                                ];

                            const player2Choice =
                                game.choices[
                                    game.player2
                                ];

                            const result =
                                getResult(
                                    player1Choice,
                                    player2Choice
                                );

                            let reward =
                                0;

                            let winnerId =
                                null;

                            let loserId =
                                null;

                            if (
                                result === "win"
                            ) {

                                winnerId =
                                    game.player1;

                                loserId =
                                    game.player2;

                                reward =
                                    bet * 2;

                                User.addBalance(
                                    winnerId,
                                    reward
                                );

                                updateStats(
                                    winnerId,
                                    "win"
                                );

                                updateStats(
                                    loserId,
                                    "lose"
                                );

                            } else if (
                                result === "lose"
                            ) {

                                winnerId =
                                    game.player2;

                                loserId =
                                    game.player1;

                                reward =
                                    bet * 2;

                                User.addBalance(
                                    winnerId,
                                    reward
                                );

                                updateStats(
                                    winnerId,
                                    "win"
                                );

                                updateStats(
                                    loserId,
                                    "lose"
                                );

                            } else {

                                reward =
                                    bet;

                                User.addBalance(
                                    game.player1,
                                    bet
                                );

                                User.addBalance(
                                    game.player2,
                                    bet
                                );

                                updateStats(
                                    game.player1,
                                    "draw"
                                );

                                updateStats(
                                    game.player2,
                                    "draw"
                                );
                            }

                            game.finished =
                                true;

                            gameCollector.stop(
                                "finished"
                            );

                            const resultColor =
                                result === "draw"
                                    ? "#FEE75C"
                                    : "#57F287";

                            const resultTitle =
                                result === "draw"
                                    ? "🤝 PvP • Hòa"
                                    : "🏆 PvP • Kết quả";

                            const p1Stats =
                                getStats(
                                    game.player1
                                );

                            const p2Stats =
                                getStats(
                                    game.player2
                                );

                            const resultDescription =

                                `### <@${game.player1}>\n` +

                                `> ${choices[player1Choice].emoji} **${choices[player1Choice].label}**\n` +

                                `> 🎮 Games: **${p1Stats.games}** • 🏆 **${p1Stats.wins}** • 💀 **${p1Stats.losses}**\n\n` +

                                `### <@${game.player2}>\n` +

                                `> ${choices[player2Choice].emoji} **${choices[player2Choice].label}**\n` +

                                `> 🎮 Games: **${p2Stats.games}** • 🏆 **${p2Stats.wins}** • 💀 **${p2Stats.losses}**\n\n` +

                                "────────────────────\n" +

                                (
                                    result === "draw"
                                        ? `> 🤝 Hòa! Mỗi người được hoàn **${money(bet)} Mora**.`
                                        : `> 🏆 <@${winnerId}> thắng!\n> 💰 Nhận **+${money(reward)} Mora**`
                                );

                            return gameInteraction.update({

                                embeds: [

                                    new EmbedBuilder()

                                        .setColor(
                                            resultColor
                                        )

                                        .setTitle(
                                            resultTitle
                                        )

                                        .setDescription(
                                            resultDescription
                                        )

                                        .setFooter({
                                            text:
                                                "🍃 Venti • PvP Kéo Búa Bao"
                                        })

                                        .setTimestamp()
                                ],

                                components: []
                            });
                        }
                    );
                }
            }
        );

        // ======================================
        // ⏰ INVITE TIMEOUT
        // ======================================

        inviteCollector.on(
            "end",
            async (_, reason) => {

                if (
                    reason === "accepted" ||
                    reason === "declined" ||
                    reason === "cancelled" ||
                    reason === "money"
                ) {
                    return;
                }

                try {

                    await inviteMsg.edit({

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    "#95A5A6"
                                )

                                .setTitle(
                                    "⏰ Lời mời hết hạn"
                                )

                                .setDescription(
                                    `> <@${opponent.id}> không phản hồi lời thách đấu.\n\n` +
                                    `> 💰 Cược: **${money(bet)} Mora**`
                                )

                                .setFooter({
                                    text:
                                        "🍃 Venti • PvP"
                                })
                        ],

                        components: []
                    });

                } catch {}
            }
        );
    }
};

