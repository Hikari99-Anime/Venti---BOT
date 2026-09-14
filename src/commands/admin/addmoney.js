const {
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 💰 ADD MONEY — BOT OWNER ONLY
// ==========================================

module.exports = {
    name: "addmoney",

    aliases: [
        "addm",
        "givemoney",
        "give"
    ],

    description:
        "Owner bot cộng Mora cho người chơi.",

    usage:
        "Vaddmoney @user <amount>",

    category:
        "admin",

    async execute(message, args) {

        // ======================================
        // 🔐 BOT OWNER CHECK
        // ======================================

        const OWNER_ID =
            String(
                process.env.OWNER_ID || ""
            ).trim();

        const AUTHOR_ID =
            String(
                message.author.id
            ).trim();

        if (
            !OWNER_ID ||
            AUTHOR_ID !== OWNER_ID
        ) {
            return message.reply({
                content:
                    "`❌` Chỉ Owner của bot mới có thể sử dụng lệnh này."
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
            /^\d{17,20}$/.test(
                args[0]
            )
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

        const amountArg =
            args[1];

        if (!amountArg) {

            return message.reply({
                content:
                    "`❌` Vui lòng nhập số Mora cần cộng."
            });
        }

        // Cho phép:
        // 1000
        // 1,000
        // 1.000

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
        // 👤 NAME
        // ======================================

        const targetName =
            target
                ? (
                    target.globalName ||
                    target.username
                )
                : userId;

        const ownerName =
            message.author.globalName ||
            message.author.username;

        // ======================================
        // 🌙 EMBED
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#A8DCC0"
                )

                .setAuthor({
                    name:
                        `☁️ ${ownerName} · Columbina`,

                    iconURL:
                        message.author.displayAvatarURL({
                            extension: "png",
                            size: 128
                        })
                })

                .setTitle(
                    "🍃 Mora Đã Được Cộng"
                )

                .setDescription(

                    "☁️ `🍃` **Một góc nhỏ của hành trình**\n\n" +

                    "- `👤` **Người nhận**\n" +

                    `> \`👤 Người chơi  : ${targetName}\`\n` +

                    `> \`🆔 ID         : ${userId}\`\n\n` +

                    "- `💰` **Giao dịch**\n" +

                    `> \`💵 Đã cộng     : +${amount.toLocaleString("vi-VN")} Mora\`\n` +

                    `> \`💳 Số dư cũ   : ${oldBalance.toLocaleString("vi-VN")} Mora\`\n` +

                    `> \`💎 Số dư mới  : ${newBalance.toLocaleString("vi-VN")} Mora\`\n\n` +

                    "- `👑` **Người thực hiện**\n" +

                    `> \`👤 Owner      : ${ownerName}\`\n\n` +

                    "☕ `🍃` **Mora đã được thêm vào ví**\n"
                )

                .setThumbnail(

                    target
                        ? target.displayAvatarURL({
                            extension: "png",
                            size: 256
                        })
                        : message.client.user.displayAvatarURL({
                            extension: "png",
                            size: 256
                        })
                )

                .setFooter({
                    text:
                        "☁️ Columbina • Cozy Corner 🍃"
                })

                .setTimestamp();

        // ======================================
        // 📤 SEND
        // ======================================

        return message.reply({
            embeds: [
                embed
            ]
        });
    }
};
