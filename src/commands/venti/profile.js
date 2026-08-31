
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

module.exports = {
    name: "profile",
    aliases: [
        "vprofile",
        "me",
        "userinfo"
    ],

    description:
        "Xem thông tin và tiến trình của bạn.",

    async execute(message) {
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(
                userId
            );

        return sendProfile(
            message,
            userId,
            user
        );
    }
};

// ==========================================
// 👤 PROFILE
// ==========================================

function createProfileEmbed(
    message,
    user
) {
    const balance =
        Number(
            user.balance || 0
        );

    const bank =
        Number(
            user.bank || 0
        );

    const level =
        Number(
            user.level || 1
        );

    const xp =
        Number(
            user.xp || 0
        );

    const xpNeeded =
        level * 500;

    const stats =
        user.stats || {};

    const fish =
        Number(
            stats.fish || 0
        );

    const work =
        Number(
            stats.work || 0
        );

    const games =
        Number(
            stats.games || 0
        );

    const wins =
        Number(
            stats.wins || 0
        );

    const losses =
        Number(
            stats.losses || 0
        );

    const quests =
        user.quests || {};

    const dailyQuests =
        Array.isArray(
            quests.daily
        )
            ? quests.daily
            : [];

    const completedQuests =
        dailyQuests.filter(
            quest =>
                quest.claimed
        ).length;

    const streak =
        Number(
            user.dailyStreak || 0
        );

    const progress =
        Math.min(
            xp / xpNeeded,
            1
        );

    const progressBar =
        createProgressBar(
            progress,
            12
        );

    const embed =
        new EmbedBuilder()
            .setColor(
                "#5865F2"
            )
            .setAuthor({
                name:
                    message.author
                        .username,
                iconURL:
                    message.author
                        .displayAvatarURL({
                            extension:
                                "png",
                            size: 128
                        })
            })
            .setTitle(
                "👤 Venti Profile"
            )
            .setThumbnail(
                message.author
                    .displayAvatarURL({
                        extension:
                            "png",
                        size: 256
                    })
            )
            .addFields(
                {
                    name:
                        "💰 Tài sản",
                    value:
                        `💵 Ví: **${balance.toLocaleString()} Mora**\n` +
                        `🏦 Ngân hàng: **${bank.toLocaleString()} Mora**`,
                    inline:
                        true
                },
                {
                    name:
                        "⭐ Cấp độ",
                    value:
                        `Level **${level}**\n` +
                        `${progressBar}\n` +
                        `✨ ${xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`,
                    inline:
                        true
                },
                {
                    name:
                        "🔥 Daily",
                    value:
                        `Streak: **${streak} ngày**`,
                    inline:
                        true
                },
                {
                    name:
                        "🎣 Fishing",
                    value:
                        `🐟 Đã bắt: **${fish.toLocaleString()}** con`,
                    inline:
                        true
                },
                {
                    name:
                        "🌱 Farming",
                    value:
                        "Xem trong Vfarm",
                    inline:
                        true
                },
                {
                    name:
                        "📜 Quest",
                    value:
                        `✅ Hôm nay: **${completedQuests}/${dailyQuests.length}**`,
                    inline:
                        true
                },
                {
                    name:
                        "🎮 Game",
                    value:
                        `🎮 Games: **${games.toLocaleString()}**\n` +
                        `🏆 Wins: **${wins.toLocaleString()}**\n` +
                        `💀 Losses: **${losses.toLocaleString()}**`,
                    inline:
                        true
                },
                {
                    name:
                        "💼 Work",
                    value:
                        `Đã làm: **${work.toLocaleString()}** lần`,
                    inline:
                        true
                }
            )
            .setFooter({
                text:
                    `ID: ${message.author.id}`
            })
            .setTimestamp();

    return embed;
}

// ==========================================
// 📊 PROGRESS BAR
// ==========================================

function createProgressBar(
    progress,
    length
) {
    const filled =
        Math.round(
            progress * length
        );

    const empty =
        length - filled;

    return (
        "🟦".repeat(
            filled
        ) +
        "⬜".repeat(
            empty
        )
    );
}

// ==========================================
// 🔘 BUTTONS
// ==========================================

function createButtons(
    userId
) {
    return [
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `profile_inventory_${userId}`
                    )
                    .setLabel(
                        "Inventory"
                    )
                    .setEmoji(
                        "🎒"
                    )
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `profile_quest_${userId}`
                    )
                    .setLabel(
                        "Quest"
                    )
                    .setEmoji(
                        "📜"
                    )
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `profile_refresh_${userId}`
                    )
                    .setLabel(
                        "Làm mới"
                    )
                    .setEmoji(
                        "🔄"
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            )
    ];
}

// ==========================================
// 📤 SEND PROFILE
// ==========================================

async function sendProfile(
    message,
    userId,
    user
) {
    const msg =
        await message.reply({
            embeds: [
                createProfileEmbed(
                    message,
                    user
                )
            ],
            components:
                createButtons(
                    userId
                )
        });

    const collector =
        msg.createMessageComponentCollector({
            time: 180000
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
                        "❌ Đây không phải profile của bạn.",
                    ephemeral:
                        true
                });
            }

            // =========================
            // 🔄 REFRESH
            // =========================

            if (
                interaction.customId ===
                `profile_refresh_${userId}`
            ) {
                const updatedUser =
                    User.getOrCreate(
                        userId
                    );

                return interaction.update({
                    embeds: [
                        createProfileEmbed(
                            message,
                            updatedUser
                        )
                    ],
                    components:
                        createButtons(
                            userId
                        )
                });
            }

            // =========================
            // 🎒 INVENTORY
            // =========================

            if (
                interaction.customId ===
                `profile_inventory_${userId}`
            ) {
                return interaction.reply({
                    content:
                        "🎒 Dùng `Vinventory` để mở túi đồ.",
                    ephemeral:
                        true
                });
            }

            // =========================
            // 📜 QUEST
            // =========================

            if (
                interaction.customId ===
                `profile_quest_${userId}`
            ) {
                return interaction.reply({
                    content:
                        "📜 Dùng `Vquest` để xem nhiệm vụ.",
                    ephemeral:
                        true
                });
            }
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
}

