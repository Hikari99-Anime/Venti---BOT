
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

// ═══════════════════════════════════════
// 🏆 ACHIEVEMENTS
// ═══════════════════════════════════════

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

// ═══════════════════════════════════════
// 📋 ACHIEVEMENT DATA
// ═══════════════════════════════════════

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
        description:
            "Thu hoạch lần đầu tiên.",
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
        description:
            "Thu hoạch 100 lần.",
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
        description:
            "Thu hoạch 500 lần.",
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
        description:
            "Có 10,000 Mora.",
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
        description:
            "Có 100,000 Mora.",
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
        description:
            "Có 1,000,000 Mora.",
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
        description:
            "Hoàn thành 1 quest.",
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
        description:
            "Hoàn thành 10 quest.",
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
        description:
            "Hoàn thành 50 quest.",
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
        description:
            "Đạt daily streak 7 ngày.",
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
        description:
            "Đạt daily streak 30 ngày.",
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
        description:
            "Đạt Level 5.",
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
        description:
            "Đạt Level 10.",
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
        description:
            "Đạt Level 25.",
        target: 25,

        getProgress: user =>
            Number(
                user.level || 1
            )
    }
];

// ═══════════════════════════════════════
// 🔍 CHECK ACHIEVEMENTS
// ═══════════════════════════════════════

function checkAchievements(
    userId,
    user
) {
    const achievements = {
        ...(user.achievements || {})
    };

    let changed = false;

    for (
        const achievement of DATA
    ) {
        const progress =
            Number(
                achievement.getProgress(
                    user
                ) || 0
            );

        if (
            progress >=
            achievement.target
        ) {
            if (
                !achievements[
                    achievement.id
                ]?.unlocked
            ) {
                achievements[
                    achievement.id
                ] = {
                    unlocked: true,
                    unlockedAt:
                        Date.now()
                };

                changed = true;
            }
        }
    }

    if (changed) {
        User.update(
            userId,
            {
                achievements
            }
        );
    }

    return achievements;
}

// ═══════════════════════════════════════
// 📊 PROGRESS BAR
// ═══════════════════════════════════════

function progressBar(
    current,
    target
) {
    const safeCurrent =
        Math.max(
            0,
            Number(
                current || 0
            )
        );

    const safeTarget =
        Math.max(
            1,
            Number(
                target || 1
            )
        );

    const percent =
        Math.min(
            safeCurrent /
                safeTarget,
            1
        );

    const length = 10;

    const filled =
        Math.round(
            percent *
                length
        );

    return (
        "🟩".repeat(
            filled
        ) +
        "⬜".repeat(
            length -
            filled
        )
    );
}

// ═══════════════════════════════════════
// 🏆 FORMAT ACHIEVEMENT
// ═══════════════════════════════════════

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

    const rawProgress =
        Number(
            achievement.getProgress(
                user
            ) || 0
        );

    const current =
        Math.min(
            rawProgress,
            achievement.target
        );

    const emoji =
        achievement.emoji ||
        "🏆";

    // ─────────────────────────────
    // UNLOCKED
    // ─────────────────────────────

    if (unlocked) {
        return [
            `● \`${emoji}\` **${achievement.name}**`,
            `> ${achievement.description}`,
            `> 🟢 **Đã hoàn thành**`
        ].join("\n");
    }

    // ─────────────────────────────
    // LOCKED
    // ─────────────────────────────

    const percent =
        Math.floor(
            Math.min(
                current /
                    achievement.target,
                1
            ) * 100
        );

    return [
        `● \`${emoji}\` **${achievement.name}**`,
        `> ${achievement.description}`,
        `> ${progressBar(
            current,
            achievement.target
        )}`,
        `> 📊 **${current.toLocaleString()} / ${achievement.target.toLocaleString()}** · ${percent}%`
    ].join("\n");
}

// ═══════════════════════════════════════
// 📊 CREATE EMBED
// ═══════════════════════════════════════

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

    const categoryData =
        ACHIEVEMENTS[
            category
        ] ||
        ACHIEVEMENTS.all;

    const description =
        filtered
            .map(
                achievement =>
                    formatAchievement(
                        achievement,
                        user
                    )
            )
            .join("\n\n");

    const percent =
        total > 0
            ? Math.floor(
                (unlocked /
                    total) *
                    100
            )
            : 0;

    return new EmbedBuilder()
        .setColor(
            "#F1C40F"
        )

        .setTitle(
            `${categoryData.emoji} Achievement`
        )

        .setDescription(
            [
                `● \`🏆\` **Thành tích**`,
                `> ${unlocked}/${total} đã mở khóa · ${percent}%`,
                "",
                description
            ].join("\n")
        )

        .setFooter({
            text:
                "♡ Venti • Achievement System"
        })

        .setTimestamp();
}

// ═══════════════════════════════════════
// 📋 SELECT MENU
// ═══════════════════════════════════════

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
                    "🏆 Chọn danh mục..."
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

// ═══════════════════════════════════════
// 🚀 COMMAND
// ═══════════════════════════════════════

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

        let user =
            User.getOrCreate(
                userId
            );

        // Kiểm tra achievement
        checkAchievements(
            userId,
            user
        );

        // Lấy dữ liệu mới nhất
        user =
            User.getOrCreate(
                userId
            );

        const msg =
            await message.reply({
                embeds: [
                    createEmbed(
                        user,
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

                let currentUser =
                    User.getOrCreate(
                        userId
                    );

                checkAchievements(
                    userId,
                    currentUser
                );

                currentUser =
                    User.getOrCreate(
                        userId
                    );

                return interaction.update({
                    embeds: [
                        createEmbed(
                            currentUser,
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
    },

    // Export để các command khác
    // có thể check achievement
    checkAchievements,
    createEmbed,
    createMenu,
    DATA,
    ACHIEVEMENTS
};

