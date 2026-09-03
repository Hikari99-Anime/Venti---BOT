
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
    name: "dice",

    aliases: [
        "roll",
        "vdice"
    ],

    description:
        "Gieo xúc xắc.",

    async execute(
        message,
        args
    ) {
        const amount =
            getAmount(args);

        if (!amount) {
            return message.reply(
                "🎲 Dùng: `Vdice <amount>`"
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
                `💰 Bạn không đủ Mora.`
            );
        }

        takeBet(
            message.author.id,
            amount
        );

        const roll =
            Math.floor(
                Math.random() * 6
            ) + 1;

        const won =
            roll >= 4;

        const reward =
            won
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
            won
        );

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        won
                            ? "#57F287"
                            : "#ED4245"
                    )
                    .setTitle(
                        "🎲 Venti Dice"
                    )
                    .setDescription(
                        "୨୧ ───────── ୨୧\n" +
                        `> 🎲 Kết quả: **${roll}**\n` +
                        "୨୧ ───────── ୨୧\n\n" +
                        `${won ? "🎉 Bạn thắng!" : "💨 Bạn thua!"}\n\n` +
                        `💰 Cược: \`${formatMora(amount)}\`\n` +
                        `💵 Nhận: \`${formatMora(reward)}\` Mora`
                    )
            ]
        });
    }
};
