const User = require("../../database/models/User");
const Item = require("../../database/models/Item");

module.exports = {
    name: "buy",
    aliases: ["purchase"],
    description: "Mua item từ shop.",

    async execute(message, args) {
        const itemId = args[0]?.toLowerCase();
        const amount = Math.max(
            1,
            parseInt(args[1], 10) || 1
        );

        if (!itemId) {
            return message.reply(
                "🍃 Dùng: `Vbuy <item> [số lượng]`"
            );
        }

        const item = Item.get(itemId);

        if (!item) {
            return message.reply(
                "🍃 Item này không tồn tại trong shop."
            );
        }

        const total =
            item.sellPrice * amount;

        const user =
            User.getOrCreate(
                message.author.id
            );

        if (user.balance < total) {
            return message.reply(
                `🍃 Bạn không đủ Mora.\n` +
                `💰 Cần: **${total.toLocaleString()}**\n` +
                `💰 Có: **${user.balance.toLocaleString()}**`
            );
        }

        User.removeBalance(
            message.author.id,
            total
        );

        Item.add(
            message.author.id,
            itemId,
            amount
        );

        return message.reply(
            `🛍️ **Purchase Complete**\n` +
            `${item.emoji} ${item.name} ×${amount}\n` +
            `💸 -${total.toLocaleString()} Mora`
        );
    }
};
