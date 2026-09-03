
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

const SYMBOLS = [
    "🍒",
    "🍋",
    "🍊",
    "🍇",
    "🔔",
    "⭐",
    "💎"
];

module.exports = {
    name: "slots",

    aliases: [
        "slot",
        "vslots"
    ],

    description:
        "Chơi Slot Machine.",

    async execute(
        message,
        args
    ) {
        const amount =
            getAmount(args);

        if (!amount) {
            return message.reply(
                "🎰 Dùng: `Vslots <amount>`"
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
                `💰 Bạn cần **${formatMora(amount)} Mora** để chơi.`
            );
        }

        takeBet(
            message.author.id,
            amount
        );

        const a =
            SYMBOLS[
                Math.floor(
                    Math.random() *
                    SYMBOLS.length
                )
            ];

        const b =
            SYMBOLS[
                Math.floor(
                    Math.random() *
                    SYMBOLS.length
                )
            ];

        const c =
            SYMBOLS[
                Math.floor(
                    Math.random() *
                    SYMBOLS.length
                )
            ];

        const triple =
            a === b &&
            b === c;

        const double =
            a === b ||
            b === c ||
            a === c;

        let multiplier = 0;

        if (triple) {
            multiplier =
                a === "💎"
                    ? 10
                    : a === "⭐"
                        ? 7
                        : 5;
        } else if (double) {
            multiplier = 2;
        }

        const reward =
            amount * multiplier;

        if (reward > 0) {
            giveReward(
                message.author.id,
                reward
            );
        }

        const won =
            reward > 0;

        addGameResult(
            message.author.id,
            won
        );

        const result =
            triple
                ? "🎉 **JACKPOT!**"
                : double
                    ? "✨ **Hai biểu tượng giống nhau!**"
                    : "💨 **Không trúng!**";

        const embed =
            new EmbedBuilder()
                .setColor(
                    won
                        ? "#57F287"
                        : "#ED4245"
                )
                .setTitle(
                    "🎰 Venti Slots"
                )
                .setDescription(
                    "୨୧ ───────── ୨୧\n" +
                    `> ${a} │ ${b} │ ${c}\n` +
                    "୨୧ ───────── ୨୧\n\n" +
                    `${result}\n\n` +
                    `💰 Cược: \`${formatMora(amount)}\`\n` +
                    `💵 Nhận: \`${formatMora(reward)}\` Mora`
                )
                .setFooter({
                    text:
                        "🍃 Venti Casino"
                });

        return message.reply({
            embeds: [embed]
        });
    }
};
