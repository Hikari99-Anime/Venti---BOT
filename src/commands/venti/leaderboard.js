
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const db =
    require("../../database/database");

// ==========================================
// 🏆 LEADERBOARD TYPES
// ==========================================

const TYPES = {
    balance: {
        label: "Giàu nhất",
        emoji: "💰",
        color: "#F1C40F",
        description:
            "Những người chơi có nhiều Mora nhất."
    },

    level: {
        label: "Level cao nhất",
        emoji: "⭐",
        color: "#9B59B6",
        description:
            "Những người chơi có Level cao nhất."
    },

    fishing: {
        label: "Fishing",
        emoji: "🎣",
        color: "#3498DB",
        description:
            "Những người câu được nhiều cá nhất."
    },

    farming: {
        label: "Farming",
        emoji: "🌾",
        color: "#2ECC71",
        description:
            "Những người thu hoạch nhiều nhất."
    },

    daily: {
        label: "Daily Streak",
        emoji: "🔥",
        color: "#E67E22",
        description:
            "Những người có chuỗi Daily dài nhất."
    },

    quest: {
        label: "Quest",
        emoji: "📜",
        color: "#1ABC9C",
        description:
            "Những người hoàn thành nhiều quest nhất."
    }
};

// ==========================================
// 📊 LOAD USERS
// ==========================================

function getUsers() {
    const data = db.load();

    if (
        !data ||
        typeof data !== "object"
    ) {
        return [];
    }

    return Object.entries(data).map(
        ([id, user]) => ({
            ...(user || {}),

            // users.json của bạn có trường hợp
            // ID nằm ở key thay vì user.id
            id:
                user?.id ||
                id
        })
    );
}

// ==========================================
// 🎣 COUNT FISH
// ==========================================

function getFishingCount(user) {
    const stats =
        user.stats || {};

    // Nếu Vfish đã lưu stats.fish
    if (
        typeof stats.fish ===
        "number"
    ) {
        return stats.fish;
    }

    // Fallback cho dữ liệu cũ:
    // tính trực tiếp cá trong inventory
    const inventory =
        user.inventory || {};

    const fishIds = [
        "small_fish",
        "blue_fish",
        "golden_fish",
        "crystal_fish",
        "wind_fish"
    ];

    return fishIds.reduce(
        (total, itemId) => {
            return (
                total +
                Number(
                    inventory[itemId] ||
                    0
                )
            );
        },
        0
    );
}

// ==========================================
// 🌾 COUNT FARM
// ==========================================

function getFarmingCount(user) {
    const stats =
        user.stats || {};

    if (
        typeof stats.farm ===
        "number"
    ) {
        return stats.farm;
    }

    if (
        typeof user.farmCount ===
        "number"
    ) {
        return user.farmCount;
    }

    return 0;
}

// ==========================================
// 📜 COUNT QUEST
// ==========================================

function getQuestCount(user) {
    const stats =
        user.stats || {};

    if (
        typeof stats.quest ===
        "number"
    ) {
        return stats.quest;
    }

    if (
        typeof user.quest ===
        "number"
    ) {
        return user.quest;
    }

    /*
     * Fallback cho dữ liệu quest hiện tại.
     *
     * quests.daily:
     * [
     *   {
     *      id: "fish",
     *      progress: 0,
     *      claimed: false
     *   }
     * ]
     *
     * Không dùng progress ở đây để tránh
     * nhầm progress hiện tại với tổng quest.
     */

    return 0;
}

// ==========================================
// 🔢 GET SCORE
// ==========================================

function getScore(
    user,
    type
) {
    switch (type) {
        case "balance":
            return Number(
                user.balance || 0
            );

        case "level":
            return Number(
                user.level || 1
            );

        case "fishing":
            return getFishingCount(
                user
            );

        case "farming":
            return getFarmingCount(
                user
            );

        case "daily":
            return Number(
                user.dailyStreak || 0
            );

        case "quest":
            return getQuestCount(
                user
            );

        default:
            return 0;
    }
}

// ==========================================
// 🥇 MEDAL
// ==========================================

function getMedal(
    position
) {
    if (position === 1) {
        return "🥇";
    }

    if (position === 2) {
        return "🥈";
    }

    if (position === 3) {
        return "🥉";
    }

    return `**${position}.**`;
}

// ==========================================
// 👤 DISCORD USERNAME
// ==========================================

async function getDisplayName(
    client,
    userId
) {
    if (!userId) {
        return "Traveler";
    }

    try {
        const discordUser =
            await client.users.fetch(
                userId
            );

        return (
            discordUser.globalName ||
            discordUser.username ||
            "Traveler"
        );
    } catch {
        return "Traveler";
    }
}

// ==========================================
// 📊 SORT USERS
// ==========================================

function sortUsers(
    users,
    type
) {
    return [...users].sort(
        (a, b) => {
            const scoreA =
                getScore(
                    a,
                    type
                );

            const scoreB =
                getScore(
                    b,
                    type
                );

            return (
                scoreB -
                scoreA
            );
        }
    );
}

// ==========================================
// 🏆 BUILD LEADERBOARD
// ==========================================

async function createLeaderboard(
    client,
    users,
    type,
    currentUserId
) {
    const sorted =
        sortUsers(
            users,
            type
        );

    if (
        sorted.length ===
        0
    ) {
        return (
            "🍃 Chưa có người chơi."
        );
    }

    const top10 =
        sorted.slice(
            0,
            10
        );

    const lines = [];

    for (
        let index = 0;
        index < top10.length;
        index++
    ) {
        const user =
            top10[index];

        const position =
            index + 1;

        const score =
            getScore(
                user,
                type
            );

        const name =
            await getDisplayName(
                client,
                user.id
            );

        const medal =
            getMedal(
                position
            );

        const isMe =
            user.id ===
            currentUserId;

        const marker =
            isMe
                ? " ◀ **Bạn**"
                : "";

        lines.push(
            `${medal} **${name}** — \`${score.toLocaleString()}\`${marker}`
        );
    }

    return lines.join(
        "\n"
    );
}

// ==========================================
// 👤 GET PLAYER RANK
// ==========================================

function getPlayerRank(
    users,
    type,
    userId
) {
    const sorted =
        sortUsers(
            users,
            type
        );

    const index =
        sorted.findIndex(
            user =>
                user.id ===
                userId
        );

    if (
        index === -1
    ) {
        return null;
    }

    return index + 1;
}

// ==========================================
// 🏆 CREATE EMBED
// ==========================================

async function createEmbed(
    client,
    type,
    userId
) {
    const data =
        TYPES[type] ||
        TYPES.balance;

    const users =
        getUsers();

    const leaderboard =
        await createLeaderboard(
            client,
            users,
            type,
            userId
        );

    const rank =
        getPlayerRank(
            users,
            type,
            userId
        );

    return new EmbedBuilder()
        .setColor(
            data.color
        )

        .setTitle(
            `${data.emoji} Venti Leaderboard`
        )

        .setDescription(
            `### ${data.label}\n` +
            `${data.description}\n\n` +
            `${leaderboard}\n\n` +
            "────────────────────\n" +
            `👤 **Hạng của bạn:** ${
                rank
                    ? `#${rank}`
                    : "Chưa xếp hạng"
            }`
        )

        .setFooter({
            text:
                "Venti • Top 10 Travelers"
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
                    "venti_leaderboard_menu"
                )

                .setPlaceholder(
                    "🏆 Chọn bảng xếp hạng..."
                )

                .addOptions(
                    Object.entries(
                        TYPES
                    ).map(
                        ([value, data]) => ({
                            label:
                                data.label,

                            description:
                                data.description,

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
        "leaderboard",

    aliases: [
        "lb",
        "top",
        "leaderboards",
        "vleaderboard",
        "vlb"
    ],

    description:
        "Xem bảng xếp hạng người chơi.",

    async execute(
        message
    ) {
        const userId =
            message.author.id;

        const msg =
            await message.reply({
                embeds: [
                    await createEmbed(
                        message.client,
                        "balance",
                        userId
                    )
                ],

                components: [
                    createMenu(
                        "balance"
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
                    "venti_leaderboard_menu"
                ) {
                    return;
                }

                if (
                    interaction.user.id !==
                    userId
                ) {
                    return interaction.reply({
                        content:
                            "❌ Bạn không thể điều khiển bảng xếp hạng của người khác.",
                        ephemeral:
                            true
                    });
                }

                const type =
                    interaction.values[0];

                if (
                    !TYPES[type]
                ) {
                    return interaction.reply({
                        content:
                            "❌ Danh mục không hợp lệ.",
                        ephemeral:
                            true
                    });
                }

                await interaction.update({
                    embeds: [
                        await createEmbed(
                            message.client,
                            type,
                            userId
                        )
                    ],

                    components: [
                        createMenu(
                            type
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
