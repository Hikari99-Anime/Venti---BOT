const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

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

        const quests =
            getDailyQuests(
                user
            );

        saveQuests(
            userId,
            quests
        );

        return sendQuestMenu(
            message,
            userId,
            quests
        );
    }
};

// ==========================================
// 📅 DAILY QUEST
// ==========================================

function getToday() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}

function getDailyQuests(user) {
    const today =
        getToday();

    if (
        user.quests &&
        user.quests.date ===
            today &&
        Array.isArray(
            user.quests.daily
        ) &&
        user.quests.daily.length
    ) {
        return user.quests.daily;
    }

    return QUESTS.map(
        quest => ({
            id: quest.id,
            progress: 0,
            claimed: false
        })
    );
}

// ==========================================
// 💾 SAVE QUEST
// ==========================================

function saveQuests(
    userId,
    quests
) {
    User.update(
        userId,
        {
            quests: {
                date:
                    getToday(),
                daily:
                    quests
            }
        }
    );
}

// ==========================================
// 📜 QUEST MENU
// ==========================================

async function sendQuestMenu(
    message,
    userId,
    quests
) {
    const embed =
        createQuestEmbed(
            quests
        );

    const buttons =
        new ActionRowBuilder();

    for (
        const quest of quests
    ) {
        const definition =
            QUESTS.find(
                q =>
                    q.id ===
                    quest.id
            );

        if (!definition) {
            continue;
        }

        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `quest_claim_${userId}_${quest.id}`
                )
                .setLabel(
                    quest.claimed
                        ? "Đã nhận"
                        : `Nhận ${definition.reward}`
                )
                .setEmoji(
                    quest.claimed
                        ? "✅"
                        : "🎁"
                )
                .setStyle(
                    quest.claimed
                        ? ButtonStyle.Secondary
                        : ButtonStyle.Success
                )
                .setDisabled(
                    quest.claimed
                )
        );
    }

    const msg =
        await message.reply({
            embeds: [embed],
            components: [
                buttons
            ]
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
                        "❌ Đây không phải quest của bạn.",
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
// 📊 EMBED
// ==========================================

function createQuestEmbed(
    quests
) {
    const embed =
        new EmbedBuilder()
            .setColor(
                "#9B59B6"
            )
            .setTitle(
                "📜 Daily Quest"
            )
            .setDescription(
                "Hoàn thành nhiệm vụ để nhận Mora và XP."
            );

    for (
        const quest of quests
    ) {
        const definition =
            QUESTS.find(
                q =>
                    q.id ===
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
            Math.floor(
                (progress /
                    definition.target) *
                    100
            );

        const status =
            quest.claimed
                ? "✅ Đã nhận"
                : progress >=
                  definition.target
                ? "🎁 Sẵn sàng nhận"
                : "⏳ Đang thực hiện";

        embed.addFields({
            name:
                `${definition.emoji} ${definition.name}`,
            value:
                `${definition.description}\n\n` +
                `📊 **${progress}/${definition.target}** (${percent}%)\n` +
                `💰 **${definition.reward.toLocaleString()} Mora**\n` +
                `⭐ **${definition.xp} XP**\n` +
                `${status}`,
            inline: false
        });
    }

    return embed;
}

// ==========================================
// 🎁 CLAIM
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

    const quests =
        getDailyQuests(
            user
        );

    const quest =
        quests.find(
            q =>
                q.id ===
                questId
        );

    const definition =
        QUESTS.find(
            q =>
                q.id ===
                questId
        );

    if (
        !quest ||
        !definition
    ) {
        return interaction.reply({
            content:
                "❌ Quest không tồn tại.",
            ephemeral: true
        });
    }

    if (
        quest.claimed
    ) {
        return interaction.reply({
            content:
                "❌ Bạn đã nhận quest này rồi.",
            ephemeral: true
        });
    }

    if (
        Number(
            quest.progress || 0
        ) <
        definition.target
    ) {
        return interaction.reply({
            content:
                `⏳ Chưa hoàn thành quest!\n📊 ${quest.progress}/${definition.target}`,
            ephemeral: true
        });
    }

    // 💰 Mora
    User.addBalance(
        userId,
        definition.reward
    );

    // ⭐ XP
    User.addXP(
        userId,
        definition.xp
    );

    quest.claimed =
        true;

    saveQuests(
        userId,
        quests
    );

    return interaction.update({
        embeds: [
            createQuestEmbed(
                quests
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
// 🔘 BUTTONS
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
            QUESTS.find(
                q =>
                    q.id ===
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

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `quest_claim_${userId}_${quest.id}`
                )
                .setLabel(
                    quest.claimed
                        ? "Đã nhận"
                        : completed
                        ? "Nhận thưởng"
                        : "Chưa xong"
                )
                .setEmoji(
                    quest.claimed
                        ? "✅"
                        : completed
                        ? "🎁"
                        : "⏳"
                )
                .setStyle(
                    quest.claimed
                        ? ButtonStyle.Secondary
                        : completed
                        ? ButtonStyle.Success
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    quest.claimed ||
                    !completed
                )
        );
    }

    return row;
}

