const database = require("../../database/database");
const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "leaderboard",
    aliases: ["lb", "top"],
    description: "Xem bảng xếp hạng Mora.",

    async execute(message) {
        const users =
            database.getAllUsers()
                .sort(
                    (a, b) =>
                        b.balance - a.balance
                )
                .slice(0, 10);

        if (!users.length) {
            return message.reply(
                "🍃 Chưa có dữ liệu leaderboard."
            );
        }

        const lines = [];

        for (
            let i = 0;
            i < users.length;
            i++
        ) {
            const user = users[i];

            const discordUser =
                await message.client.users
                    .fetch(user.id)
                    .catch(() => null);

            const name =
                discordUser?.username ||
                "Unknown Traveler";

            const medal =
                i === 0
                    ? "🥇"
                    : i === 1
                        ? "🥈"
                        : i === 2
                            ? "🥉"
                            : `\`${i + 1}\``;

            lines.push(
                `${medal} **${name}** — 💰 ${user.balance.toLocaleString()}`
            );
        }

        const embed =
            new EmbedBuilder()
                .setColor("#8FD3FF")
                .setAuthor({
                    name: "Venti • Mora Leaderboard"
                })
                .setDescription(
                    lines.join("\n")
                )
                .setFooter({
                    text:
                        "🍃 May the wind guide your fortune."
                })
                .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }
};
    