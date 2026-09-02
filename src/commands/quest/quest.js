
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

const Quest =
    require("../../database/models/Quest");

// ==========================================
// 📜 QUEST CONFIG
// ==========================================

const QUESTS = [
    {
        id: "fish",
        emoji: "🎣",
        name: "Ngư dân chăm chỉ",
        description:
            "Bắt 5 con cá.",
        target: 5,
        reward: 1000,
        xp: 100
    },

    {
        id: "farm",
        emoji: "🌾",
        name: "Nông dân cần cù",
        description:
            "Thu hoạch 10 nông sản.",
        target: 10,
        reward: 1200,
        xp: 120
    },

    {
        id: "sell",
        emoji: "💰",
        name: "Thương nhân",
        description:
            "Bán 10 item.",
        target: 10,
        reward: 900,
        xp: 100
    }
];

// ==========================================
// 📅 TODAY
// ==========================================

function getToday() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}

// ==========================================
// 📜 GET QUEST DEFINITION
// ==========================================

function getQuestDefinition(
    questId
) {
    return QUESTS.find(
        quest =>
            quest.id === questId
    );
}

// ==========================================
// 📜 CREATE DAILY QUESTS
// ==========================================

function createDailyQuests() {
    return QUESTS.map(
        quest => ({
            id: quest.id,
            progress: 0,
            claimed: false
        })
    );
}

// ==========================================
// 📜 GET DAILY QUEST
// ==========================================

function getDailyQuests(user) {
    const today =
        getToday();

    if (
        user.quests &&
        user.quests.date === today &&
        Array.isArray(
            user.quests.daily
        )
    ) {
        return user.quests.daily;
    }

    return createDailyQuests();
}

// ==========================================
// 💾 SAVE QUESTS
// ==========================================

function saveQuests(
    userId,
    quests
) {
    return User.update(
        userId,
        {
            quests: {
                date: getToday(),
                daily: quests
            }
        }
    );
}

// ==========================================
// 🎯 ADD QUEST PROGRESS
// ==========================================
//
// Dùng từ fish.js:
//
// Quest.addProgress(
//     userId,
//     "fish",
//     1
// );
//
// Câu cá xong là quest tự tăng.
// ==========================================

async function addProgress(
    userId,
    questId,
    amount = 1
) {
    const definition =
        getQuestDefinition(
            questId
        );

    if (!definition) {
        return null;
    }

    const user =
        User.getOrCreate(
            userId
        );

    if (!user) {
        return null;
    }

    let quests =
        getDailyQuests(user);

    const quest =
        quests.find(
            item =>
                item.id === questId
        );

    if (!quest) {
        return null;
    }

    // Quest đã nhận thưởng thì không tăng nữa
    if (quest.claimed) {
        return quest;
    }

    const current =
        Number(
            quest.progress || 0
        );

    quest.progress =
        Math.min(
            current +
                Number(amount || 0),
            definition.target
        );

    await saveQuests(
        userId,
        quests
    );

    return quest;
}

// ==========================================
// 🎣 QUICK HELPERS
// ==========================================

async function addFishProgress(
    userId,
    amount = 1
) {
    return addProgress(
        userId,
        "fish",
        amount
    );
}

async function addFarmProgress(
    userId,
    amount = 1
) {
    return addProgress(
        userId,
        "farm",
        amount
    );
}

async function addSellProgress(
    userId,
    amount = 1
) {
    return addProgress(
        userId,
        "sell",
        amount
    );
}

// ==========================================
// 🎨 QUEST EMBED
// ==========================================

function createQuestEmbed(
    quests,
    user
) {
    const username =
        user?.username ||
        "Traveler";

    const embed =
        new EmbedBuilder()
            .setColor("#9B59B6")

            .setAuthor({
                name:
                    `● \`${username}\` · Venti`
            })

            .setTitle(
                "📜 Daily Quest"
            )

            .setDescription(
                [
                    "● `📜` **Nhiệm vụ hằng ngày**",
                    "",
                    "> Hoàn thành nhiệm vụ để nhận Mora và XP.",
                    "",
                    "● `🌙` Quest sẽ được làm mới mỗi ngày."
                ].join("\n")
            );

    for (
        const quest of quests
    ) {
        const definition =
            getQuestDefinition(
                quest.id
            );

        if (!definition) {
            continue;
        }

        const progress =
            Math.min(
                Number(
                    quest.progress || 0
                ),
                definition.target
            );

        const percent =
            Math.min(
                100,
                Math.floor(
                    (
                        progress /
                        definition.target
                    ) * 100
                )
            );

        let status;

        if (quest.claimed) {
            status =
                "● `✅` **Đã nhận thưởng**";
        } else if (
            progress >=
            definition.target
        ) {
            status =
                "● `🎁` **Sẵn sàng nhận**";
        } else {
            status =
                "● `⏳` **Đang thực hiện**";
        }

        embed.addFields({
            name:
                `● \`${definition.emoji}\` ${definition.name}`,

            value:
                [
                    `> ${definition.description}`,
                    "",
                    `● \`📊\` Tiến độ · **${progress}/${definition.target}**`,
                    `● \`📈\` Hoàn thành · **${percent}%**`,
                    `● \`💰\` Thưởng · **${definition.reward.toLocaleString()} Mora**`,
                    `● \`⭐\` XP · **+${definition.xp}**`,
                    "",
                    status
                ].join("\n"),

            inline: false
        });
    }

    embed.setFooter({
        text:
            "● `🍃` Venti · Daily Quest"
    });

    embed.setTimestamp();

    return embed;
}

// ==========================================
// 🔘 QUEST BUTTONS
// ==========================================

function createQuestButtons(
    userId,
    quests
) {
    const row =
        new ActionRowBuilder();

    for (
        const quest of quests
    ) {
        const definition =
            getQuestDefinition(
                quest.id
            );

        if (!definition) {
            continue;
        }

        const completed =
            Number(
                quest.progress || 0
            ) >=
            definition.target;

        let label;
        let emoji;
        let style;
        let disabled;

        if (quest.claimed) {
            label = "Đã nhận";
            emoji = "✅";
            style =
                ButtonStyle.Secondary;
            disabled = true;
        } else if (completed) {
            label = "Nhận thưởng";
            emoji = "🎁";
            style =
                ButtonStyle.Success;
            disabled = false;
        } else {
            label = "Chưa xong";
            emoji = "⏳";
            style =
                ButtonStyle.Secondary;
            disabled = true;
        }

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `quest_claim_${userId}_${quest.id}`
                )
                .setLabel(label)
                .setEmoji(emoji)
                .setStyle(style)
                .setDisabled(disabled)
        );
    }

    return row;
}

// ==========================================
// 📜 SEND QUEST MENU
// ==========================================

async function sendQuestMenu(
    message,
    userId,
    quests,
    user
) {
    const embed =
        createQuestEmbed(
            quests,
            user
        );

    const buttons =
        createQuestButtons(
            userId,
            quests
        );

    const msg =
        await message.reply({
            embeds: [embed],
            components: [buttons]
        });

    const collector =
        msg.createMessageComponentCollector({
            time: 180000
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
                            "● `❌` Đây không phải quest của bạn.",
                        ephemeral: true
                    });
                }

                const prefix =
                    `quest_claim_${userId}_`;

                if (
                    !interaction.customId.startsWith(
                        prefix
                    )
                ) {
                    return;
                }

                const questId =
                    interaction.customId
                        .replace(
                            prefix,
                            ""
                        );

                await claimQuest(
                    interaction,
                    userId,
                    questId
                );
            } catch (error) {
                console.error(
                    "[quest collector]",
                    error
                );

                if (
                    !interaction.replied &&
                    !interaction.deferred
                ) {
                    await interaction.reply({
                        content:
                            "● `❌` Có lỗi xảy ra khi xử lý quest.",
                        ephemeral: true
                    });
                }
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

// ==========================================
// 🎁 CLAIM QUEST
// ==========================================

async function claimQuest(
    interaction,
    userId,
    questId
) {
    const user =
        User.getOrCreate(
            userId
        );

    if (!user) {
        return interaction.reply({
            content:
                "● `❌` Không tìm thấy dữ liệu người chơi.",
            ephemeral: true
        });
    }

    const quests =
        getDailyQuests(user);

    const quest =
        quests.find(
            item =>
                item.id === questId
        );

    const definition =
        getQuestDefinition(
            questId
        );

    if (
        !quest ||
        !definition
    ) {
        return interaction.reply({
            content:
                "● `❌` Quest không tồn tại.",
            ephemeral: true
        });
    }

    if (quest.claimed) {
        return interaction.reply({
            content:
                "● `✅` Bạn đã nhận thưởng quest này rồi.",
            ephemeral: true
        });
    }

    const progress =
        Number(
            quest.progress || 0
        );

    if (
        progress <
        definition.target
    ) {
        return interaction.reply({
            content:
                [
                    "● `⏳` **Quest chưa hoàn thành**",
                    "",
                    `> Tiến độ: **${progress}/${definition.target}**`,
                    `> Còn thiếu: **${definition.target - progress}**`
                ].join("\n"),
            ephemeral: true
        });
    }

    // ======================================
    // 💰 REWARD
    // ======================================

    User.addBalance(
        userId,
        definition.reward
    );

    // ======================================
    // ⭐ XP
    // ======================================

    User.addXP(
        userId,
        definition.xp
    );

    // ======================================
    // ✅ CLAIMED
    // ======================================

    quest.claimed =
        true;

    await saveQuests(
        userId,
        quests
    );

    const updatedUser =
        User.getOrCreate(
            userId
        );

    return interaction.update({
        embeds: [
            createQuestEmbed(
                quests,
                updatedUser
            )
        ],

        components: [
            createQuestButtons(
                userId,
                quests
            )
        ]
    });
}

// ==========================================
// 🎮 COMMAND
// ==========================================

module.exports = {
    name: "quest",

    aliases: [
        "vquest",
        "quests"
    ],

    description:
        "Xem nhiệm vụ hằng ngày.",

    async execute(message) {
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(
                userId
            );

        if (!user) {
            return message.reply({
                content:
                    "● `❌` Không thể tạo dữ liệu người chơi."
            });
        }

        const quests =
            getDailyQuests(
                user
            );

        // Chỉ save khi quest chưa có
        // hoặc đã sang ngày mới.
        if (
            !user.quests ||
            user.quests.date !==
                getToday()
        ) {
            await saveQuests(
                userId,
                quests
            );
        }

        const displayUser = {
            ...user,
            username:
                message.author.globalName ||
                message.author.username
        };

        return sendQuestMenu(
            message,
            userId,
            quests,
            displayUser
        );
    },

    // ======================================
    // EXPORT API CHO FISH / FARM / SELL
    // ======================================

    QUESTS,

    getToday,
    getDailyQuests,
    saveQuests,
    addProgress,
    addFishProgress,
    addFarmProgress,
    addSellProgress,
    createQuestEmbed,
    createQuestButtons
};
