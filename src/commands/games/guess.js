
const {
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

module.exports = {
    name: "guess",
    aliases: ["guessnumber", "doanso"],
    description: "Đoán số bí mật từ 1 đến 100.",

    async execute(message, args) {
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(userId);

        const target =
            Math.floor(
                Math.random() * 100
            ) + 1;

        const bet =
            Math.max(
                1,
                parseInt(args[0], 10) || 100
            );

        if (
            user.balance < bet
        ) {
            return message.reply(
                `❌ Bạn cần **${bet.toLocaleString()} Mora**.`
            );
        }

        User.removeBalance(
            userId,
            bet
        );

        const attempts =
            Math.max(
                1,
                parseInt(args[1], 10) || 5
            );

        const embed =
            new EmbedBuilder()
                .setColor("#E67E22")
                .setTitle("🔢 Guess The Number")
                .setDescription(
                    `> 🎯 Đoán một số từ **\`1\` → \`100\`**.\n` +
                    `> 💰 Cược: \`${bet.toLocaleString()} Mora\`\n` +
                    `> ❤️ Lượt đoán: **${attempts}**\n\n` +
                    "Gửi số của bạn trong chat."
                )
                .setFooter({
                    text:
                        "🍃 Venti • Guess"
                });

        const msg =
            await message.reply({
                embeds: [embed]
            });

        const filter =
            response =>
                response.author.id ===
                userId &&
                !isNaN(
                    Number(
                        response.content
                    )
                );

        const collector =
            message.channel.createMessageCollector({
                filter,
                time: 60000,
                max: attempts
            });

        let count = 0;

        collector.on(
            "collect",
            async response => {
                count++;

                const guess =
                    Number(
                        response.content
                    );

                if (
                    guess === target
                ) {
                    const reward =
                        bet * 4;

                    User.addBalance(
                        userId,
                        reward
                    );

                    const stats = {
                        ...(User.getOrCreate(userId).stats || {})
                    };

                    stats.games =
                        Number(
                            stats.games || 0
                        ) + 1;

                    stats.wins =
                        Number(
                            stats.wins || 0
                        ) + 1;

                    User.update(
                        userId,
                        { stats }
                    );

                    collector.stop(
                        "win"
                    );

                    return msg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    "#57F287"
                                )
                                .setTitle(
                                    "🎯 Chính xác!"
                                )
                                .setDescription(
                                    `> 🎉 Bạn đã đoán đúng số \`${target}\`!\n` +
                                    `> 💰 Cược: \`${bet.toLocaleString()} Mora\`\n` +
                                    `> 💵 Nhận: **+${reward.toLocaleString()} Mora**`
                                )
                                .setFooter({
                                    text:
                                        "🍃 Venti • Guess"
                                })
                        ]
                    });
                }

                const hint =
                    guess < target
                        ? "⬆️ Cao hơn!"
                        : "⬇️ Thấp hơn!";

                await response.reply({
                    content:
                        `> ${hint} • Còn **${attempts - count}** lượt.`,
                    allowedMentions: {
                        repliedUser: false
                    }
                });
            }
        );

        collector.on(
            "end",
            async (_, reason) => {
                if (
                    reason === "win"
                ) {
                    return;
                }

                const stats = {
                    ...(User.getOrCreate(userId).stats || {})
                };

                stats.games =
                    Number(
                        stats.games || 0
                    ) + 1;

                stats.losses =
                    Number(
                        stats.losses || 0
                    ) + 1;

                User.update(
                    userId,
                    { stats }
                );

                try {
                    await msg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    "#ED4245"
                                )
                                .setTitle(
                                    "💀 Game Over"
                                )
                                .setDescription(
                                    `> 🎯 Số bí mật là **\`${target}\`**.\n` +
                                    `> 💸 Bạn mất **${bet.toLocaleString()} Mora**.`
                                )
                        ]
                    });
                } catch {}
            }
        );
    }
};

