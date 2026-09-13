
const {
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

const DAILY_COOLDOWN =
    24 * 60 * 60 * 1000;

const STREAK_RESET =
    48 * 60 * 60 * 1000;

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

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

// ==========================================
// 🎁 DAILY
// ==========================================

module.exports = {
    name: "daily",

    aliases: [
        "vdaily"
    ],

    description:
        "Nhận phần thưởng hằng ngày.",

    usage:
        "Vdaily",

    async execute(message) {

        const userId =
            message.author.id;

        const user =
            User.getOrCreate(
                userId
            );

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

        // ======================================
        // ⏳ COOLDOWN
        // ======================================

        if (
            lastDaily > 0 &&
            now - lastDaily <
                DAILY_COOLDOWN
        ) {

            const remaining =
                DAILY_COOLDOWN -
                (now - lastDaily);

            const embed =
                new EmbedBuilder()
                    .setColor(
                        "#A8DCC0"
                    )

                    .setAuthor({
                        name:
                            `☁️ ${message.author.globalName || message.author.username} · Columbina`,
                        iconURL:
                            message.author.displayAvatarURL({
                                extension: "png",
                                size: 128
                            })
                    })

                    .setTitle(
                        "🍃 Daily Chưa Sẵn Sàng"
                    )

                    .setDescription(
                        "☁️ `🍃` **Phần thưởng hôm nay đã được nhận**\n\n" +

                        "- `⏰` **Thời gian**\n" +
                        `> \`🕐 Nhận lại sau : ${formatTime(remaining)}\`\n\n` +

                        "- `🔥` **Daily Streak**\n" +
                        `> \`🔥 Streak      : ${oldStreak} ngày\`\n\n` +

                        "☕ `🍃` **Quay lại sau nhé.**"
                    )

                    .setThumbnail(
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 256
                        })
                    )

                    .setFooter({
                        text:
                            "☁️ Columbina • Cozy Corner 🍃"
                    })

                    .setTimestamp();

            return message.reply({
                embeds: [
                    embed
                ]
            });
        }

        // ======================================
        // 🔥 TÍNH STREAK
        // ======================================

        let streak = 1;

        if (
            lastDaily > 0 &&
            now - lastDaily <=
                STREAK_RESET
        ) {
            streak =
                oldStreak + 1;
        }

        // ======================================
        // 🎁 TÍNH THƯỞNG
        // ======================================

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

        // ======================================
        // 💰 CỘNG MORA
        // ======================================

        User.addBalance(
            userId,
            reward
        );

        // ======================================
        // 💾 LƯU DAILY
        // ======================================

        User.update(
            userId,
            {
                lastDaily:
                    now,

                dailyStreak:
                    streak
            }
        );

        // ======================================
        // 🔄 USER MỚI
        // ======================================

        const updatedUser =
            User.getOrCreate(
                userId
            );

        const balance =
            Number(
                updatedUser.balance || 0
            );

        // ======================================
        // 🎉 SUCCESS EMBED
        // ======================================

        const embed =
            new EmbedBuilder()
                .setColor(
                    "#A8DCC0"
                )

                .setAuthor({
                    name:
                        `☁️ ${message.author.globalName || message.author.username} · Columbina`,
                    iconURL:
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 128
                        })
                })

                .setTitle(
                    "🍃 Daily Reward"
                )

                .setDescription(
                    "☁️ `🍃` **Một phần thưởng nhỏ cho hành trình của bạn**\n\n" +

                    "- `🎁` **Phần thưởng**\n" +
                    `> \`💰 Phần thưởng : +${money(reward)} Mora\`\n\n` +

                    "- `🔥` **Daily Streak**\n" +
                    `> \`🔥 Streak      : ${streak} ngày\`\n\n` +

                    "- `💳` **Tài chính**\n" +
                    `> \`💵 Số dư      : +${money(balance)} Mora\`\n\n` +

                    "☕ `🍃` **Chúc bạn một ngày thật chill**"
                )

                .setThumbnail(
                    message.author.displayAvatarURL({
                        extension: "png",
                        size: 256
                    })
                )

                .setFooter({
                    text:
                        "☁️ Columbina • Cozy Corner 🍃"
                })

                .setTimestamp();

        return message.reply({
            embeds: [
                embed
            ]
        });
    }
};

