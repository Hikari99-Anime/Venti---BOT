
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
            "Những người chơi có nhiều Mora nhất.",
        unit: "Mora"
    },

    level: {
        label: "Level cao nhất",
        emoji: "⭐",
        color: "#9B59B6",
        description:
            "Những người chơi có Level cao nhất.",
        unit: "Level"
    },

    fishing: {
        label: "Fishing",
        emoji: "🎣",
        color: "#3498DB",
        description:
            "Những người câu được nhiều cá nhất.",
        unit: "con cá"
    },

    farming: {
        label: "Farming",
        emoji: "🌾",
        color: "#2ECC71",
        description:
            "Những người thu hoạch nhiều nông sản nhất.",
        unit: "lần thu hoạch"
    },

    daily: {
        label: "Daily Streak",
        emoji: "🔥",
        color: "#E67E22",
        description:
            "Những người có chuỗi Daily dài nhất.",
        unit: "ngày"
    },

    quest: {
        label: "Quest",
        emoji: "📜",
        color: "#1ABC9C",
        description:
            "Những người hoàn thành nhiều quest nhất.",
        unit: "quest"
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

    return Object.entries(data)
        .map(([id, user]) => ({
            ...(user || {}),
            id:
                user?.id ||
                id
        }))
        .filter(user => user.id);
}

// ==========================================
// 🎣 FISHING
// ==========================================

function getFishingCount(user) {
    const stats =
        user.stats || {};

    /*
     * Ưu tiên stats.fish.
     * Vfish cần tăng stats.fish mỗi lần
     * câu được một con cá.
     */

    if (
        Number.isFinite(
            Number(stats.fish)
        )
    ) {
        return Math.max(
            0,
            Number(stats.fish)
        );
    }

    /*
     * Fallback dữ liệu cũ.
     */

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
        (total, itemId) =>
            total +
            Number(
                inventory[itemId] || 0
            ),
        0
    );
}

// ==========================================
// 🌾 FARMING
// ==========================================

function getFarmingCount(user) {
    const stats =
        user.stats || {};

    if (
        Number.isFinite(
            Number(stats.farm)
        )
    ) {
        return Math.max(
            0,
            Number(stats.farm)
        );
    }

    if (
        Number.isFinite(
            Number(user.farmCount)
        )
    ) {
        return Math.max(
            0,
            Number(user.farmCount)
        );
    }

    return 0;
}

// ==========================================
// 📜 QUEST
// ==========================================

function getQuestCount(user) {
    const stats =
        user.stats || {};

    /*
     * QUEST LEADERBOARD CHỈ DÙNG
     * stats.quest.
     *
     * Không lấy quests.daily.progress
     * vì progress chỉ là tiến độ quest hiện tại.
     */

    if (
        Number.isFinite(
            Number(stats.quest)
        )
    ) {
        return Math.max(
            0,
            Number(stats.quest)
        );
    }

    return 0;
}

// ==========================================
// 🔥 DAILY
// ==========================================

function getDailyCount(user) {
    return Math.max(
        0,
        Number(
            user.dailyStreak || 0
        )
    );
}

// ==========================================
// ⭐ LEVEL
// ==========================================

function getLevel(user) {
    return Math.max(
        1,
        Number(
            user.level || 1
        )
    );
}

// ==========================================
// 💰 BALANCE
// ==========================================

function getBalance(user) {
    return Math.max(
        0,
        Number(
            user.balance || 0
        )
    );
}

// ==========================================
// 🔢 SCORE
// ==========================================

function getScore(
    user,
    type
) {
    switch (type) {
        case "balance":
            return getBalance(user);

        case "level":
            return getLevel(user);

        case "fishing":
            return getFishingCount(user);

        case "farming":
            return getFarmingCount(user);

        case "daily":
            return getDailyCount(user);

        case "quest":
            return getQuestCount(user);

        default:
            return 0;
    }
}

// ==========================================
// 🥇 MEDAL
// ==========================================

function getMedal(position) {
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
// 📌 FORMAT SCORE
// ==========================================

function formatScore(
    score,
    type
) {
    const data =
        TYPES[type];

    if (!data) {
        return score.toLocaleString();
    }

    return (
        `${score.toLocaleString()} ${data.unit}`
    );
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
// 📊 SORT
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

            if (
                scoreB !==
                scoreA
            ) {
                return (
                    scoreB -
                    scoreA
                );
            }

            /*
             * Nếu bằng điểm thì ưu tiên
             * level cao hơn.
             */

            return (
                getLevel(b) -
                getLevel(a)
            );
        }
    );
}

// ==========================================
// 🏆 BUILD TOP 10
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
        !sorted.length
    ) {
        return {
            text:
                "🍃 Chưa có người chơi.",
            top: []
        };
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
            `${medal} **${name}**\n` +
            `> ${TYPES[type].emoji} ${formatScore(score, type)}${marker}`
        );
    }

    return {
        text:
            lines.join("\n\n"),
        top: top10
    };
}

// ==========================================
// 👤 PLAYER RANK
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

    return {
        rank: index + 1,
        total: sorted.length,
        score:
            getScore(
                sorted[index],
                type
            )
    };
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

    const player =
        getPlayerRank(
            users,
            type,
            userId
        );

    const user =
        users.find(
            x =>
                x.id ===
                userId
        );

    const playerScore =
        user
            ? getScore(
                user,
                type
            )
            : 0;

    const rankText =
        player
            ? `#${player.rank} / ${player.total}`
            : "Chưa xếp hạng";

    const description = [
        `${data.description}`,
        "",
        `📊 **${data.label}**`,
        "",
        leaderboard.text,
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        `👤 **Thứ hạng của bạn**`,
        `🏆 ${rankText}`,
        `${data.emoji} ${formatScore(
            playerScore,
            type
        )}`,
        "",
        `👥 **Tổng người chơi:** ${users.length}`
    ].join("\n");

    const embed =
        new EmbedBuilder()
            .setColor(
                data.color
            )
            .setTitle(
                `${data.emoji} Venti Leaderboard`
            )
            .setDescription(
                description
            )
            .setFooter({
                text:
                    "Venti • Top 10 Travelers"
            })
            .setTimestamp();

    /*
     * Nếu user đang ở Top 10,
     * thêm thông tin nổi bật.
     */

    if (
        player &&
        player.rank <= 10
    ) {
        embed.addFields({
            name:
                "🏅 Bạn đang nằm trong Top 10!",
            value:
                `Bạn đang đứng **#${player.rank}** trên bảng xếp hạng.`,
            inline: false
        });
    }

    return embed;
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

                try {
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
                } catch (
                    error
                ) {
                    console.error(
                        "[leaderboard interaction]",
                        error
                    );
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
};

