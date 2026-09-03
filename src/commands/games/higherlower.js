
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User = require("../../database/models/User");

module.exports = {
    name: "higherlower",
    aliases: ["hl", "higher", "lower"],
    description: "Đoán số tiếp theo cao hơn hay thấp hơn.",

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

        let current =
            Math.floor(Math.random() * 100) + 1;

        let streak = 0;
        let multiplier = 1;

        const row = createButtons(userId);

        const embed = createEmbed(
            current,
            streak,
            bet,
            multiplier
        );

        const msg = await message.reply({
            embeds: [embed],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({
            time: 60000
        });

        collector.on("collect", async interaction => {
            if (interaction.user.id !== userId) {
                return interaction.reply({
                    content: "❌ Đây không phải game của bạn.",
                    ephemeral: true
                });
            }

            const guess =
                interaction.customId.split("_")[1];

            const next =
                Math.floor(Math.random() * 100) + 1;

            const correct =
                guess === "higher"
                    ? next > current
                    : next < current;

            if (!correct || next === current) {
                const stats = {
                    ...(User.getOrCreate(userId).stats || {})
                };

                stats.games = Number(stats.games || 0) + 1;
                stats.losses = Number(stats.losses || 0) + 1;

                User.update(userId, { stats });

                collector.stop();

                return interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#ED4245")
                            .setTitle("📈 Higher or Lower")
                            .setDescription(
                                `> 🔢 Trước: \`${current}\`\n` +
                                `> 🎲 Sau: \`${next}\`\n\n` +
                                "💀 **Sai rồi! Bạn mất tiền cược.**"
                            )
                            .setFooter({
                                text: "🍃 Venti • Minigame"
                            })
                    ],
                    components: []
                });
            }

            streak++;
            multiplier += 0.5;
            current = next;

            const stats = {
                ...(User.getOrCreate(userId).stats || {})
            };

            stats.games = Number(stats.games || 0) + 1;
            stats.wins = Number(stats.wins || 0) + 1;

            User.update(userId, { stats });

            const reward =
                Math.floor(
                    bet * multiplier
                );

            User.addBalance(userId, reward);

            return interaction.update({
                embeds: [
                    createEmbed(
                        current,
                        streak,
                        bet,
                        multiplier,
                        reward
                    )
                ],
                components: [createButtons(userId)]
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

function createButtons(userId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`hl_higher_${userId}`)
                .setLabel("Cao hơn")
                .setEmoji("⬆️")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`hl_lower_${userId}`)
                .setLabel("Thấp hơn")
                .setEmoji("⬇️")
                .setStyle(ButtonStyle.Primary)
        );
}

function createEmbed(
    current,
    streak,
    bet,
    multiplier,
    reward = 0
) {
    return new EmbedBuilder()
        .setColor("#3498DB")
        .setTitle("📈 Higher or Lower")
        .setDescription(
            `> 🔢 Số hiện tại: **\`${current}\`**\n` +
            `> 💰 Cược: \`${bet.toLocaleString()} Mora\`\n` +
            `> 🔥 Streak: **${streak}**\n` +
            `> ✨ Multiplier: **x${multiplier.toFixed(1)}**` +
            (
                reward
                    ? `\n> 💵 Thắng: **+${reward.toLocaleString()} Mora**`
                    : ""
            ) +
            "\n\nChọn số tiếp theo sẽ **cao hơn** hay **thấp hơn**?"
        )
        .setFooter({
            text: "🍃 Venti • Higher or Lower"
        });
}

