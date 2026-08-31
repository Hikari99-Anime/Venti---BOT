const { baseEmbed } = require("./common");

function balanceEmbed(user, data) {
    return baseEmbed()
        .setAuthor({
            name: `${user.username}'s Wallet`,
            iconURL: user.displayAvatarURL()
        })
        .setDescription("🍃 A little breeze, a little Mora.")
        .addFields(
            {
                name: "💰 Mora",
                value: `\`${data.balance.toLocaleString()}\``,
                inline: true
            },
            {
                name: "🏦 Bank",
                value: `\`${data.bank.toLocaleString()}\``,
                inline: true
            },
            {
                name: "✨ Level",
                value: `\`${data.level}\``,
                inline: true
            }
        );
}

function dailyEmbed(reward, balance) {
    return baseEmbed()
        .setDescription(
            `🎁 **Daily reward claimed!**\n` +
            `The wind brought you **${reward.toLocaleString()} Mora**.`
        )
        .addFields({
            name: "💰 Balance",
            value: `\`${balance.toLocaleString()} Mora\``,
            inline: true
        });
}

module.exports = {
    balanceEmbed,
    dailyEmbed
};
