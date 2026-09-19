const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("../../config");

async function execute(interaction) {
    const value = interaction.values[0];

    const pages = {
        economy: {
            title: "💰 Economy",
            description:
                "`Vbalance` `Vdaily` `Vwork` `Vbeg` `Vpay`"
        },
        games: {
            title: "🎮 Minigames",
            description:
                "`Vslots` `Vcoinflip` `Vdice` `Vblackjack` `Vguess`"
        },
        venti: {
            title: "🍃 Columbina",
            description:
                "`Vprofile` `Vinventory` `Vshop` `Vleaderboard`"
        }
    };

    const page = pages[value];

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: `Columbina • ${page.title}`
        })
        .setDescription(page.description)
        .setFooter({
            text: "Columbina • Wandering Bard of Mondstadt"
        })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("help_back")
            .setLabel("Back")
            .setEmoji("◀️")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("help_close")
            .setLabel("Close")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
    );

    return interaction.update({
        embeds: [embed],
        components: [row]
    });
}

module.exports = {
    execute
};
