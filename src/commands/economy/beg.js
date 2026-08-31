const User = require("../../database/models/User");
const {
    checkCooldown,
    formatRemaining
} = require("../../utils/cooldown");

const responses = [
    "🍃 Venti thấy bạn đang khá khó khăn.",
    "🎵 Một người qua đường nghe tiếng hát của bạn.",
    "🍎 Một người dân Mondstadt thương tình.",
    "✨ Gió mang một ít Mora đến cho bạn."
];

module.exports = {
    name: "beg",
    aliases: ["xin"],
    description: "Xin Mora.",

    async execute(message) {
        const cooldown = checkCooldown(
            message.author.id,
            "beg",
            30 * 1000
        );

        if (cooldown.active) {
            return message.reply(
                `🍃 Thử lại sau **${formatRemaining(cooldown.remaining)}**.`
            );
        }

        const success =
            Math.random() < 0.8;

        if (!success) {
            return message.reply(
                "🍃 Hôm nay vận may không đứng về phía bạn..."
            );
        }

        const reward =
            Math.floor(Math.random() * 201) + 50;

        User.getOrCreate(message.author.id);
        User.addBalance(
            message.author.id,
            reward
        );
        User.addXP(
            message.author.id,
            10
        );

        const response =
            responses[
                Math.floor(
                    Math.random() *
                    responses.length
                )
            ];

        return message.reply(
            `${response}\n` +
            `💰 Bạn nhận được **${reward.toLocaleString()} Mora**!\n` +
            `✨ +10 XP`
        );
    }
};
