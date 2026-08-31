const {
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

const DAILY_COOLDOWN =
    24 * 60 * 60 * 1000;

const STREAK_RESET =
    48 * 60 * 60 * 1000;

module.exports = {
    name: "daily",
    aliases: ["vdaily"],
    description:
        "Nhận phần thưởng hằng ngày.",

    async execute(message) {
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(userId);

        const now =
            Date.now();

        const lastDaily =
            Number(
                user.lastDaily || 0
            );

        const oldStreak =
            Number(
                user.dailyStreak || 0
            );

        // =====================================
        // ⏳ CHECK COOLDOWN
        // =====================================

        if (
            lastDaily > 0 &&
            now - lastDaily <
                DAILY_COOLDOWN
        ) {
            const remaining =
                DAILY_COOLDOWN -
                (now - lastDaily);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            "#5865F2"
                        )
                        .setTitle(
                            "⏳ Daily chưa sẵn sàng"
                        )
                        .setDescription(
                            "Bạn đã nhận phần thưởng hôm nay rồi!"
                        )
                        .addFields(
                            {
                                name:
                                    "⏰ Nhận lại sau",
                                value:
                                    `**${formatTime(
                                        remaining
                                    )}**`,
                                inline:
                                    true
                            },
                            {
                                name:
                                    "🔥 Streak",
                                value:
                                    `**${oldStreak} ngày**`,
                                inline:
                                    true
                            }
                        )
                        .setFooter({
                            text:
                                "Hãy quay lại sau!"
                        })
                ]
            });
        }

        // =====================================
        // 🔥 TÍNH STREAK
        // =====================================

        let streak = 1;

        if (
            lastDaily > 0 &&
            now - lastDaily <=
                STREAK_RESET
        ) {
            streak =
                oldStreak + 1;
        }

        // =====================================
        // 🎁 TÍNH THƯỞNG
        // =====================================

        const baseReward =
            500;

        const streakBonus =
            Math.min(
                (streak - 1) * 100,
                1500
            );

        const randomBonus =
            Math.floor(
                Math.random() * 201
            );

        const reward =
            baseReward +
            streakBonus +
            randomBonus;

        // =====================================
        // 💰 CỘNG MORA
        // =====================================

        User.addBalance(
            userId,
            reward
        );

        // =====================================
        // 💾 LƯU DAILY
        // =====================================

        User.update(
            userId,
            {
                lastDaily:
                    now,

                dailyStreak:
                    streak
            }
        );

        // =====================================
        // 🔄 LẤY USER MỚI
        // =====================================

        const updatedUser =
            User.getOrCreate(
                userId
            );

        // =====================================
        // 🎉 EMBED
        // =====================================

        const embed =
            new EmbedBuilder()
                .setColor(
                    "#FFD166"
                )
                .setTitle(
                    "🎁 Daily Reward"
                )
                .setDescription(
                    `Chúc mừng **${message.author.username}**!`
                )
                .addFields(
                    {
                        name:
                            "💰 Phần thưởng",
                        value:
                            `**+${reward.toLocaleString()} Mora**`,
                        inline:
                            true
                    },
                    {
                        name:
                            "🔥 Daily Streak",
                        value:
                            `**${streak} ngày**`,
                        inline:
                            true
                    },
                    {
                        name:
                            "💳 Số dư",
                        value:
                            `**${Number(
                                updatedUser.balance ||
                                0
                            ).toLocaleString()} Mora**`,
                        inline:
                            true
                    }
                )
                .setFooter({
                    text:
                        "Quay lại ngày mai để giữ streak!"
                })
                .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

// ==========================================
// ⏰ FORMAT TIME
// ==========================================

function formatTime(ms) {
    const totalSeconds =
        Math.ceil(
            ms / 1000
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    if (hours > 0) {
        return (
            `${hours} giờ ` +
            `${minutes} phút ` +
            `${seconds} giây`
        );
    }

    return (
        `${minutes} phút ` +
        `${seconds} giây`
    );
}
