
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

const Item =
    require("../../database/models/Item");

// ==========================================
// 📦 DANH MỤC ITEM
// ==========================================

const CATEGORIES = {
    farm: {
        name: "🌾 Nông sản",

        items: [
            "apple",
            "sweet_flower",
            "sunsettia"
        ]
    },

    fish: {
        name: "🐟 Hải sản",

        items: [
            "small_fish",
            "blue_fish",
            "golden_fish",
            "crystal_fish",
            "wind_fish"
        ]
    }
};

// ==========================================
// 📦 LẤY ITEM
// ==========================================

function getCategoryItems(
    user,
    category
) {
    const inventory =
        user.inventory || {};

    const ids =
        CATEGORIES[category]?.items || [];

    return ids
        .map(id => {
            const item =
                Item.get(id);

            if (!item) {
                return null;
            }

            return {
                ...item,

                amount:
                    Number(
                        inventory[id] || 0
                    )
            };
        })
        .filter(Boolean);
}

// ==========================================
// 🎨 TẠO EMBED
// ==========================================

function createEmbed(
    user,
    category
) {
    const data =
        CATEGORIES[category];

    const items =
        getCategoryItems(
            user,
            category
        );

    let content;

    if (
        items.length === 0
    ) {
        content =
            "☁️ Chưa có vật phẩm nào.\n" +
            "🍃 Hãy khám phá Mondstadt nhé!";
    } else {
        content =
            items
                .map(item =>
                    `${item.emoji || "📦"} **${item.name}** · ×${item.amount}`
                )
                .join("\n");
    }

    const total =
        Object.values(
            user.inventory || {}
        ).reduce(
            (sum, amount) =>
                sum +
                Number(amount || 0),
            0
        );

    const username =
        user.username ||
        "Traveler";

    return new EmbedBuilder()
        .setColor("#A8DCC0")

        .setAuthor({
            name:
                `☁️ ${username} · Venti`
        })

        .setTitle(
            "🍃 Túi Đồ"
        )

        .setDescription(
            "୨୧ ───────── ୨୧\n" +
            `        ${data.name}\n` +
            "୨୧ ───────── ୨୧\n\n" +

            content +

            "\n\n" +
            "୨୧ ───────── ୨୧\n" +
            `☁️ Tổng vật phẩm · **${total}**\n` +
            "🍃 Một chiếc túi nhỏ của bạn."
        )

        .setFooter({
            text:
                "☕ Venti · Cozy Inventory"
        })

        .setTimestamp();
}

// ==========================================
// 📂 SELECT MENU
// ==========================================

function createMenu(
    category
) {
    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    "inventory_category"
                )

                .setPlaceholder(
                    "☁️ Chọn danh mục..."
                )

                .addOptions(
                    {
                        label:
                            "Nông sản",

                        description:
                            "Hoa quả và vật phẩm nông nghiệp",

                        value:
                            "farm",

                        emoji:
                            "🌾",

                        default:
                            category === "farm"
                    },

                    {
                        label:
                            "Hải sản",

                        description:
                            "Những thứ bạn câu được",

                        value:
                            "fish",

                        emoji:
                            "🐟",

                        default:
                            category === "fish"
                    }
                )
        );
}

// ==========================================
// 🔘 BUTTON
// ==========================================

function createButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    "inventory_refresh"
                )

                .setLabel(
                    "Làm mới"
                )

                .setStyle(
                    ButtonStyle.Secondary
                ),

            new ButtonBuilder()
                .setCustomId(
                    "inventory_close"
                )

                .setLabel(
                    "Đóng"
                )

                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

// ==========================================
// 🎒 COMMAND
// ==========================================

module.exports = {
    name:
        "inventory",

    aliases: [
        "inv",
        "bag",
        "items",
        "vinventory"
    ],

    description:
        "Xem túi đồ của bạn.",

    async execute(message) {
        const user =
            User.getOrCreate(
                message.author.id
            );

        const displayUser = {
            ...user,

            username:
                message.author.globalName ||
                message.author.username
        };

        return message.reply({
            embeds: [
                createEmbed(
                    displayUser,
                    "farm"
                )
            ],

            components: [
                createMenu("farm"),
                createButtons()
            ]
        });
    },

    createEmbed,
    createMenu,
    createButtons,
    getCategoryItems,
    CATEGORIES
};
