const User = require("../../database/models/User");
const cooldown = require("../../utils/cooldown");

const {
    EmbedBuilder
} = require("discord.js");

const config = require("../../config");

const JOBS = [
    "🍃 chơi nhạc trên quảng trường",
    "🎵 biểu diễn tại quán rượu",
    "📜 giao một lá thư",
    "🌾 giúp người dân thu hoạch",
    "🪽 tìm kiếm một món đồ thất lạc"
];

module.exports = {
    name: "work",
    aliases: ["job"],
    description: "Làm việc kiếm Mora.",

    async execute(message) {
        const userId = message.author.id;

        const remaining = cooldown.check(
            userId,
            "work",
            60 * 1000
        );

        if (remaining > 0) {
            return message.reply(
                `🍃 Hãy nghỉ một chút. Thử lại sau **${Math.ceil(
                    remaining / 1000
                )}s**.`
            );
        }

        cooldown.set(
            userId,
            "work"
        );

        const reward =
            Math.floor(Math.random() * 451) + 250;

        const job =
            JOBS[Math.floor(Math.random() * JOBS.length)];

        User.addBalance(userId, reward);

        const xp = User.addXP(
            userId,
            Math.floor(Math.random() * 30) + 10
        );

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({
                name: "🍃 Venti • Work"
            })
            .setDescription(
                `You ${job}.\n\n` +
                `💰 **+${reward.toLocaleString()} Mora**\n` +
                `✨ **+XP**`
            )
            .setFooter({
                text: `Level ${xp.level}`
            })
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};
