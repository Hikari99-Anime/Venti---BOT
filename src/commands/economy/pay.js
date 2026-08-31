const User = require("../../database/models/User");

module.exports = {
    name: "pay",
    aliases: ["give"],
    description: "Chuyển Mora cho người khác.",

    async execute(message, args) {
        const target =
            message.mentions.users.first();

        const amount =
            Number(args[1] || args[0]);

        if (!target) {
            return message.reply(
                "🍃 Hãy mention người bạn muốn chuyển Mora."
            );
        }

        if (target.bot) {
            return message.reply(
                "🍃 Bạn không thể chuyển Mora cho bot."
            );
        }

        if (target.id === message.author.id) {
            return message.reply(
                "🍃 Bạn không thể chuyển Mora cho chính mình."
            );
        }

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return message.reply(
                "🍃 Số Mora không hợp lệ."
            );
        }

        const sender =
            User.getOrCreate(
                message.author.id
            );

        if (sender.balance < amount) {
            return message.reply(
                `🍃 Bạn chỉ có **${sender.balance.toLocaleString()} Mora**.`
            );
        }

        User.getOrCreate(target.id);

        User.removeBalance(
            message.author.id,
            amount
        );

        User.addBalance(
            target.id,
            amount
        );

        return message.reply(
            `💸 Đã chuyển **${amount.toLocaleString()} Mora** cho ${target}.`
        );
    }
};
