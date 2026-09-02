
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
// 👤 PROFILE EMBED
// ==========================================

function createProfileEmbed(
    message,
    user
) {
    const balance =
        Number(
            user?.balance || 0
        );

    const bank =
        Number(
            user?.bank || 0
        );

    const level =
        Number(
            user?.level || 1
        );

    const xp =
        Number(
            user?.xp || 0
        );

    const stats =
        user?.stats || {};

    // ======================================
    // 📊 STATS
    // ======================================

    const fish =
        Number(
            stats.fish || 0
        );

    const farm =
        Number(
            stats.farm || 0
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

    const completedQuestTotal =
        Number(
            stats.quest || 0
        );

    // ======================================
    // 🔥 DAILY
    // ======================================

    const streak =
        Number(
            user?.dailyStreak || 0
        );

    // ======================================
    // 📜 DAILY QUEST
    // ======================================

    const quests =
        user?.quests || {};

    const dailyQuests =
        Array.isArray(
            quests.daily
        )
            ? quests.daily
            : [];

    const dailyQuestCompleted =
        dailyQuests.filter(
            quest =>
                quest?.claimed === true
        ).length;

    const dailyQuestTotal =
        dailyQuests.length;

    // ======================================
    // ⭐ XP
    // ======================================

    const xpNeeded =
        Math.max(
            1,
            level * 500
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

    // ======================================
    // 👤 EMBED
    // ======================================

    return new EmbedBuilder()
        .setColor(
            "#5865F2"
        )

        .setAuthor({
            name:
                message.author
                    .globalName ||
                message.author
                    .username,

            iconURL:
                message.author
                    .displayAvatarURL({
                        extension:
                            "png",
                        size:
                            128
                    })
        })

        .setTitle(
            "👤 Venti Profile"
        )

        .setDescription(
            [
                "🍃 **Traveler Profile**",
                "",
                `👤 ${message.author}`,
                `⭐ Level **${level}**`,
                `✨ ${xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`,
                "",
                progressBar
            ].join("\n")
        )

        .setThumbnail(
            message.author
                .displayAvatarURL({
                    extension:
                        "png",
                    size:
                        256
                })
        )

        .addFields(
            // ==================================
            // 💰 ECONOMY
            // ==================================
            {
                name:
                    "💰 Tài sản",

                value:
                    `💵 Ví: **${balance.toLocaleString()} Mora**\n` +
                    `🏦 Ngân hàng: **${bank.toLocaleString()} Mora**\n` +
                    `💎 Tổng: **${(
                        balance +
                        bank
                    ).toLocaleString()} Mora**`,

                inline:
                    true
            },

            // ==================================
            // ⭐ LEVEL
            // ==================================
            {
                name:
                    "⭐ Cấp độ",

                value:
                    `Level: **${level}**\n` +
                    `✨ XP: **${xp.toLocaleString()}**\n` +
                    `🎯 Cần: **${xpNeeded.toLocaleString()} XP**`,

                inline:
                    true
            },

            // ==================================
            // 🔥 DAILY
            // ==================================
            {
                name:
                    "🔥 Daily",

                value:
                    `Streak: **${streak} ngày**`,

                inline:
                    true
            },

            // ==================================
            // 🎣 FISHING
            // ==================================
            {
                name:
                    "🎣 Fishing",

                value:
                    `🐟 Đã bắt: **${fish.toLocaleString()} con**`,

                inline:
                    true
            },

            // ==================================
            // 🌾 FARMING
            // ==================================
            {
                name:
                    "🌾 Farming",

                value:
                    `🌱 Đã thu hoạch: **${farm.toLocaleString()} lần**`,

                inline:
                    true
            },

            // ==================================
            // 📜 QUEST
            // ==================================
            {
                name:
                    "📜 Quest",

                value:
                    `🏆 Tổng hoàn thành: **${completedQuestTotal.toLocaleString()}**\n` +
                    `📅 Hôm nay: **${dailyQuestCompleted}/${dailyQuestTotal || 0}**`,

                inline:
                    true
            },

            // ==================================
            // 🎮 GAME
            // ==================================
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

            // ==================================
            // 💼 WORK
            // ==================================
            {
                name:
                    "💼 Work",

                value:
                    `Đã làm: **${work.toLocaleString()} lần**`,

                inline:
                    true
            }
        )

        .setFooter({
            text:
                `Venti • Traveler ID: ${message.author.id}`
        })

        .setTimestamp();
}

// ==========================================
// 📊 XP PROGRESS BAR
// ==========================================

function createProgressBar(
    progress,
    length = 12
) {
    const safeProgress =
        Math.max(
            0,
            Math.min(
                Number(progress) || 0,
                1
            )
        );

    const filled =
        Math.round(
            safeProgress *
            length
        );

    const empty =
        length -
        filled;

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
            time:
                180000
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

            // ==================================
            // 🔄 REFRESH
            // ==================================

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

            // ==================================
            // 🎒 INVENTORY
            // ==================================

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

            // ==================================
            // 📜 QUEST
            // ==================================

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

    // ==========================================
    // ⏰ END
    // ==========================================

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

