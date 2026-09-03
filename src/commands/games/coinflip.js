
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

module.exports = {
    name: "coinflip",

    aliases: [
        "coin",
        "flip",
        "vcoinflip"
    ],

    description:
        "Tung đồng xu.",

    async execute(
        message,
        args
    ) {
        const amount =
            getAmount(args);

        if (!amount) {
            return message.reply(
                "🪙 Dùng: `Vcoinflip <amount>`"
            );
        }

        const user =
            getUser(
                message.author.id
            );

        if (
            !canAfford(
                user,
                amount
            )
        ) {
            return message.reply(
                `💰 Bạn không đủ **${formatMora(amount)} Mora**.`
            );
        }

        takeBet(
            message.author.id,
            amount
        );

        const heads =
            Math.random() < 0.5;

        const reward =
            heads
                ? amount * 2
                : 0;

        if (reward) {
            giveReward(
                message.author.id,
                reward
            );
        }

        addGameResult(
            message.author.id,
            heads
        );

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        heads
                            ? "#57F287"
                            : "#ED4245"
                    )
                    .setTitle(
                        "🪙 Venti Coinflip"
                    )
                    .setDescription(
                        "୨୧ ───────── ୨୧\n" +
                        `> ${heads ? "🟡 HEADS" : "⚪ TAILS"}\n` +
                        "୨୧ ───────── ୨୧\n\n" +
                        `${heads ? "🎉 Bạn thắng!" : "💨 Bạn thua!"}\n\n` +
                        `💰 Cược: \`${formatMora(amount)}\`\n` +
                        `💵 Nhận: \`${formatMora(reward)}\` Mora`
                    )
                    .setFooter({
                        text:
                            "🍃 Venti Casino"
                    })
            ]
        });
    }
};

