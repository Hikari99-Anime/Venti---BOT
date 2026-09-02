const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 🏆 ACHIEVEMENTS
// ==========================================

const ACHIEVEMENTS = {
    all: {
        label: "Tất cả",
        emoji: "🏆"
    },

    fishing: {
        label: "Fishing",
        emoji: "🎣"
    },

    farming: {
        label: "Farming",
        emoji: "🌾"
    },

    economy: {
        label: "Economy",
        emoji: "💰"
    },

    quest: {
        label: "Quest",
        emoji: "📜"
    },

    daily: {
        label: "Daily",
        emoji: "🔥"
    },

    level: {
        label: "Level",
        emoji: "⭐"
    }
};

// ==========================================
// 📋 ACHIEVEMENT DATA
// ==========================================

const DATA = [
    {
        id: "first_fish",
        category: "fishing",
        emoji: "🐟",
        name: "First Catch",
        description: "Bắt con cá đầu tiên.",
        target: 1,
        getProgress: user =>
            Number(
                user.stats?.fish || 0
            )
    },

    {
        id: "fisherman",
        category: "fishing",
        emoji: "🎣",
        name: "Fisherman",
        description: "Bắt 100 con cá.",
        target: 100,
        getProgress: user =>
            Number(
                user.stats?.fish || 0
            )
    },

    {
        id: "master_fisher",
        category: "fishing",
        emoji: "🌊",
        name: "Master Fisher",
        description: "Bắt 500 con cá.",
        target: 500,
        getProgress: user =>
            Number(
                user.stats?.fish || 0
            )
    },

    {
        id: "first_harvest",
        category: "farming",
        emoji: "🌱",
        name: "First Harvest",
        description: "Thu hoạch lần đầu tiên.",
        target: 1,
        getProgress: user =>
            Number(
                user.stats?.farm || 0
            )
    },

    {
        id: "farmer",
        category: "farming",
        emoji: "🌾",
        name: "Farmer",
        description: "Thu hoạch 100 lần.",
        target: 100,
        getProgress: user =>
            Number(
                user.stats?.farm || 0
            )
    },

    {
        id: "master_farmer",
        category: "farming",
        emoji: "👨‍🌾",
        name: "Master Farmer",
        description: "Thu hoạch 500 lần.",
        target: 500,
        getProgress: user =>
            Number(
                user.stats?.farm || 0
            )
    },

    {
        id: "rich",
        category: "economy",
        emoji: "💰",
        name: "Rich",
        description: "Có 10,000 Mora.",
        target: 10000,
        getProgress: user =>
            Number(
                user.balance || 0
            )
    },

    {
        id: "wealthy",
        category: "economy",
        emoji: "💎",
        name: "Wealthy",
        description: "Có 100,000 Mora.",
        target: 100000,
        getProgress: user =>
            Number(
                user.balance || 0
            )
    },

    {
        id: "millionaire",
        category: "economy",
        emoji: "👑",
        name: "Millionaire",
        description: "Có 1,000,000 Mora.",
        target: 1000000,
        getProgress: user =>
            Number(
                user.balance || 0
            )
    },

    {
        id: "quest_beginner",
        category: "quest",
        emoji: "📜",
        name: "Quest Beginner",
        description: "Hoàn thành 1 quest.",
        target: 1,
        getProgress: user =>
            Number(
                user.stats?.quest || 0
            )
    },

    {
        id: "quest_hunter",
        category: "quest",
        emoji: "🗺️",
        name: "Quest Hunter",
        description: "Hoàn thành 10 quest.",
        target: 10,
        getProgress: user =>
            Number(
                user.stats?.quest || 0
            )
    },

    {
        id: "quest_master",
        category: "quest",
        emoji: "🏅",
        name: "Quest Master",
        description: "Hoàn thành 50 quest.",
        target: 50,
        getProgress: user =>
            Number(
                user.stats?.quest || 0
            )
    },

    {
        id: "daily_7",
        category: "daily",
        emoji: "🔥",
        name: "7 Day Streak",
        description: "Đạt daily streak 7 ngày.",
        target: 7,
        getProgress: user =>
            Number(
                user.dailyStreak || 0
            )
    },

    {
        id: "daily_30",
        category: "daily",
        emoji: "🔥",
        name: "30 Day Streak",
        description: "Đạt daily streak 30 ngày.",
        target: 30,
        getProgress: user =>
            Number(
                user.dailyStreak || 0
            )
    },

    {
        id: "level_5",
        category: "level",
        emoji: "⭐",
        name: "Adventurer",
        description: "Đạt Level 5.",
        target: 5,
        getProgress: user =>
            Number(
                user.level || 1
            )
    },

    {
        id: "level_10",
        category: "level",
        emoji: "🌟",
        name: "Experienced",
        description: "Đạt Level 10.",
        target: 10,
        getProgress: user =>
            Number(
                user.level || 1
            )
    },

    {
        id: "level_25",
        category: "level",
        emoji: "✨",
        name: "Master Adventurer",
        description: "Đạt Level 25.",
        target: 25,
        getProgress: user =>
            Number(
                user.level || 1
            )
    }
];

// ==========================================
// 🔍 CHECK ACHIEVEMENTS
// ==========================================

function checkAchievements(
    userId,
    user
) {
    const achievements = {
        ...(user.achievements || {})
    };

    const unlocked = [];

    for (
        const achievement of DATA
    ) {
        const progress =
            achievement.getProgress(
                user
            );

        if (
            progress >=
            achievement.target
        ) {
            if (
                !achievements[
                    achievement.id
                ]
            ) {
                achievements[
                    achievement.id
                ] = {
                    unlocked: true,
                    unlockedAt:
                        Date.now()
                };

                unlocked.push(
                    achievement
                );
            }
        }
    }

    if (
        unlocked.length > 0
    ) {
        User.update(
            userId,
            {
                achievements
            }
        );
    }

    return unlocked;
}

// ==========================================
// 📊 PROGRESS
// ==========================================

function progressBar(
    current,
    target
) {
    const percent =
        Math.min(
            current / target,
            1
        );

    const length = 8;

    const filled =
        Math.round(
            percent * length
        );

    return (
        "🟩".repeat(
            filled
        ) +
        "⬜".repeat(
            length - filled
        )
    );
}

function formatAchievement(
    achievement,
    user
) {
    const achievements =
        user.achievements || {};

    const unlocked =
        Boolean(
            achievements[
                achievement.id
            ]?.unlocked
        );

    const current =
        Math.min(
            achievement.getProgress(
                user
            ),
            achievement.target
        );

    if (unlocked) {
        return (
            `✅ ${achievement.emoji} **${achievement.name}**\n` +
            `> ${achievement.description}\n`
        );
    }

    return (
        `🔒 ${achievement.emoji} **${achievement.name}**\n` +
        `> ${achievement.description}\n` +
        `> ${progressBar(
            current,
            achievement.target
        )} **${current.toLocaleString()} / ${achievement.target.toLocaleString()}**\n`
    );
}

// ==========================================
// 🏆 CREATE EMBED
// ==========================================

function createEmbed(
    user,
    category
) {
    const achievements =
        user.achievements || {};

    const filtered =
        category === "all"
            ? DATA
            : DATA.filter(
                achievement =>
                    achievement.category ===
                    category
            );

    const unlocked =
        filtered.filter(
            achievement =>
                achievements[
                    achievement.id
                ]?.unlocked
        ).length;

    const total =
        filtered.length;

    const description =
        filtered
            .map(
                achievement =>
                    formatAchievement(
                        achievement,
                        user
                    )
            )
            .join("\n");

    const categoryData =
        ACHIEVEMENTS[
            category
        ] ||
        ACHIEVEMENTS.all;

    return new EmbedBuilder()
        .setColor(
            "#F1C40F"
        )
        .setTitle(
            `${categoryData.emoji} Achievements`
        )
        .setDescription(
            `**${unlocked}/${total}** thành tích đã mở khóa.\n\n` +
            description
        )
        .setThumbnail(
            "https://cdn.discordapp.com/embed/avatars/0.png"
        )
        .setFooter({
            text:
                "🏆 Venti • Achievement System"
        })
        .setTimestamp();
}

// ==========================================
// 📋 SELECT MENU
// ==========================================

function createMenu(
    selected
) {
    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    "venti_achievement_menu"
                )
                .setPlaceholder(
                    "🏆 Chọn danh mục thành tích..."
                )
                .addOptions(
                    Object.entries(
                        ACHIEVEMENTS
                    ).map(
                        ([value, data]) => ({
                            label:
                                data.label,
                            description:
                                `Xem thành tích ${data.label}`,
                            value,
                            emoji:
                                data.emoji,
                            default:
                                selected ===
                                value
                        })
                    )
                )
        );
}

// ==========================================
// 🚀 COMMAND
// ==========================================

module.exports = {
    name:
        "achievement",

    aliases: [
        "achievements",
        "ach",
        "vachievement",
        "vach"
    ],

    description:
        "Xem thành tích của bạn.",

    async execute(
        message
    ) {
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(
                userId
            );

        // Tự động kiểm tra achievement
        const unlocked =
            checkAchievements(
                userId,
                user
            );

        // Lấy lại dữ liệu mới nhất
        const updatedUser =
            User.getOrCreate(
                userId
            );

        const msg =
            await message.reply({
                embeds: [
                    createEmbed(
                        updatedUser,
                        "all"
                    )
                ],
                components: [
                    createMenu(
                        "all"
                    )
                ]
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
                    interaction.customId !==
                    "venti_achievement_menu"
                ) {
                    return;
                }

                if (
                    interaction.user.id !==
                    userId
                ) {
                    return interaction.reply({
                        content:
                            "❌ Đây không phải bảng thành tích của bạn.",
                        ephemeral:
                            true
                    });
                }

                const category =
                    interaction.values[0];

                const currentUser =
                    User.getOrCreate(
                        userId
                    );

                checkAchievements(
                    userId,
                    currentUser
                );

                const latestUser =
                    User.getOrCreate(
                        userId
                    );

                await interaction.update({
                    embeds: [
                        createEmbed(
                            latestUser,
                            category
                        )
                    ],
                    components: [
                        createMenu(
                            category
                        )
                    ]
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
    }
};
