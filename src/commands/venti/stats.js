
const {
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

module.exports = {
    name: "stats",

    aliases: [
        "stat",
        "statistics",
        "vstats"
    ],

    description:
        "Xem thống kê hành trình.",

    async execute(message) {
        const user =
            User.getOrCreate(
                message.author.id
            );

        const stats =
            user.stats || {};

        // 💰 Tài chính
        const balance =
            Number(user.balance || 0);

        const bank =
            Number(user.bank || 0);

        // 🎮 Minigame
        const games =
            Number(stats.games || 0);

        const wins =
            Number(stats.wins || 0);

        const losses =
            Number(stats.losses || 0);

        const winRate =
            games > 0
                ? Math.round(
                    (wins / games) * 100
                )
                : 0;

        // 🎣 Cá
        let fish =
            Number(stats.fish || 0);

        if (
            !stats.fish &&
            user.inventory
        ) {
            const fishIds = [
                "small_fish",
                "blue_fish",
                "golden_fish",
                "crystal_fish",
                "wind_fish"
            ];

            fish =
                fishIds.reduce(
                    (
                        total,
                        id
                    ) =>
                        total +
                        Number(
                            user.inventory[id] || 0
                        ),
                    0
                );
        }

        // 🌾 Farm
        const farm =
            Number(
                stats.farm ||
                user.farmCount ||
                0
            );

        // 📜 Quest
        const quest =
            Number(
                stats.quest ||
                user.quest ||
                0
            );

        // 🏆 Achievement
        const achievements =
            user.achievements || {};

        const achievementCount =
            Object.values(
                achievements
            ).filter(
                a =>
                    a &&
                    a.unlocked
            ).length;

        // ⭐ Level
        const level =
            Number(
                user.level || 1
            );

        const xp =
            Number(
                user.xp || 0
            );

        const nextXP =
            level * 500;

        // 💼 Work
        const work =
            Number(
                stats.work || 0
            );

        // 🔥 Daily
        const streak =
            Number(
                user.dailyStreak || 0
            );

        const name =
            message.author.globalName ||
            message.author.username;

        const embed =
            new EmbedBuilder()
                .setColor("#A8DCC0")

                .setAuthor({
                    name:
                        `☁️ ${name} · Venti`,
                    iconURL:
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 128
                        })
                })

                .setTitle(
                    "🍃 Thống Kê Hành Trình"
                )

                .setDescription(
                    "୨୧ ───────── ୨୧\n" +
                    "☁️ Một góc nhỏ của bạn 🍃\n" +
                    "୨୧ ───────── ୨୧\n\n" +

                    `💰 **Mora** · ${balance.toLocaleString()} ୨୧ 🏦 ${bank.toLocaleString()}\n` +

                    `🎮 **Game** · W/L ${wins}/${losses} ୨୧ 🍀 ${winRate}%\n` +

                    `🎣 **Cá** · 🐟 ${fish}\n` +

                    `🌾 **Farm** · 🌱 ${farm}\n` +

                    `📜 **Quest** · 📖 ${quest}\n` +

                    `🏆 **Thành tích** · 🏅 ${achievementCount}\n` +

                    `⭐ **Level** · ${level} ୨୧ ✨ ${xp}/${nextXP}\n` +

                    `💼 **Làm việc** · ${work}\n` +

                    `🔥 **Daily** · ${streak} ngày\n\n` +

                    "୨୧ ───────── ୨୧\n" +
                    "🍃 Chúc bạn một ngày thật chill ☕"
                )

                .setThumbnail(
                    message.author.displayAvatarURL({
                        extension: "png",
                        size: 256
                    })
                )

                .setFooter({
                    text:
                        "☁️ Venti · Cozy corner 🍃"
                })

                .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

