
const User =
    require("../../database/models/User");

const {
    EmbedBuilder
} = require("discord.js");

module.exports = {

    name:
        "pay",

    aliases: [
        "give"
    ],

    description:
        "Chuyển Mora cho người khác.",

    async execute(
        message,
        args
    ) {

        // =====================================
        // 👤 TARGET
        // =====================================

        const target =
            message.mentions.users.first();

        if (!target) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#f2a7a7"
                        )

                        .setTitle(
                            "🍃 Không thể chuyển Mora"
                        )

                        .setDescription(
                            [
                                "☁️ `🍃` **Bạn chưa chọn người nhận.**",
                                "",
                                "> Hãy mention người bạn muốn chuyển Mora.",
                                "> Ví dụ: `Vpay @user 1000`"
                            ].join("\n")
                        )

                ]

            });
        }

        // =====================================
        // 🤖 BOT CHECK
        // =====================================

        if (target.bot) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#f2a7a7"
                        )

                        .setTitle(
                            "🤖 Không thể chuyển Mora"
                        )

                        .setDescription(
                            [
                                "☁️ `🤖` **Người nhận là bot.**",
                                "",
                                "> Bạn chỉ có thể chuyển Mora cho người chơi."
                            ].join("\n")
                        )

                ]

            });
        }

        // =====================================
        // 👤 SELF CHECK
        // =====================================

        if (
            target.id ===
            message.author.id
        ) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#f2a7a7"
                        )

                        .setTitle(
                            "🍃 Không thể chuyển Mora"
                        )

                        .setDescription(
                            [
                                "☁️ `🍃` **Bạn không thể chuyển Mora cho chính mình.**",
                                "",
                                "> Hãy chọn một người chơi khác."
                            ].join("\n")
                        )

                ]

            });
        }

        // =====================================
        // 💰 AMOUNT
        // =====================================

        const amount =
            Number(
                args[1] ||
                args[0]
            );

        if (
            !Number.isSafeInteger(
                amount
            ) ||
            amount <= 0
        ) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#f2a7a7"
                        )

                        .setTitle(
                            "💰 Số Mora không hợp lệ"
                        )

                        .setDescription(
                            [
                                "☁️ `💰` **Vui lòng nhập số Mora hợp lệ.**",
                                "",
                                "> Số tiền phải là số nguyên dương.",
                                "> Ví dụ: `Vpay @user 1000`"
                            ].join("\n")
                        )

                ]

            });
        }

        // =====================================
        // 💰 SENDER
        // =====================================

        const sender =
            User.getOrCreate(
                message.author.id
            );

        const balance =
            Number(
                sender.balance || 0
            );

        // =====================================
        // 💸 NOT ENOUGH MONEY
        // =====================================

        if (
            balance <
            amount
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
                                "☁️ `💰` **Số dư của bạn không đủ để thực hiện giao dịch.**",
                                "",
                                "- `💳` **Tài chính**",

                                `> \`💵 Ví         : ${balance.toLocaleString("vi-VN")} Mora\``,

                                `> \`💸 Cần       : ${amount.toLocaleString("vi-VN")} Mora\``,

                                `> \`📉 Thiếu     : ${(amount - balance).toLocaleString("vi-VN")} Mora\``
                            ].join("\n")
                        )

                        .setFooter({
                            text:
                                "☁️ Columbina • Cozy Corner 🍃"
                        })

                ]

            });
        }

        // =====================================
        // 👤 CREATE TARGET
        // =====================================

        User.getOrCreate(
            target.id
        );

        // =====================================
        // 💸 REMOVE SENDER MONEY
        // =====================================

        const removed =
            User.removeBalance(
                message.author.id,
                amount
            );

        if (
            removed === false
        ) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#f2a7a7"
                        )

                        .setTitle(
                            "❌ Giao dịch thất bại"
                        )

                        .setDescription(
                            [
                                "☁️ `🍃` **Không thể thực hiện giao dịch.**",
                                "",
                                "> Mora của bạn chưa được chuyển.",
                                "> Vui lòng thử lại."
                            ].join("\n")
                        )

                ]

            });
        }

        // =====================================
        // 💰 ADD TARGET MONEY
        // =====================================

        User.addBalance(
            target.id,
            amount
        );

        // =====================================
        // 📊 UPDATED STATS
        // =====================================

        const updatedSender =
            User.getOrCreate(
                message.author.id
            );

        const updatedTarget =
            User.getOrCreate(
                target.id
            );

        const senderBalance =
            Number(
                updatedSender.balance || 0
            );

        const receiverBalance =
            Number(
                updatedTarget.balance || 0
            );

        // =====================================
        // 👤 RECEIVER NAME
        // =====================================

        const receiverName =
            target.globalName ||
            target.username;

        // =====================================
        // 👤 SENDER NAME
        // =====================================

        const senderName =
            message.author.globalName ||
            message.author.username;

        // =====================================
        // ✅ SUCCESS EMBED
        // =====================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#A8DCC0"
                )

                .setAuthor({
                    name:
                        `☁️ ${senderName} · Columbina`,

                    iconURL:
                        message.author.displayAvatarURL({
                            extension:
                                "png",

                            size:
                                128
                        })
                })

                .setTitle(
                    "💸 Chuyển Mora thành công"
                )

                .setDescription(
                    [
                        "☁️ `🍃` **Giao dịch Mora đã hoàn tất.**",
                        "",

                        "- `👤` **Người nhận**",

                        `> ${target}`,

                        `> \`👤\` ${receiverName}`,

                        "",

                        "- `💰` **Giao dịch**",

                        `> \`💸\` +${amount.toLocaleString("vi-VN")} Mora`,

                        "",

                        "- `💳` **Tài chính của bạn**",

                        `> \`💵 Ví         : ${senderBalance.toLocaleString("vi-VN")} Mora\``,

                        "",

                        "- `🍃` **Trạng thái**",

                        "> `✅` Mora đã được chuyển thành công.",

                        "",

                        "☕ `🍃` **Chúc bạn giao dịch vui vẻ.**"
                    ].join("\n")
                )

                .setThumbnail(
                    target.displayAvatarURL({
                        extension:
                            "png",

                        size:
                            256
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

