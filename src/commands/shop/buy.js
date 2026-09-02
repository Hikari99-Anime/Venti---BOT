
const {
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

const Item =
    require("../../database/models/Item");

// ═══════════════════════════════════════
// VENTI • BUY
// ═══════════════════════════════════════

function safeEmoji(
    emoji,
    fallback = "📦"
) {
    if (!emoji) {
        return fallback;
    }

    const value =
        String(emoji).trim();

    // Không cho custom emoji
    if (
        value.includes("<") ||
        value.includes(">") ||
        value.includes(":")
    ) {
        return fallback;
    }

    if (
        value.length > 8
    ) {
        return fallback;
    }

    return value;
}

// ═══════════════════════════════════════
// COMMAND
// ═══════════════════════════════════════

module.exports = {
    name: "buy",

    aliases: [
        "purchase",
        "vbuy"
    ],

    description:
        "Mua item từ shop.",

    usage:
        "Vbuy <item> [số lượng]",

    category:
        "economy",

    async execute(
        message,
        args
    ) {
        try {
            const itemId =
                args[0]
                    ?.toLowerCase()
                    .trim();

            const amount =
                Math.max(
                    1,
                    parseInt(
                        args[1],
                        10
                    ) || 1
                );

            // ═══════════════════════
            // THIẾU ITEM
            // ═══════════════════════

            if (!itemId) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                "#f2a7a7"
                            )
                            .setTitle(
                                "🍃 Venti Shop"
                            )
                            .setDescription(
                                [
                                    "● `🛒` **Cách sử dụng**",
                                    "> `Vbuy <item> [số lượng]`",
                                    "",
                                    "● `🌱` **Ví dụ**",
                                    "> `Vbuy apple 5`",
                                    "> `Vbuy small_fish 10`"
                                ].join("\n")
                            )
                    ]
                });
            }

            // ═══════════════════════
            // LẤY ITEM
            // ═══════════════════════

            const item =
                Item.get(
                    itemId
                );

            if (!item) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                "#f2a7a7"
                            )
                            .setTitle(
                                "🍃 Không tìm thấy item"
                            )
                            .setDescription(
                                [
                                    "● `📦` **Item**",
                                    `> \`${itemId}\``,
                                    "",
                                    "● `❌` Item này không tồn tại trong shop."
                                ].join("\n")
                            )
                    ]
                });
            }

            // ═══════════════════════
            // GIÁ MUA
            // ═══════════════════════

            const price =
                Number(
                    item.price ??
                    item.buyPrice ??
                    0
                );

            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                "#f2a7a7"
                            )
                            .setTitle(
                                "🍃 Item không thể mua"
                            )
                            .setDescription(
                                [
                                    "● `📦` **Item**",
                                    `> ${safeEmoji(item.emoji)} ${item.name}`,
                                    "",
                                    "● `❌` Item này chưa được thiết lập giá mua."
                                ].join("\n")
                            )
                    ]
                });
            }

            // ═══════════════════════
            // TOTAL
            // ═══════════════════════

            const total =
                price *
                amount;

            // ═══════════════════════
            // USER
            // ═══════════════════════

            const userId =
                message.author.id;

            const user =
                User.getOrCreate(
                    userId
                );

            if (!user) {
                return message.reply({
                    content:
                        "🍃 Không thể tải dữ liệu người dùng."
                });
            }

            const balance =
                Number(
                    user.balance || 0
                );

            // ═══════════════════════
            // KHÔNG ĐỦ MORA
            // ═══════════════════════

            if (
                balance <
                total
            ) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                "#f2a7a7"
                            )
                            .setTitle(
                                "💸 Không đủ Mora"
                            )
                            .setDescription(
                                [
                                    `● \`${safeEmoji(item.emoji)}\` **${item.name}**`,
                                    `> ×${amount}`,
                                    "",
                                    "● `💰` **Cần**",
                                    `> ${total.toLocaleString()} Mora`,
                                    "",
                                    "● `💳` **Bạn có**",
                                    `> ${balance.toLocaleString()} Mora`,
                                    "",
                                    `● \`❌\` **Thiếu**`,
                                    `> ${(total - balance).toLocaleString()} Mora`
                                ].join("\n")
                            )
                    ]
                });
            }

            // ═══════════════════════
            // TRỪ MORA
            // ═══════════════════════

            const removed =
                User.removeBalance(
                    userId,
                    total
                );

            if (
                removed === false
            ) {
                return message.reply({
                    content:
                        "🍃 Không thể trừ Mora. Vui lòng thử lại."
                });
            }

            // ═══════════════════════
            // ADD ITEM
            // ═══════════════════════

            try {
                Item.add(
                    userId,
                    itemId,
                    amount
                );
            } catch (error) {
                // Hoàn tiền nếu thêm item thất bại
                if (
                    typeof User.addBalance ===
                    "function"
                ) {
                    User.addBalance(
                        userId,
                        total
                    );
                }

                console.error(
                    "[Vbuy Item.add]",
                    error
                );

                return message.reply({
                    content:
                        "🍃 Không thể thêm item vào túi. Mora đã được hoàn lại."
                });
            }

            // ═══════════════════════
            // USER MỚI
            // ═══════════════════════

            const updatedUser =
                User.get(
                    userId
                ) ||
                User.getOrCreate(
                    userId
                );

            const newBalance =
                Number(
                    updatedUser?.balance ||
                    0
                );

            // ═══════════════════════
            // SUCCESS
            // ═══════════════════════

            const emoji =
                safeEmoji(
                    item.emoji
                );

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            "#a8d8a8"
                        )
                        .setTitle(
                            "♡ Mua thành công"
                        )
                        .setDescription(
                            [
                                `● \`${emoji}\` **${item.name}**`,
                                `> ×${amount}`,
                                "",
                                "● `💰` **Đơn giá**",
                                `> ${price.toLocaleString()} Mora`,
                                "",
                                "● `💸` **Đã trả**",
                                `> -${total.toLocaleString()} Mora`,
                                "",
                                "● `💳` **Mora còn lại**",
                                `> ${newBalance.toLocaleString()} Mora`,
                                "",
                                "● `🎒` **Inventory**",
                                "> Đã thêm vật phẩm vào túi."
                            ].join("\n")
                        )
                        .setFooter({
                            text:
                                "♡ Venti Shop · Windrise"
                        })
                        .setTimestamp()
                ]
            });

        } catch (error) {
            console.error(
                "[Vbuy]",
                error
            );

            return message.reply({
                content:
                    "🍃 Có lỗi xảy ra khi mua item."
            }).catch(
                () => {}
            );
        }
    }
};

