
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

                        .setDescription(
                            "- `🍃` **Hãy mention người bạn muốn chuyển Mora.**"
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

                        .setDescription(
                            "- `🤖` **Bạn không thể chuyển Mora cho bot.**"
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

                        .setDescription(
                            "- `🍃` **Bạn không thể chuyển Mora cho chính mình.**"
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

                        .setDescription(
                            "- `💰` **Số Mora không hợp lệ.**\n" +
                            "> Vui lòng nhập một số nguyên dương."
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

        if (
            balance < amount
        ) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#f2a7a7"
                        )

                        .setDescription(
                            [
                                "- `❌` **Không đủ Mora**",
                                "",
                                `> \`💰\` Số dư: **+${balance.toLocaleString("vi-VN")} Mora**`,
                                `> \`💸\` Cần: **+${amount.toLocaleString("vi-VN")} Mora**`
                            ].join("\n")
                        )
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
        // 💸 TRANSFER
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

                        .setDescription(
                            "- `❌` **Không thể thực hiện giao dịch.**"
                        )
                ]
            });
        }

        User.addBalance(
            target.id,
            amount
        );

        // =====================================
        // ✅ SUCCESS
        // =====================================

        const updatedSender =
            User.getOrCreate(
                message.author.id
            );

        return message.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(
                        "#a8d8a8"
                    )

                    .setTitle(
                        "`💸` Chuyển Mora thành công"
                    )

                    .setDescription(
                        [
                            `- \`👤\` **Người nhận**`,
                            `> ${target}`,

                            "",

                            `- \`💰\` **Số tiền**`,
                            `> +${amount.toLocaleString("vi-VN")} Mora`,

                            "",

                            `- \`💳\` **Số dư còn lại**`,
                            `> +${Number(
                                updatedSender.balance || 0
                            ).toLocaleString("vi-VN")} Mora`
                        ].join("\n")
                    )

                    .setFooter({
                        text:
                            "Venti • Mora Transfer"
                    })

                    .setTimestamp()
            ]

        });
    }
};

