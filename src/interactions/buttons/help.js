const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("../../config");

function navigation() {
    return new ActionRowBuilder().addComponents(
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
}

async function execute(interaction) {
    const id = interaction.customId;

    if (id === "help_close") {
        return interaction.update({
            content: "🍃 The wind has carried the menu away.",
            embeds: [],
            components: []
        });
    }

    if (id === "help_back") {
        const help = require("../../commands/venti/help");

        const data = await helpPage();

        return interaction.update(data);
    }

    let title;
    let description;
    let fields = [];

    if (id === "help_economy") {
        title = "💰 Economy";
        description = "Build your fortune with the power of Mora.";
        fields = [
            {
                name: "💰 `Vbalance`",
                value: "Xem số Mora hiện tại."
            },
            {
                name: "🎁 `Vdaily`",
                value: "Nhận phần thưởng hằng ngày."
            },
            {
                name: "💼 `Vwork`",
                value: "Làm việc để kiếm Mora."
            },
            {
                name: "🤲 `Vbeg`",
                value: "Xin một ít Mora từ vận may."
            },
            {
                name: "💸 `Vpay @user <amount>`",
                value: "Chuyển Mora cho người khác."
            }
        ];
    }

    if (id === "help_games") {
        title = "🎮 Minigames";
        description = "Take a gamble and let the wind decide.";
        fields = [
            {
                name: "🎰 `Vslots <bet>`",
                value: "Quay máy slot."
            },
            {
                name: "🪙 `Vcoinflip <heads/tails> <bet>`",
                value: "Đoán mặt đồng xu."
            },
            {
                name: "🎲 `Vdice <bet>`",
                value: "Roll the dice."
            },
            {
                name: "🃏 `Vblackjack <bet>`",
                value: "Challenge the dealer."
            }
        ];
    }

    if (id === "help_venti") {
        title = "🍃 Venti";
        description = "Everything you need for your adventure.";
        fields = [
            {
                name: "👤 `Vprofile`",
                value: "Xem thông tin nhân vật."
            },
            {
                name: "🎒 `Vinventory`",
                value: "Xem vật phẩm đang sở hữu."
            },
            {
                name: "🛍️ `Vshop`",
                value: "Mua vật phẩm."
            },
            {
                name: "🏆 `Vleaderboard`",
                value: "Xem bảng xếp hạng."
            }
        ];
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: `Venti • ${title}`
        })
        .setDescription(description)
        .addFields(fields)
        .setFooter({
            text: "Venti • Wandering Bard of Mondstadt"
        })
        .setTimestamp();

    return interaction.update({
        embeds: [embed],
        components: [navigation()]
    });
}

async function helpPage() {
    const help = require("../../commands/venti/help");

    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } =
        require("discord.js");

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: "Venti • Help"
        })
        .setDescription(
            "🍃 **Welcome, traveler!**\n" +
            "Choose a category below and let the wind guide you."
        )
        .setFooter({
            text: "Venti • Wandering Bard of Mondstadt"
        })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("help_economy")
            .setLabel("Economy")
            .setEmoji("💰")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("help_games")
            .setLabel("Games")
            .setEmoji("🎮")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("help_venti")
            .setLabel("Venti")
            .setEmoji("🍃")
            .setStyle(ButtonStyle.Secondary)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

module.exports = {
    execute
};
