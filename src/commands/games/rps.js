
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User = require("../../database/models/User");

const choices = {
    rock: {
        label: "Kéo",
        emoji: "✊"
    },
    paper: {
        label: "Bao",
        emoji: "✋"
    },
    scissors: {
        label: "Búa",
        emoji: "✌️"
    }
};

function getResult(player, bot) {
    if (player === bot) return "draw";

    if (
        (player === "rock" && bot === "scissors") ||
        (player === "paper" && bot === "rock") ||
        (player === "scissors" && bot === "paper")
    ) {
        return "win";
    }

    return "lose";
}

function updateStats(userId, result) {
    const user = User.getOrCreate(userId);

    const stats = {
        ...(user.stats || {})
    };

    stats.games = Number(stats.games || 0) + 1;

    if (result === "win") {
        stats.wins = Number(stats.wins || 0) + 1;
    }

    if (result === "lose") {
        stats.losses = Number(stats.losses || 0) + 1;
    }

    User.update(userId, {
        stats
    });
}

module.exports = {
    name: "rps",
    aliases: ["rockpaperscissors", "keobao"],
    description: "Chơi kéo búa bao.",

    async execute(message, args) {
        const userId = message.author.id;
        const user = User.getOrCreate(userId);

        const bet = Math.max(
            1,
            parseInt(args[0], 10) || 100
        );

        if (user.balance < bet) {
            return message.reply(
                `❌ Bạn cần **${bet.toLocaleString()} Mora**.`
            );
        }

        User.removeBalance(userId, bet);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`rps_rock_${userId}`)
                    .setLabel("Kéo")
                    .setEmoji("✊")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId(`rps_paper_${userId}`)
                    .setLabel("Bao")
                    .setEmoji("✋")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId(`rps_scissors_${userId}`)
                    .setLabel("Búa")
                    .setEmoji("✌️")
                    .setStyle(ButtonStyle.Primary)
            );

        const embed = new EmbedBuilder()
            .setColor("#9B59B6")
            .setTitle("🎮 Kéo • Búa • Bao")
            .setDescription(
                `> 💰 Cược: \`${bet.toLocaleString()} Mora\`\n\n` +
                "Chọn nước đi của bạn:"
            )
            .setFooter({
                text: "🍃 Venti • Minigame"
            });

        const msg = await message.reply({
            embeds: [embed],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({
            time: 30000
        });

        collector.on("collect", async interaction => {
            if (interaction.user.id !== userId) {
                return interaction.reply({
                    content: "❌ Đây không phải game của bạn.",
                    ephemeral: true
                });
            }

            const player = interaction.customId.split("_")[1];

            const botChoices = Object.keys(choices);
            const bot =
                botChoices[
                    Math.floor(Math.random() * botChoices.length)
                ];

            const result = getResult(player, bot);

            updateStats(userId, result);

            let reward = 0;
            let resultText = "";

            if (result === "win") {
                reward = bet * 2;
                User.addBalance(userId, reward);
                resultText = `🎉 **Bạn thắng!** +${reward.toLocaleString()} Mora`;
            } else if (result === "draw") {
                reward = bet;
                User.addBalance(userId, reward);
                resultText = "🤝 **Hòa!** Bạn được hoàn lại tiền cược.";
            } else {
                resultText = `💀 **Bạn thua!** -${bet.toLocaleString()} Mora`;
            }

            const resultEmbed = new EmbedBuilder()
                .setColor(
                    result === "win"
                        ? "#57F287"
                        : result === "draw"
                            ? "#FEE75C"
                            : "#ED4245"
                )
                .setTitle("🎮 Kết quả")
                .setDescription(
                    `> ${choices[player].emoji} Bạn: **${choices[player].label}**\n` +
                    `> ${choices[bot].emoji} Venti: **${choices[bot].label}**\n\n` +
                    resultText
                )
                .setFooter({
                    text: "🍃 Venti • Kéo Búa Bao"
                });

            collector.stop();

            return interaction.update({
                embeds: [resultEmbed],
                components: []
            });
        });

        collector.on("end", async () => {
            try {
                await msg.edit({
                    components: []
                });
            } catch {}
        });
    }
};
