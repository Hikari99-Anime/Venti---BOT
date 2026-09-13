
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
// 🎰 SYMBOLS
// ==========================================

const SYMBOLS = [
    "🍒",
    "🍋",
    "🍊",
    "🍇",
    "🔔",
    "⭐",
    "💎"
];

// ==========================================
// 🎲 RANDOM SYMBOL
// ==========================================

function randomSymbol() {
    return SYMBOLS[
        Math.floor(
            Math.random() *
            SYMBOLS.length
        )
    ];
}

// ==========================================
// ⏱️ DELAY
// ==========================================

function delay(ms) {
    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}

// ==========================================
// 👤 PLAYER NAME
// ==========================================

function getPlayerName(
    message
) {
    return (
        message.author.globalName ||
        message.author.username
    );
}

// ==========================================
// 🎰 SPIN EMBED
// ==========================================

function createGameEmbed(
    message,
    reels,
    amount
) {
    const name =
        getPlayerName(message);

    return new EmbedBuilder()
        .setColor("#D8A7C7")

        .setAuthor({
            name:
                `🌙 ${name} · Columbina`,
            iconURL:
                message.author.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        })

        .setTitle(
            "🎰 Columbina Slots"
        )

        .setDescription(
            "🌙 `🎰` **Một vòng quay may mắn**\n\n" +

            "- `🎰` **Slot Machine**\n" +
            `> \`🎰 ${reels[0]} │ ${reels[1]} │ ${reels[2]}\`\n\n` +

            "- `💰` **Thông tin**\n" +
            `> \`💵 Cược       : ${formatMora(amount)} Mora\`\n` +
            "> `🎯 Trạng thái : Đang quay...`\n\n" +

            "୨୧ ───────── ୨୧\n" +
            "🌙 **Vận may đang được quyết định...**"
        )

        .setThumbnail(
            message.author.displayAvatarURL({
                extension: "png",
                size: 256
            })
        )

        .setFooter({
            text:
                "🌙 Columbina • Cozy Corner"
        })

        .setTimestamp();
}

// ==========================================
// 🏆 RESULT EMBED
// ==========================================

function createResultEmbed(
    message,
    reels,
    amount,
    reward,
    multiplier
) {
    const name =
        getPlayerName(message);

    const won =
        reward > 0;

    const triple =
        reels[0] === reels[1] &&
        reels[1] === reels[2];

    const double =
        reels[0] === reels[1] ||
        reels[1] === reels[2] ||
        reels[0] === reels[2];

    let resultTitle =
        "💨 Không trúng";

    let resultText =
        "Vận may chưa đứng về phía bạn.";

    if (triple) {
        resultTitle =
            "🎉 JACKPOT!";

        resultText =
            "Ba biểu tượng giống nhau!";
    } else if (double) {
        resultTitle =
            "✨ Hai biểu tượng!";

        resultText =
            "Hai biểu tượng giống nhau.";
    }

    return new EmbedBuilder()
        .setColor(
            won
                ? "#A8DCC0"
                : "#F2A7A7"
        )

        .setAuthor({
            name:
                `🌙 ${name} · Columbina`,
            iconURL:
                message.author.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        })

        .setTitle(
            won
                ? "🎰 Columbina Slots • Thắng"
                : "🎰 Columbina Slots • Kết quả"
        )

        .setDescription(
            "🌙 `🎰` **Kết quả vòng quay**\n\n" +

            "- `🎰` **Slot Machine**\n" +
            `> \`🎰 ${reels[0]} │ ${reels[1]} │ ${reels[2]}\`\n\n` +

            "- `🏆` **Kết quả**\n" +
            `> \`🎯 ${resultTitle}\`\n` +
            `> \`📝 ${resultText}\`\n\n` +

            "- `💰` **Phần thưởng**\n" +
            `> \`💵 Cược       : ${formatMora(amount)} Mora\`\n` +
            `> \`📈 Multiplier : x${multiplier}\`\n` +
            `> \`💎 Nhận       : ${reward > 0 ? "+" : ""}${formatMora(reward)} Mora\`\n\n` +

            "୨୧ ───────── ୨୧\n" +

            (
                won
                    ? "🌙 **Columbina mỉm cười trước vận may của bạn.**"
                    : "🌙 **Có lẽ lần quay tiếp theo sẽ khác.**"
            )
        )

        .setThumbnail(
            message.author.displayAvatarURL({
                extension: "png",
                size: 256
            })
        )

        .setFooter({
            text:
                "🌙 Columbina • Cozy Corner"
        })

        .setTimestamp();
}

// ==========================================
// 🎰 COMMAND
// ==========================================

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
        const userId =
            message.author.id;

        const amount =
            getAmount(args);

        if (!amount) {
            return message.reply(
                "🎰 Dùng: `Vslots <amount>`"
            );
        }

        const user =
            getUser(userId);

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

        // ==================================
        // 💸 TAKE BET
        // ==================================

        takeBet(
            userId,
            amount
        );

        // ==================================
        // 🎰 INITIAL
        // ==================================

        let reels = [
            "❔",
            "❔",
            "❔"
        ];

        const msg =
            await message.reply({
                embeds: [
                    createGameEmbed(
                        message,
                        reels,
                        amount
                    )
                ]
            });

        // ==================================
        // 🎰 SPIN ANIMATION
        // ==================================

        for (
            let i = 0;
            i < 5;
            i++
        ) {
            reels = [
                randomSymbol(),
                randomSymbol(),
                randomSymbol()
            ];

            await delay(450);

            await msg.edit({
                embeds: [
                    createGameEmbed(
                        message,
                        reels,
                        amount
                    )
                ]
            });
        }

        // ==================================
        // 🎯 FINAL RESULT
        // ==================================

        const a =
            randomSymbol();

        const b =
            randomSymbol();

        const c =
            randomSymbol();

        reels = [
            a,
            b,
            c
        ];

        const triple =
            a === b &&
            b === c;

        const double =
            a === b ||
            b === c ||
            a === c;

        // ==================================
        // 📈 MULTIPLIER
        // ==================================

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
            amount *
            multiplier;

        // ==================================
        // 💰 REWARD
        // ==================================

        if (
            reward > 0
        ) {
            giveReward(
                userId,
                reward
            );
        }

        // ==================================
        // 📊 STATS
        // ==================================

        const won =
            reward > 0;

        addGameResult(
            userId,
            won
        );

        // ==================================
        // 🏆 FINAL
        // ==================================

        return msg.edit({
            embeds: [
                createResultEmbed(
                    message,
                    reels,
                    amount,
                    reward,
                    multiplier
                )
            ]
        });
    }
};
