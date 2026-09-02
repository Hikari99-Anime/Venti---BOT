
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require("discord.js");

// ==========================================
// 📦 BUTTON / MENU MODULES
// ==========================================

const help =
    require("../interactions/buttons/help");

const profile =
    require("../interactions/buttons/profile");

const inventory =
    require("../interactions/buttons/inventory");

const shop =
    require("../interactions/buttons/shop");

const fish =
    require("../interactions/buttons/fish");

const helpMenu =
    require("../interactions/menus/helpMenu");

// ==========================================
// 🏦 BANK
// ==========================================

const bank =
    require("../commands/economy/bank");

// ==========================================
// 🎒 INVENTORY DATA
// ==========================================

const INVENTORY_CATEGORIES = {
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
// 🎯 MAIN INTERACTION HANDLER
// ==========================================

async function handleInteraction(
    interaction
) {
    try {

        // ======================================
        // 🔘 BUTTON
        // ======================================

        if (interaction.isButton()) {

            const id =
                interaction.customId || "";

            // ==================================
            // 🏦 BANK
            // QUAN TRỌNG: PHẢI ĐẶT TRƯỚC
            // CÁC ROUTER KHÁC
            // ==================================

            if (
                id.startsWith("bank_")
            ) {
                return bank.handleInteraction(
                    interaction
                );
            }

            // ==================================
            // ❓ HELP
            // ==================================

            if (
                id.startsWith("help_")
            ) {
                return help.execute(
                    interaction
                );
            }

            // ==================================
            // 👤 PROFILE
            // ==================================

            if (
                id.startsWith("profile_")
            ) {

                if (
                    id ===
                        "profile_inventory" ||
                    id ===
                        "profile_shop"
                ) {
                    return routeProfile(
                        interaction
                    );
                }

                return profile.execute(
                    interaction
                );
            }

            // ==================================
            // 🎒 INVENTORY
            // ==================================

            if (
                id.startsWith("inventory_")
            ) {
                return routeInventory(
                    interaction
                );
            }

            // ==================================
            // 🛒 SHOP
            // ==================================

            if (
                id.startsWith("shop_")
            ) {
                return routeShop(
                    interaction
                );
            }

            // ==================================
            // 🎣 FISH
            // ==================================

            if (
                id.startsWith("fish_")
            ) {
                return fish.execute(
                    interaction
                );
            }

            return false;
        }

        // ======================================
        // 📂 STRING SELECT MENU
        // ======================================

        if (
            interaction.isStringSelectMenu()
        ) {

            const id =
                interaction.customId || "";

            // ==================================
            // ❓ HELP MENU
            // ==================================

            if (
                id === "help_menu"
            ) {
                return helpMenu.execute(
                    interaction
                );
            }

            // ==================================
            // 🎒 INVENTORY MENU
            // ==================================

            if (
                id ===
                "inventory_category"
            ) {
                return routeInventoryMenu(
                    interaction
                );
            }

            return false;
        }

        // ======================================
        // 🪟 MODAL
        // ======================================

        if (
            interaction.isModalSubmit()
        ) {

            const id =
                interaction.customId || "";

            // ==================================
            // 🏦 BANK MODAL
            // QUAN TRỌNG
            // ==================================

            if (
                id.startsWith(
                    "bank_modal_"
                )
            ) {
                return bank.handleInteraction(
                    interaction
                );
            }

            return false;
        }

        return false;

    } catch (error) {

        console.error(
            "[InteractionHandler]",
            error
        );

        // ======================================
        // ❌ ERROR RESPONSE
        // ======================================

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            return interaction
                .followUp({
                    content:
                        "🍃 Có lỗi xảy ra khi xử lý thao tác này.",
                    ephemeral: true
                })
                .catch(() => {});
        }

        return interaction
            .reply({
                content:
                    "🍃 Có lỗi xảy ra khi xử lý thao tác này.",
                ephemeral: true
            })
            .catch(() => {});
    }
}

// ==========================================
// 👤 PROFILE ROUTER
// ==========================================

async function routeProfile(
    interaction
) {

    const id =
        interaction.customId;

    // ======================================
    // 🎒 INVENTORY
    // ======================================

    if (
        id ===
        "profile_inventory"
    ) {
        return inventory.execute(
            interaction
        );
    }

    // ======================================
    // 🛒 SHOP
    // ======================================

    if (
        id ===
        "profile_shop"
    ) {
        return shop.execute(
            interaction
        );
    }

    return profile.execute(
        interaction
    );
}

// ==========================================
// 🎒 INVENTORY BUTTON ROUTER
// ==========================================

async function routeInventory(
    interaction
) {

    const id =
        interaction.customId;

    // ======================================
    // 🛒 SHOP
    // ======================================

    if (
        id === "inventory_shop"
    ) {
        return shop.execute(
            interaction
        );
    }

    // ======================================
    // 👤 BACK
    // ======================================

    if (
        id === "inventory_back"
    ) {
        return profile.execute(
            interaction
        );
    }

    // ======================================
    // ❌ CLOSE
    // ======================================

    if (
        id === "inventory_close"
    ) {

        return interaction.update({
            content:
                "🍃 Chiếc túi đã được đóng lại.",

            embeds: [],

            components: []
        });
    }

    // ======================================
    // 🔄 REFRESH
    // ======================================

    if (
        id === "inventory_refresh"
    ) {

        return updateInventory(
            interaction,
            "farm"
        );
    }

    return false;
}

// ==========================================
// 📂 INVENTORY SELECT MENU
// ==========================================

async function routeInventoryMenu(
    interaction
) {

    const category =
        interaction.values[0];

    if (
        !INVENTORY_CATEGORIES[
            category
        ]
    ) {

        return interaction.reply({
            content:
                "🍃 Danh mục không hợp lệ.",

            ephemeral: true
        });
    }

    return updateInventory(
        interaction,
        category
    );
}

// ==========================================
// 🔄 UPDATE INVENTORY
// ==========================================

async function updateInventory(
    interaction,
    category
) {

    const User =
        require(
            "../database/models/User"
        );

    const Item =
        require(
            "../database/models/Item"
        );

    const user =
        User.getOrCreate(
            interaction.user.id
        );

    const data =
        INVENTORY_CATEGORIES[
            category
        ];

    const inventory =
        user.inventory || {};

    const items =
        data.items
            .map(itemId => {

                const item =
                    Item.get(
                        itemId
                    );

                if (!item) {
                    return null;
                }

                return {
                    ...item,

                    amount:
                        Number(
                            inventory[
                                itemId
                            ] || 0
                        )
                };
            })
            .filter(Boolean);

    let content;

    if (
        items.length === 0
    ) {

        content =
            "☁️ Chưa có vật phẩm nào.";

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
            inventory
        ).reduce(
            (
                sum,
                amount
            ) =>
                sum +
                Number(
                    amount || 0
                ),
            0
        );

    const embed =
        new EmbedBuilder()
            .setColor(
                "#A8DCC0"
            )

            .setAuthor({
                name:
                    `☁️ ${
                        interaction.user.globalName ||
                        interaction.user.username
                    } · Venti`
            })

            .setTitle(
                "🍃 Túi Đồ"
            )

            .setDescription(
                [
                    "୨୧ ───────── ୨୧",
                    `        ${data.name}`,
                    "୨୧ ───────── ୨୧",
                    "",
                    content,
                    "",
                    "୨୧ ───────── ୨୧",
                    `☁️ Tổng vật phẩm · **${total}**`,
                    "🍃 Một chiếc túi nhỏ của bạn."
                ].join("\n")
            )

            .setFooter({
                text:
                    "☕ Venti · Cozy Inventory"
            })

            .setTimestamp();

    // ======================================
    // 📂 SELECT MENU
    // ======================================

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                "inventory_category"
            )

            .setPlaceholder(
                "☁️ Chọn danh mục..."
            )

            .addOptions({

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

            }, {

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
            });

    const selectRow =
        new ActionRowBuilder()
            .addComponents(
                menu
            );

    // ======================================
    // 🔘 BUTTONS
    // ======================================

    const buttons =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        "inventory_refresh"
                    )
                    .setLabel(
                        "Làm mới"
                    )
                    .setEmoji(
                        "🔃"
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
                    .setEmoji(
                        "✖️"
                    )
                    .setStyle(
                        ButtonStyle.Danger
                    )
            );

    return interaction.update({

        embeds: [
            embed
        ],

        components: [
            selectRow,
            buttons
        ]
    });
}

// ==========================================
// 🛒 SHOP ROUTER
// ==========================================

async function routeShop(
    interaction
) {

    const id =
        interaction.customId;

    // ======================================
    // 👤 PROFILE
    // ======================================

    if (
        id === "shop_profile"
    ) {
        return profile.execute(
            interaction
        );
    }

    // ======================================
    // 🎒 INVENTORY
    // ======================================

    if (
        id === "shop_inventory"
    ) {
        return inventory.execute(
            interaction
        );
    }

    // ======================================
    // ❌ CLOSE
    // ======================================

    if (
        id === "shop_close"
    ) {

        return interaction.update({

            content:
                "🍃 Cửa hàng đã đóng.",

            embeds: [],

            components: []
        });
    }

    // ======================================
    // ◀ PREVIOUS
    // ======================================

    if (
        id.startsWith(
            "shop_prev_"
        )
    ) {

        const page =
            Number(
                id.split("_")[2]
            ) || 0;

        const nextPage =
            Math.max(
                0,
                page - 1
            );

        return updateShop(
            interaction,
            nextPage
        );
    }

    // ======================================
    // ▶ NEXT
    // ======================================

    if (
        id.startsWith(
            "shop_next_"
        )
    ) {

        const page =
            Number(
                id.split("_")[2]
            ) || 0;

        return updateShop(
            interaction,
            page + 1
        );
    }

    // ======================================
    // 🔄 REFRESH
    // ======================================

    if (
        id.startsWith(
            "shop_refresh_"
        )
    ) {

        const page =
            Number(
                id.split("_")[2]
            ) || 0;

        return updateShop(
            interaction,
            page
        );
    }

    return false;
}

// ==========================================
// 🔄 UPDATE SHOP
// ==========================================

async function updateShop(
    interaction,
    page
) {

    const {
        embed,
        page: currentPage,
        maxPage
    } =
        shop.createShopEmbed(
            page
        );

    return interaction.update({

        embeds: [
            embed
        ],

        components: [
            shop.createButtons(
                currentPage,
                maxPage
            )
        ]
    });
}

// ==========================================
// 📤 EXPORT
// ==========================================

module.exports = {
    handleInteraction
};

