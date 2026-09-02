
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
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(userId);

        const stats =
            user.stats || {};

        // ==========================================
        // 💰 ECONOMY
        // ==========================================

        const balance =
            Number(user.balance || 0);

        const bank =
            Number(user.bank || 0);

        const totalMoney =
            balance + bank;

        // ==========================================
        // 🎮 GAME
        // ==========================================

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

        // ==========================================
        // 🎣 FISHING
        // ==========================================

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
                    (total, id) =>
                        total +
                        Number(
                            user.inventory[id] || 0
                        ),
                    0
                );
        }

        // ==========================================
        // 🌾 FARM
        // ==========================================

        const farm =
            Number(
                stats.farm ??
                user.farmCount ??
                0
            );

        // ==========================================
        // 📜 QUEST
        // ==========================================

        const quest =
            Number(
                stats.quest ??
                user.quest ??
                0
            );

        // ==========================================
        // 🏆 ACHIEVEMENT
        // ==========================================

        const achievements =
            user.achievements || {};

        const achievementCount =
            Object.values(
                achievements
            ).filter(
                achievement =>
                    achievement &&
                    achievement.unlocked
            ).length;

        // ==========================================
        // ⭐ LEVEL
        // ==========================================

        const level =
            Number(user.level || 1);

        const xp =
            Number(user.xp || 0);

        const nextXP =
            level * 500;

        const xpPercent =
            Math.min(
                Math.round(
                    (xp / nextXP) * 100
                ),
                100
            );

        // ==========================================
        // 💼 WORK
        // ==========================================

        const work =
            Number(stats.work || 0);

        // ==========================================
        // 🔥 DAILY
        // ==========================================

        const streak =
            Number(
                user.dailyStreak || 0
            );

        // ==========================================
        // 👤 NAME
        // ==========================================

        const name =
            message.author.globalName ||
            message.author.username;

        // ==========================================
        // 📊 PROGRESS BAR
        // ==========================================

        const barLength = 10;

        const filled =
            Math.round(
                (xpPercent / 100) *
                barLength
            );

        const progressBar =
            "🟩".repeat(filled) +
            "⬜".repeat(
                barLength - filled
            );

        // ==========================================
        // 🍃 EMBED
        // ==========================================

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
                    "୨୧ ─────────────── ୨୧\n" +
                    "☁️ `🍃` **Một góc nhỏ của hành trình**\n" +
                    "୨୧ ─────────────── ୨୧\n\n" +

                    "● `💰` **Tài chính**\n" +
                    `> \`💵 Ví         : ${balance.toLocaleString()} Mora\`\n` +
                    `> \`🏦 Ngân hàng  : ${bank.toLocaleString()} Mora\`\n` +
                    `> \`💎 Tổng       : ${totalMoney.toLocaleString()} Mora\`\n\n` +

                    "● `⭐` **Tiến trình**\n" +
                    `> \`🌟 Level      : ${level}\`\n` +
                    `> \`✨ XP         : ${xp.toLocaleString()} / ${nextXP.toLocaleString()}\`\n` +
                    `> \`${progressBar} ${xpPercent}%\`\n\n` +

                    "● `🎮` **Mini Game**\n" +
                    `> \`🎮 Games      : ${games.toLocaleString()}\`\n` +
                    `> \`🏆 Wins       : ${wins.toLocaleString()}\`\n` +
                    `> \`💀 Losses     : ${losses.toLocaleString()}\`\n` +
                    `> \`🍀 Win Rate   : ${winRate}%\`\n\n` +

                    "● `🎣` **Phiêu lưu**\n" +
                    `> \`🐟 Cá đã bắt  : ${fish.toLocaleString()}\`\n` +
                    `> \`🌾 Thu hoạch  : ${farm.toLocaleString()}\`\n` +
                    `> \`📜 Quest      : ${quest.toLocaleString()}\`\n\n` +

                    "● `🏆` **Thành tựu**\n" +
                    `> \`🏅 Đã mở khóa : ${achievementCount}\`\n` +
                    `> \`🔥 Daily      : ${streak} ngày\`\n\n` +

                    "● `💼` **Công việc**\n" +
                    `> \`💼 Đã làm     : ${work.toLocaleString()} lần\`\n\n` +

                    "୨୧ ─────────────── ୨୧\n" +
                    "☕ `🍃` **Chúc bạn một ngày thật chill**\n" +
                    "୨୧ ─────────────── ୨୧"
                )

                .setThumbnail(
                    message.author.displayAvatarURL({
                        extension: "png",
                        size: 256
                    })
                )

                .setFooter({
                    text:
                        "☁️ Venti • Cozy Corner 🍃"
                })

                .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};

