const {
    EmbedBuilder
} = require("discord.js");

const config = require("../config");

function baseEmbed() {
    return new EmbedBuilder()
        .setColor(config.colors.primary)
        .setFooter({
            text: "Venti • Wandering Bard of Mondstadt"
        })
        .setTimestamp();
}

function successEmbed(description) {
    return baseEmbed()
        .setColor(config.colors.success)
        .setDescription(description);
}

function errorEmbed(description) {
    return baseEmbed()
        .setColor(config.colors.error)
        .setDescription(`🍃 ${description}`);
}

function warningEmbed(description) {
    return baseEmbed()
        .setColor(config.colors.warning)
        .setDescription(`🍃 ${description}`);
}

module.exports = {
    baseEmbed,
    successEmbed,
    errorEmbed,
    warningEmbed
};
