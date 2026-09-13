
const {
    EmbedBuilder
} = require("discord.js");

const {
    getUser,
    getAmount,
    addGameResult,
    canAfford,
    takeBet,
    giveReward,
    formatMora
} = require("./_gameUtils");

// ==========================================
// 🪙 COINFLIP
// ==========================================

module.exports = {

    name: "coinflip",

    aliases: [
        "coin",
        "flip",
        "vcf",
        "vcoinflip"
    ],

    description:
        "Tung đồng xu và chọn Úp hoặc Ngửa.",

    usage:
        "Vcf <amount> <n/u>",

    async execute(
        message,
        args
    ) {

        // ======================================
        // 🔢 AMOUNT
        // ======================================

        const amount =
            getAmount(args);

        if (!amount) {
            return message.reply(
                [
                    "🪙 **Cách dùng:**",
                    "",
                    "`Vcf 1000 n` → 🟡 Ngửa",
                    "`Vcf 1000 u` → ⚪ Úp"
                ].join("\n")
            );
        }

        // ======================================
        // 🎯 CHOICE
        // ======================================

        const rawChoice =
            String(
                args[1] || ""
            )
                .trim()
                .toLowerCase();

        let choice;

        if (
            [
                "n",
                "ngua",
                "ngửa",
                "heads",
                "head"
            ].includes(
                rawChoice
            )
        ) {
            choice = "heads";
        }

        if (
            [
                "u",
                "up",
                "úp",
                "tails",
                "tail"
            ].includes(
                rawChoice
            )
        ) {
            choice = "tails";
        }

        // ======================================
        // ❌ INVALID CHOICE
        // ======================================

        if (!choice) {
            return message.reply(
                [
                    "🪙 **Bạn phải chọn Úp hoặc Ngửa.**",
                    "",
                    "`Vcf 1000 n` → 🟡 Ngửa",
                    "`Vcf 1000 u` → ⚪ Úp"
                ].join("\n")
            );
        }

        // ======================================
        // 👤 USER
        // ======================================

        const user =
            getUser(
                message.author.id
            );

        const balance =
            Number(
                user.balance || 0
            );

        // ======================================
        // 💰 CHECK BALANCE
        // ======================================

        if (
            !canAfford(
                user,
                amount
            )
        ) {
            return message.reply(
                [
                    "💰 **Không đủ Mora.**",
                    "",
                    `> \`💵\` Có: **${formatMora(balance)} Mora**`,
                    `> \`💸\` Cần: **${formatMora(amount)} Mora**`
                ].join("\n")
            );
        }

        // ======================================
        // 💸 TAKE BET
        // ======================================

        const removed =
            takeBet(
                message.author.id,
                amount
            );

        if (
            removed === false
        ) {
            return message.reply(
                "❌ Không thể trừ tiền cược."
            );
        }

        // ======================================
        // 🪙 FLIP
        // ======================================

        const result =
            Math.random() < 0.5
                ? "heads"
                : "tails";

        const won =
            choice === result;

        const reward =
            won
                ? amount * 2
                : 0;

        // ======================================
        // 💰 REWARD
        // ======================================

        if (won) {
            giveReward(
                message.author.id,
                reward
            );
        }

        // ======================================
        // 📊 RECORD
        // ======================================

        addGameResult(
            message.author.id,
            won
        );

        // ======================================
        // 🎨 RESULT DATA
        // ======================================

        const choiceEmoji =
            choice === "heads"
                ? "🟡"
                : "⚪";

        const choiceName =
            choice === "heads"
                ? "Ngửa"
                : "Úp";

        const resultEmoji =
            result === "heads"
                ? "🟡"
                : "⚪";

        const resultName =
            result === "heads"
                ? "Ngửa"
                : "Úp";

        const finalBalance =
            balance -
            amount +
            reward;

        // ======================================
        // 🪙 RESULT EMBED
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    won
                        ? "#a8d8a8"
                        : "#f2a7a7"
                )

                .setAuthor({
                    name:
                        `${message.author.username} • Coinflip`,
                    iconURL:
                        message.author
                            .displayAvatarURL()
                })

                .setDescription(
                    [
                        "**COINFLIP**",
                        "",
                        won
                            ? "- `🎉` **Kết quả: Thắng**"
                            : "- `💨` **Kết quả: Thua**",

                        `> ${resultEmoji} Đồng xu: **${resultName}**`,
                        "",

                        "- `🎯` **Bạn chọn**",
                        `> ${choiceEmoji} **${choiceName}**`,
                        "",

                        "- `💰` **Tiền cược**",
                        `> **${formatMora(amount)} Mora**`,
                        "",

                        "- `💵` **Tiền nhận**",
                        `> ${won ? "+" : ""}**${formatMora(reward)} Mora**`,
                        "",

                        "- `💳` **Số dư**",
                        `> **${formatMora(finalBalance)} Mora**`
                    ].join("\n")
                )

                .setFooter({
                    text:
                        "Columbina • Coinflip"
                })

                .setTimestamp();

        return message.reply({
            embeds: [
                embed
            ]
        });
    }
};
