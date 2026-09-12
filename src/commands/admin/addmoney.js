
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 💰 ADD MONEY — ADMIN ONLY
// ==========================================

module.exports = {
    name: "addmoney",

    aliases: [
        "addm",
        "givemoney",
        "give"
    ],

    description:
        "Admin cộng Mora cho người chơi.",

    usage:
        "Vaddmoney @user <amount>",

    category:
        "admin",

    async execute(message, args) {

        // ======================================
        // 🔐 ADMIN CHECK
        // ======================================

        if (
            !message.member ||
            !message.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return message.reply({
                content:
                    "`❌` Bạn không có quyền sử dụng lệnh này."
            });
        }

        // ======================================
        // 👤 TARGET
        // ======================================

        const target =
            message.mentions.users.first();

        let userId;

        if (target) {
            userId =
                target.id;
        } else if (
            args[0] &&
            /^\d{17,20}$/.test(args[0])
        ) {
            userId =
                args[0];
        } else {
            return message.reply({
                content:
                    [
                        "`❌` **Thiếu người nhận.**",
                        "",
                        "> `Vaddmoney @user <amount>`",
                        "> `Vaddmoney <userID> <amount>`"
                    ].join("\n")
            });
        }

        // ======================================
        // 💰 AMOUNT
        // ======================================

        let amountArg;

        if (target) {
            amountArg =
                args[1];
        } else {
            amountArg =
                args[1];
        }

        if (!amountArg) {
            return message.reply({
                content:
                    "`❌` Vui lòng nhập số Mora cần cộng."
            });
        }

        // Cho phép 1,000 / 1.000 / 1000
        const cleanAmount =
            String(amountArg)
                .replace(/[,.]/g, "");

        const amount =
            Number(cleanAmount);

        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0
        ) {
            return message.reply({
                content:
                    "`❌` Số Mora không hợp lệ."
            });
        }

        if (
            amount >
            Number.MAX_SAFE_INTEGER
        ) {
            return message.reply({
                content:
                    "`❌` Số Mora quá lớn."
            });
        }

        // ======================================
        // 👤 GET USER
        // ======================================

        const user =
            User.getOrCreate(
                userId
            );

        if (!user) {
            return message.reply({
                content:
                    "`❌` Không thể tìm thấy hoặc tạo tài khoản."
            });
        }

        // ======================================
        // 💰 ADD BALANCE
        // ======================================

        const oldBalance =
            Number(
                user.balance || 0
            );

        const newBalance =
            oldBalance +
            amount;

        User.update(
            userId,
            {
                balance:
                    newBalance
            }
        );

        // ======================================
        // 🍃 RESULT
        // ======================================

        const targetName =
            target
                ? (
                    target.globalName ||
                    target.username
                )
                : userId;

        const embed =
            new EmbedBuilder()
                .setColor(
                    "#A8DCC0"
                )

                .setTitle(
                    "`💰` Mora đã được cộng"
                )

                .setDescription(
                    [
                        "`🍃` **Admin Economy**",
                        "",
                        "`👤` **Người nhận**",
                        `> <@${userId}>`,
                        "",
                        "`💰` **Đã cộng**",
                        `> \`+${amount.toLocaleString("vi-VN")} Mora\``,
                        "",
                        "`💳` **Số dư cũ**",
                        `> \`${oldBalance.toLocaleString("vi-VN")} Mora\``,
                        "",
                        "`💰` **Số dư mới**",
                        `> \`${newBalance.toLocaleString("vi-VN")} Mora\``,
                        "",
                        "୨୧ ─────────────── ୨୧",
                        "`🍃` Mora đã được thêm vào ví."
                    ].join("\n")
                )

                .setFooter({
                    text:
                        `Admin • ${message.author.username}`
                })

                .setTimestamp();

        return message.reply({
            embeds: [
                embed
            ]
        });
    }
};

