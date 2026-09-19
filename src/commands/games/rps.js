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
// 🎮 CHOICES
// ==========================================

const choices = {
    rock: {
        label: "Búa",
        emoji: "✊"
    },

    paper: {
        label: "Bao",
        emoji: "✋"
    },

    scissors: {
        label: "Kéo",
        emoji: "✌️"
    }
};


// ==========================================
// 🎨 COLORS
// ==========================================

const COLORS = {
    primary: 0x9B59B6,
    pvp: 0x5865F2,
    success: 0x57F287,
    error: 0xED4245,
    warning: 0xFEE75C,
    neutral: 0x95A5A6
};

// ==========================================
// ⏰ TIME
// ==========================================

const BOT_GAME_TIMEOUT = 30_000;
const PVP_INVITE_TIMEOUT = 30_000;
const PVP_GAME_TIMEOUT = 60_000;

// ==========================================
// 💰 MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 🏆 RESULT
// ==========================================

function getResult(
    player,
    opponent
) {
    if (player === opponent) {
        return "draw";
    }

    if (
        (
            player === "rock" &&
            opponent === "scissors"
        ) ||
        (
            player === "paper" &&
            opponent === "rock"
        ) ||
        (
            player === "scissors" &&
            opponent === "paper"
        )
    ) {
        return "win";
    }

    return "lose";
}

// ==========================================
// 🎲 GAME ID
// ==========================================

function createGameId() {
    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}

// ==========================================
// 📊 UPDATE STATS
// ==========================================

function updateStats(
    userId,
    result
) {
    const user =
        User.getOrCreate(userId);

    const stats = {
        ...(user.stats || {})
    };

    stats.games =
        Number(
            stats.games || 0
        ) + 1;

    if (result === "win") {
        stats.wins =
            Number(
                stats.wins || 0
            ) + 1;
    }

    if (result === "lose") {
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
        User.getOrCreate(userId);

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
// 🧱 COMPONENT V2
// ==========================================

function createContainer(color, components) {
    const container = new ContainerBuilder()
        .setAccentColor(color);

    for (const component of components) {
        if (component instanceof TextDisplayBuilder) {
            container.addTextDisplayComponents(component);
            continue;
        }

        if (component instanceof SeparatorBuilder) {
            container.addSeparatorComponents(component);
            continue;
        }

        if (component instanceof ActionRowBuilder) {
            container.addActionRowComponents(component);
            continue;
        }

        throw new TypeError(
            `Unsupported container component: ${component?.constructor?.name || "Unknown"}`
        );
    }

    return container;
}

function text(content) {
    return new TextDisplayBuilder()
        .setContent(content);
}

function separator() {
    return new SeparatorBuilder();
}


// ==========================================
// 🎮 NÚT CHỌN KÉO BÚA BAO
// ==========================================

function createChoiceRow(gameId) {
    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(`rps_choose_${gameId}_rock`)
                .setLabel("Kéo")
                .setEmoji("✊")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`rps_choose_${gameId}_paper`)
                .setLabel("Bao")
                .setEmoji("✋")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`rps_choose_${gameId}_scissors`)
                .setLabel("Búa")
                .setEmoji("✌️")
                .setStyle(ButtonStyle.Primary)
        );
}


// ==========================================
// 📩 NÚT LỜI MỜI PVP
// ==========================================

function createInviteRow(gameId) {
    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(`rps_accept_${gameId}`)
                .setLabel("Chấp nhận")
                .setEmoji("✅")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`rps_decline_${gameId}`)
                .setLabel("Từ chối")
                .setEmoji("❌")
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId(`rps_cancel_${gameId}`)
                .setLabel("Hủy")
                .setEmoji("🛑")
                .setStyle(ButtonStyle.Secondary)
        );
}

// ==========================================
// 🤖 BOT GAME
// ==========================================

function createBotGameComponents(user, bet, gameId) {

    const name =
        user.globalName ||
        user.username;

    return [

        createContainer(
            COLORS.primary,
            [

                text(
                    `☁️ \`🍃\` **Một góc nhỏ của hành trình**\n\n` +

                    `- \`🎮\` **Kéo • Búa • Bao**\n` +
                    `> \`👤 Người chơi : ${name}\`\n` +
                    `> \`💰 Tiền cược  : ${money(bet)} Mora\`\n\n` +

                    `- \`🎯\` **Lựa chọn**\n` +
                    `> \`✊ Kéo\`\n` +
                    `> \`✋ Bao\`\n` +
                    `> \`✌️ Búa\`\n\n` +

                    `> ☁️ *Hãy chọn nước đi của bạn.*`
                ),

                separator(),

                text(
                    `> \`🍃\` **Columbina • Kéo Búa Bao**`
                )

            ]
        ),

        createChoiceRow(gameId)

    ];
}

// ==========================================
// ⚔️ PVP INVITE
// ==========================================

function createInviteComponents(
    challengerId,
    opponentId,
    bet,
    gameId
) {

    return [

        createContainer(
            COLORS.pvp,
            [

                text(
                    `☁️ \`⚔️\` **Một góc nhỏ của trận đấu**\n\n` +

                    `- \`🎮\` **Lời mời Kéo • Búa • Bao**\n` +
                    `> \`👤 Thách đấu : <@${challengerId}>\`\n` +
                    `> \`👤 Đối thủ   : <@${opponentId}>\`\n` +
                    `> \`💰 Tiền cược : ${money(bet)} Mora/người\`\n\n` +

                    `- \`📩\` **Lời mời**\n` +
                    `> <@${opponentId}> hãy chọn **Chấp nhận** để bắt đầu.\n` +
                    `> \`❌\` Từ chối lời mời.\n` +
                    `> \`🛑\` Hủy lời mời.\n\n` +

                    `> 🍃 *Một trận đấu công bằng giữa hai nhà lữ hành.*`
                ),

                separator(),

                text(
                    `> \`🍃\` **Columbina • PvP**`
                )

            ]
        ),

        createInviteRow(gameId)

    ];
}

// ==========================================
// ⚔️ PVP GAME
// ==========================================

function createPvpGameComponents(game, bet) {

    const p1 =
        game.choices[game.player1];

    const p2 =
        game.choices[game.player2];

    const p1Status =
        p1
            ? "✅ Đã chọn"
            : "⏳ Đang chọn";

    const p2Status =
        p2
            ? "✅ Đã chọn"
            : "⏳ Đang chọn";

    return [

        createContainer(
            COLORS.pvp,
            [

                text(
                    `☁️ \`⚔️\` **Một góc nhỏ của trận đấu**\n\n` +

                    `- \`🎮\` **Kéo • Búa • Bao**\n` +
                    `> \`👤 Người 1 : <@${game.player1}>\`\n` +
                    `> \`👤 Người 2 : <@${game.player2}>\`\n` +
                    `> \`💰 Tiền cược : ${money(bet)} Mora/người\`\n\n` +

                    `- \`📊\` **Trạng thái**\n` +
                    `> \`👤 Người 1 : ${p1Status}\`\n` +
                    `> \`👤 Người 2 : ${p2Status}\`\n\n` +

                    `> ☁️ *Mỗi người chỉ được chọn một lần.*`
                ),

                separator(),

                text(
                    `> \`🍃\` **Columbina • PvP Kéo Búa Bao**`
                )

            ]
        ),

        createChoiceRow(game.id)

    ];
}
// ==========================================
// 🏆 BOT RESULT
// ==========================================

function createBotResultComponents(
    userId,
    playerChoice,
    botChoice,
    result,
    bet,
    reward
) {

    let color = COLORS.error;
    let title = "💀 **Bạn đã thua!**";
    let moneyText =
        `\`💸\` Mất        : ${money(bet)} Mora`;

    if (result === "win") {

        color = COLORS.success;

        title = "🎉 **Bạn đã thắng!**";

        moneyText =
            `\`💰\` Nhận       : +${money(reward)} Mora`;
    }

    if (result === "draw") {

        color = COLORS.warning;

        title = "🤝 **Trận đấu hòa!**";

        moneyText =
            `\`💰\` Hoàn lại   : ${money(reward)} Mora`;
    }

    const stats =
        getStats(userId);

    return [

        createContainer(
            color,
            [

                text(
                    `☁️ \`🍃\` **Một góc nhỏ của hành trình**\n\n` +

                    `- \`🏆\` **Kết quả**\n` +
                    `> \`👤 Bạn   : ${choices[playerChoice].emoji} ${choices[playerChoice].label}\`\n` +
                    `> \`🤖 Columbina : ${choices[botChoice].emoji} ${choices[botChoice].label}\`\n\n` +

                    `> ${title}\n` +
                    `> ${moneyText}\n\n` +

                    `- \`📊\` **Thống kê**\n` +
                    `> \`🎮 Games   : ${stats.games}\`\n` +
                    `> \`🏆 Wins    : ${stats.wins}\`\n` +
                    `> \`💀 Losses  : ${stats.losses}\`\n\n` +

                    `> \`🍃\` **Columbina • Kéo Búa Bao**`
                )

            ]
        )

    ];
}

// ==========================================
// 🏆 PVP RESULT
// ==========================================

function createPvpResultComponents(
    game,
    result,
    bet,
    reward,
    winnerId
) {

    const p1Choice =
        game.choices[game.player1];

    const p2Choice =
        game.choices[game.player2];

    const p1Stats =
        getStats(game.player1);

    const p2Stats =
        getStats(game.player2);

    let color =
        COLORS.success;

    let resultText;

    if (result === "draw") {

        color =
            COLORS.warning;

        resultText =
            `🤝 **Trận đấu hòa!**\n` +
            `> \`💰\` Mỗi người nhận lại : ${money(bet)} Mora`;

    } else {

        resultText =
            `🏆 <@${winnerId}> **đã chiến thắng!**\n` +
            `> \`💰\` Phần thưởng       : +${money(reward)} Mora`;
    }

    return [

        createContainer(
            color,
            [

                text(
                    `☁️ \`🍃\` **Một góc nhỏ của trận đấu**\n\n` +

                    `- \`⚔️\` **Kết quả PvP**\n` +
                    `> \`👤 Người 1 : <@${game.player1}>\`\n` +
                    `> \`👤 Người 2 : <@${game.player2}>\`\n\n` +

                    `- \`🎮\` **Nước đi**\n` +
                    `> \`👤 Người 1 : ${choices[p1Choice].emoji} ${choices[p1Choice].label}\`\n` +
                    `> \`👤 Người 2 : ${choices[p2Choice].emoji} ${choices[p2Choice].label}\`\n\n` +

                    `${resultText}\n\n` +

                    `- \`📊\` **Thống kê**\n` +
                    `> \`👤 Người 1 : 🎮 ${p1Stats.games} • 🏆 ${p1Stats.wins} • 💀 ${p1Stats.losses}\`\n` +
                    `> \`👤 Người 2 : 🎮 ${p2Stats.games} • 🏆 ${p2Stats.wins} • 💀 ${p2Stats.losses}\`\n\n` +

                    `> \`🍃\` **Columbina • PvP Kéo Búa Bao**`
                )

            ]
        )

    ];
}   
// ==========================================
// ⏰ TIMEOUT
// ==========================================

function createTimeoutComponents(
    textContent,
    refunded = false
) {

    return [

        createContainer(
            COLORS.neutral,
            [

                text(
                    `☁️ \`🍃\` **Một góc nhỏ của hành trình**\n\n` +

                    `- \`⏰\` **Hết thời gian**\n` +
                    `> ${textContent}\n\n` +

                    `- \`💰\` **Tài chính**\n` +
                    `> \`💵 Tiền cược : ${refunded ? "Đã hoàn lại" : "Đã mất"}\`\n\n` +

                    `> \`🍃\` **Columbina • Kéo Búa Bao**`
                )

            ]
        )

    ];
}

// ==========================================
// ❌ DECLINED
// ==========================================

function createDeclinedComponents(
    opponentId,
    bet
) {

    return [

        createContainer(
            COLORS.error,
            [

                text(
                    `☁️ \`🍃\` **Một góc nhỏ của hành trình**\n\n` +

                    `- \`❌\` **Lời mời bị từ chối**\n` +
                    `> <@${opponentId}> đã từ chối lời thách đấu.\n\n` +

                    `- \`💰\` **Tài chính**\n` +
                    `> \`💵 Tiền cược : ${money(bet)} Mora/người\`\n\n` +

                    `> \`🍃\` **Columbina • PvP**`
                )

            ]
        )

    ];
}

// ==========================================
// 🛑 CANCEL
// ==========================================

function createCancelComponents(userId) {

    return [

        createContainer(
            COLORS.neutral,
            [

                text(
                    `☁️ \`🍃\` **Một góc nhỏ của hành trình**\n\n` +

                    `- \`🛑\` **Đã hủy lời mời**\n` +
                    `> <@${userId}> đã hủy lời thách đấu.\n\n` +

                    `> \`🍃\` **Columbina • PvP**`
                )

            ]
        )

    ];
}


// ==========================================
// ❌ MONEY ERROR
// ==========================================

function createMoneyErrorComponents() {

    return [

        createContainer(
            COLORS.error,
            [

                text(
                    `☁️ \`🍃\` **Một góc nhỏ của hành trình**\n\n` +

                    `- \`❌\` **Không đủ Mora**\n` +
                    `> Một trong hai người chơi không còn đủ Mora để tham gia.\n\n` +

                    `- \`💰\` **Yêu cầu**\n` +
                    `> \`💵\` Cả hai người chơi phải có đủ tiền cược.\n\n` +

                    `> \`🍃\` **Columbina • PvP**`
                )

            ]
        )

    ];
}

// ==========================================
// 💸 SAFE REMOVE BET
// ==========================================

function removePvpBets(
    player1,
    player2,
    bet
) {
    const removed1 =
        User.removeBalance(
            player1,
            bet
        );

    if (removed1 === false) {
        return false;
    }

    const removed2 =
        User.removeBalance(
            player2,
            bet
        );

    if (removed2 === false) {

        // Refund player 1 if player 2 failed.
        User.addBalance(
            player1,
            bet
        );

        return false;
    }

    return true;
}

// ==========================================
// 💰 REFUND PVP
// ==========================================

function refundPvpBets(
    game
) {
    if (!game || game.refunded) {
        return;
    }

    game.refunded = true;

    User.addBalance(
        game.player1,
        game.bet
    );

    User.addBalance(
        game.player2,
        game.bet
    );
}

// ==========================================
// 🚀 COMMAND
// ==========================================

module.exports = {

    name: "rps",

    aliases: [
        "rockpaperscissors",
        "keobao",
        "vrps"
    ],

    description:
        "Chơi Kéo Búa Bao với Columbina hoặc người chơi khác.",

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
        // 💰 BET
        // ======================================

        let bet;

        if (opponent) {

            bet =
                parseInt(
                    args[
                        args.length - 1
                    ],
                    10
                );

        } else {

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
        // 💰 CHALLENGER
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
                [
                    "❌ Bạn không đủ Mora.",
                    "",
                    `> 💰 Cần: **${money(bet)} Mora**`,
                    `> 🪙 Có: **${money(user.balance)} Mora**`
                ].join("\n")
            );
        }

        // ======================================
        // 🤖 BOT GAME
        // ======================================

        if (!opponent) {

            const removed =
                User.removeBalance(
                    userId,
                    bet
                );

            if (removed === false) {
                return message.reply(
                    "❌ Không thể trừ tiền cược. Vui lòng thử lại."
                );
            }

            const gameId =
                createGameId();

            const components =
                createBotGameComponents(
                    message.author,
                    bet,
                    gameId
                );

            const msg =
                await message.reply({
                    components,

                    flags:
                        MessageFlags.IsComponentsV2
                });

            const collector =
                msg.createMessageComponentCollector({
                    time:
                        BOT_GAME_TIMEOUT
                });

            collector.on(
                "collect",
                async interaction => {

                    // ==================================
                    // 👤 OWNER CHECK
                    // ==================================

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

                    // ==================================
                    // 🔎 CUSTOM ID
                    // ==================================

                    const prefix =
                        `rps_choose_${gameId}_`;

                    if (
                        !interaction.customId.startsWith(
                            prefix
                        )
                    ) {
                        return;
                    }

                    const player =
                        interaction.customId.slice(
                            prefix.length
                        );

                    // ==================================
                    // ❌ INVALID CHOICE
                    // ==================================

                    if (
                        !choices[player]
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Nước đi không hợp lệ.",
                            ephemeral:
                                true
                        });
                    }

                    // ==================================
                    // 🤖 BOT CHOICE
                    // ==================================

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

                    // ==================================
                    // 🏆 RESULT
                    // ==================================

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

                    // ==================================
                    // 🎉 WIN
                    // ==================================

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

                    // ==================================
                    // 🤝 DRAW
                    // ==================================

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

                    try {
                        return await interaction.update({
                            components:
                                createBotResultComponents(
                                    userId,
                                    player,
                                    bot,
                                    result,
                                    bet,
                                    reward
                                ),

                            flags:
                                MessageFlags.IsComponentsV2
                        });
                    } catch {}
                }
            );

            // ======================================
            // ⏰ BOT TIMEOUT
            // ======================================

            collector.on(
                "end",
                async (_, reason) => {

                    if (
                        reason ===
                        "finished"
                    ) {
                        return;
                    }

                    try {
                        await msg.edit({
                            components:
                                createTimeoutComponents(
                                    "Ván chơi đã hết thời gian."
                                ),

                            flags:
                                MessageFlags.IsComponentsV2
                        });
                    } catch {}
                }
            );

            return;
        }

        // ======================================
        // ⚔️ PVP
        // ======================================

        const opponentUser =
            User.getOrCreate(
                opponent.id
            );

        // ======================================
        // 💰 OPPONENT MONEY
        // ======================================

        if (
            Number(
                opponentUser.balance || 0
            ) < bet
        ) {
            return message.reply(
                [
                    `❌ <@${opponent.id}> không đủ Mora.`,
                    "",
                    `> 💰 Cần: **${money(bet)} Mora**`
                ].join("\n")
            );
        }

        // ======================================
        // 🎮 GAME ID
        // ======================================

        const gameId =
            createGameId();

        // ======================================
        // 📩 INVITE
        // ======================================

        const inviteMsg =
            await message.reply({
                components:
                    createInviteComponents(
                        userId,
                        opponent.id,
                        bet,
                        gameId
                    ),

                flags:
                    MessageFlags.IsComponentsV2
            });

        const inviteCollector =
            inviteMsg.createMessageComponentCollector({
                time:
                    PVP_INVITE_TIMEOUT
            });

        // ======================================
        // 🔘 INVITE COLLECT
        // ======================================

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
                        components:
                            createDeclinedComponents(
                                opponent.id,
                                bet
                            ),

                        flags:
                            MessageFlags.IsComponentsV2
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
                        components:
                            createCancelComponents(
                                userId
                            ),

                        flags:
                            MessageFlags.IsComponentsV2
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

                    // ==================================
                    // 💰 CHECK MONEY AGAIN
                    // ==================================

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
                            components:
                                createMoneyErrorComponents(),

                            flags:
                                MessageFlags.IsComponentsV2
                        });
                    }

                    // ==================================
                    // 💸 REMOVE BOTH BETS
                    // ==================================

                    const removed =
                        removePvpBets(
                            userId,
                            opponent.id,
                            bet
                        );

                    if (!removed) {

                        inviteCollector.stop(
                            "money"
                        );

                        return interaction.update({
                            components:
                                createMoneyErrorComponents(),

                            flags:
                                MessageFlags.IsComponentsV2
                        });
                    }

                    // ==================================
                    // 🎮 CREATE GAME
                    // ==================================

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
                            false,

                        refunded:
                            false
                    };

                    // ==================================
                    // 🛑 STOP INVITE
                    // ==================================

                    inviteCollector.stop(
                        "accepted"
                    );

                    // ==================================
                    // ⚔️ SHOW GAME
                    // ==================================

                    try {

                        await interaction.update({
                            components:
                                createPvpGameComponents(
                                    game,
                                    bet
                                ),

                            flags:
                                MessageFlags.IsComponentsV2
                        });

                    } catch {

                        // If Discord update failed after
                        // bets were removed, refund both.
                        refundPvpBets(game);

                        return;
                    }

                    // ==================================
                    // 🎮 GAME COLLECTOR
                    // ==================================

                    const gameCollector =
                        inviteMsg.createMessageComponentCollector({
                            time:
                                PVP_GAME_TIMEOUT
                        });

                    // ==================================
                    // 🔘 GAME COLLECT
                    // ==================================

                    gameCollector.on(
                        "collect",
                        async gameInteraction => {

                            // ==================================
                            // 🔒 FINISHED
                            // ==================================

                            if (
                                game.finished
                            ) {
                                return;
                            }

                            // ==================================
                            // 🔎 CUSTOM ID
                            // ==================================

                            const prefix =
                                `rps_choose_${gameId}_`;

                            if (
                                !gameInteraction.customId.startsWith(
                                    prefix
                                )
                            ) {
                                return;
                            }

                            // ==================================
                            // 🎮 CHOICE
                            // ==================================

                            const playerChoice =
                                gameInteraction.customId.slice(
                                    prefix.length
                                );

                            if (
                                !choices[playerChoice]
                            ) {
                                return gameInteraction.reply({
                                    content:
                                        "❌ Nước đi không hợp lệ.",
                                    ephemeral:
                                        true
                                });
                            }

                            // ==================================
                            // 👤 CLICKER
                            // ==================================

                            const clickerId =
                                gameInteraction.user.id;

                            if (
                                clickerId !==
                                game.player1 &&
                                clickerId !==
                                game.player2
                            ) {
                                return gameInteraction.reply({
                                    content:
                                        "❌ Bạn không tham gia ván PvP này.",
                                    ephemeral:
                                        true
                                });
                            }

                            // ==================================
                            // 🔒 ALREADY CHOSEN
                            // ==================================

                            if (
                                game.choices[
                                    clickerId
                                ]
                            ) {
                                return gameInteraction.reply({
                                    content:
                                        "❌ Bạn đã chọn rồi.",
                                    ephemeral:
                                        true
                                });
                            }

                            // ==================================
                            // 💾 SAVE CHOICE
                            // ==================================

                            game.choices[
                                clickerId
                            ] =
                                playerChoice;

                            // ==================================
                            // ⏳ WAIT FOR OTHER PLAYER
                            // ==================================

                            if (
                                !game.choices[
                                    game.player1
                                ] ||
                                !game.choices[
                                    game.player2
                                ]
                            ) {

                                return gameInteraction.update({
                                    components:
                                        createPvpGameComponents(
                                            game,
                                            bet
                                        ),

                                    flags:
                                        MessageFlags.IsComponentsV2
                                });
                            }

                            // ==================================
                            // 🏆 CALCULATE RESULT
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

                            // ==================================
                            // 🔒 LOCK GAME
                            // ==================================

                            game.finished =
                                true;

                            // ==================================
                            // 🏆 PLAYER 1
                            // ==================================

                            if (
                                result === "win"
                            ) {

                                winnerId =
                                    game.player1;

                                reward =
                                    bet * 2;

                                User.addBalance(
                                    winnerId,
                                    reward
                                );

                                updateStats(
                                    game.player1,
                                    "win"
                                );

                                updateStats(
                                    game.player2,
                                    "lose"
                                );
                            }

                            // ==================================
                            // 🏆 PLAYER 2
                            // ==================================

                            else if (
                                result === "lose"
                            ) {

                                winnerId =
                                    game.player2;

                                reward =
                                    bet * 2;

                                User.addBalance(
                                    winnerId,
                                    reward
                                );

                                updateStats(
                                    game.player1,
                                    "lose"
                                );

                                updateStats(
                                    game.player2,
                                    "win"
                                );
                            }

                            // ==================================
                            // 🤝 DRAW
                            // ==================================

                            else {

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

                            // ==================================
                            // 🛑 STOP COLLECTOR
                            // ==================================

                            gameCollector.stop(
                                "finished"
                            );

                            // ==================================
                            // 🏆 SHOW RESULT
                            // ==================================

                            try {

                                return await gameInteraction.update({
                                    components:
                                        createPvpResultComponents(
                                            game,
                                            result,
                                            bet,
                                            reward,
                                            winnerId
                                        ),

                                    flags:
                                        MessageFlags.IsComponentsV2
                                });

                            } catch {}
                        }
                    );

                    // ==================================
                    // ⏰ PVP GAME TIMEOUT
                    // ==================================

                    gameCollector.on(
                        "end",
                        async (_, reason) => {

                            if (
                                reason ===
                                "finished"
                            ) {
                                return;
                            }

                            if (
                                game.finished
                            ) {
                                return;
                            }

                            // ==================================
                            // 🔒 LOCK
                            // ==================================

                            game.finished =
                                true;

                            // ==================================
                            // 💰 REFUND
                            // ==================================

                            refundPvpBets(
                                game
                            );

                            // ==================================
                            // 📝 UPDATE MESSAGE
                            // ==================================

                            try {

                                await inviteMsg.edit({
                                    components:
                                        createTimeoutComponents(
                                            "Một hoặc cả hai người chơi không chọn kịp thời.",
                                            true
                                        ),

                                    flags:
                                        MessageFlags.IsComponentsV2
                                });

                            } catch {}
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
                    reason ===
                    "accepted" ||
                    reason ===
                    "declined" ||
                    reason ===
                    "cancelled" ||
                    reason ===
                    "money"
                ) {
                    return;
                }

                try {

                    await inviteMsg.edit({
                        components:
                            createTimeoutComponents(
                                `<@${opponent.id}> không phản hồi lời thách đấu.`
                            ),

                        flags:
                            MessageFlags.IsComponentsV2
                    });

                } catch {}
            }
        );
    }
};
