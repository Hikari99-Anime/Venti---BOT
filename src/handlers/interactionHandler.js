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
// 🏦 COMMANDS
// ==========================================

const bank =
    require("../commands/economy/bank");

const beg =
    require("../commands/economy/beg");

// ==========================================
// 🛡️ SAFE ERROR RESPONSE
// ==========================================

async function safeError(
    interaction,
    error
) {

    console.error(
        "[InteractionHandler]",
        error
    );

    try {

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            return await interaction
                .followUp({

                    content:
                        "🍃 Có lỗi xảy ra khi xử lý thao tác này.",

                    flags: 64

                })
                .catch(() => {});
        }

        return await interaction
            .reply({

                content:
                    "🍃 Có lỗi xảy ra khi xử lý thao tác này.",

                flags: 64

            })
            .catch(() => {});

    } catch {

        return;
    }
}

// ==========================================
// 🎯 MAIN INTERACTION HANDLER
// ==========================================

async function handleInteraction(
    interaction
) {

    try {

        const id =
            interaction.customId || "";

        // ======================================
        // 🔘 BUTTON
        // ======================================

        if (
            interaction.isButton()
        ) {

            // ==================================
            // 🏦 BANK
            // ==================================

            if (
                id.startsWith("bank_")
            ) {

                return await bank.handleInteraction(
                    interaction
                );
            }

            // ==================================
            // 🙏 BEG
            // ==================================

            if (
                id.startsWith("beg_")
            ) {

                return await beg.handleInteraction(
                    interaction
                );
            }

            // ==================================
            // ❓ HELP
            // ==================================

            if (
                id.startsWith("help_")
            ) {

                return await help.execute(
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
                    id === "profile_inventory"
                ) {

                    return await inventory.execute(
                        interaction
                    );
                }

                if (
                    id === "profile_shop"
                ) {

                    return await shop.execute(
                        interaction
                    );
                }

                return await profile.execute(
                    interaction
                );
            }

            // ==================================
            // 🎒 INVENTORY
            // ==================================

            if (
                id.startsWith("inventory_")
            ) {

                return await routeInventory(
                    interaction
                );
            }

            // ==================================
            // 🛒 SHOP
            // ==================================

            if (
                id.startsWith("shop_")
            ) {

                return await routeShop(
                    interaction
                );
            }

            // ==================================
            // 🎣 FISH
            // ==================================

            if (
                id.startsWith("fish_")
            ) {

                return await fish.execute(
                    interaction
                );
            }

            return false;
        }

        // ======================================
        // 📂 SELECT MENU
        // ======================================

        if (
            interaction.isStringSelectMenu()
        ) {

            // ==================================
            // ❓ HELP
            // ==================================

            if (
                id === "help_menu"
            ) {

                return await helpMenu.execute(
                    interaction
                );
            }

            // ==================================
            // 🎒 INVENTORY
            // ==================================

            if (
                id === "inventory_category"
            ) {

                if (
                    !interaction.deferred &&
                    !interaction.replied
                ) {

                    await interaction.deferUpdate();
                }

                return await routeInventoryMenu(
                    interaction
                );
            }

            // ==================================
            // 🛒 SHOP
            // ==================================

            if (
                id.startsWith("shop_")
            ) {

                return await shop.handleInteraction(
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

            // ==================================
            // 🏦 BANK
            // ==================================

            if (
                id.startsWith("bank_modal_")
            ) {

                return await bank.handleInteraction(
                    interaction
                );
            }

            // ==================================
            // 🙏 BEG
            // ==================================

            if (
                id.startsWith("beg_modal_")
            ) {

                return await beg.handleInteraction(
                    interaction
                );
            }

            // ==================================
            // 🛒 SHOP QUANTITY MODAL
            // ==================================

            if (
                id.startsWith("shop_quantity_")
            ) {

                return await shop.handleInteraction(
                    interaction
                );
            }

            return false;
        }

        return false;

    } catch (error) {

        return safeError(
            interaction,
            error
        );
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

    if (
        id === "profile_inventory"
    ) {

        return await inventory.execute(
            interaction
        );
    }

    if (
        id === "profile_shop"
    ) {

        return await shop.execute(
            interaction
        );
    }

    return await profile.execute(
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

        return await shop.execute(
            interaction
        );
    }

    // ======================================
    // 👤 BACK
    // ======================================

    if (
        id === "inventory_back"
    ) {

        return await profile.execute(
            interaction
        );
    }

    // ======================================
    // ❌ CLOSE
    // ======================================

    if (
        id === "inventory_close"
    ) {

        if (
            interaction.deferred ||
            interaction.replied
        ) {

            return interaction.editReply({

                content:
                    "🍃 Chiếc túi đã được đóng lại.",

                embeds: [],

                components: []

            });
        }

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

        if (
            !interaction.deferred &&
            !interaction.replied
        ) {

            await interaction.deferUpdate();
        }

        return await updateInventory(
            interaction,
            "farming"
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
        interaction.values?.[0];

    const validCategories = [
        "farming",
        "seafood"
    ];

    if (
        !validCategories.includes(
            category
        )
    ) {

        if (
            interaction.deferred ||
            interaction.replied
        ) {

            return interaction.editReply({

                content:
                    "🍃 Danh mục không hợp lệ.",

                embeds: [],

                components: []

            });
        }

        return interaction.reply({

            content:
                "🍃 Danh mục không hợp lệ.",

            flags: 64

        });
    }

    return await updateInventory(
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

    try {

        // ======================================
        // 📦 MODELS
        // ======================================

        const User =
            require(
                "../database/models/User"
            );

        const Item =
            require(
                "../database/models/Item"
            );

        // ======================================
        // 👤 USER
        // ======================================

        const user =
            User.getOrCreate(
                interaction.user.id
            );

        // ======================================
        // 🎒 INVENTORY
        // ======================================

        const inventory =
            user.inventory || {};

        // ======================================
        // 📦 ITEMS
        // ======================================

        let allItems = [];

        if (
            Item &&
            typeof Item.getAll ===
            "function"
        ) {

            allItems =
                Item.getAll();

        } else {

            allItems =
                Object.values(Item || {});
        }

        if (
            !Array.isArray(allItems)
        ) {

            allItems = [];
        }

        // ======================================
        // 🔎 CATEGORY
        // ======================================

        const categoryItems =
            allItems.filter(
                item =>
                    item &&
                    item.category === category
            );

        // ======================================
        // 🎒 OWNED
        // ======================================

        const ownedItems =
            categoryItems
                .map(
                    item => {

                        const amount =
                            Number(
                                inventory[
                                    item.id
                                ] || 0
                            );

                        if (
                            amount <= 0
                        ) {

                            return null;
                        }

                        return {
                            ...item,
                            amount
                        };
                    }
                )
                .filter(
                    Boolean
                );

        // ======================================
        // 📝 CONTENT
        // ======================================

        let content;

        if (
            ownedItems.length === 0
        ) {

            content =
                category === "farming"
                    ? "☁️ Bạn chưa có nông sản nào."
                    : "☁️ Bạn chưa có cá nào.";

        } else {

            content =
                ownedItems
                    .map(
                        item =>
                            `${item.emoji || "📦"} **${item.name}** · ×${item.amount}`
                    )
                    .join("\n");
        }

        // ======================================
        // 🔢 TOTAL
        // ======================================

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

        // ======================================
        // 🏷️ CATEGORY
        // ======================================

        const categoryName =
            category === "farming"
                ? "🌾 Nông sản"
                : "🐟 Hải sản";

        // ======================================
        // 🎨 EMBED
        // ======================================

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
                        } · Columbina`

                })

                .setTitle(
                    "🍃 Túi Đồ"
                )

                .setDescription(
                    [

                        "୨୧ ───────── ୨୧",

                        `        ${categoryName}`,

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
                        "☕ Columbina · Cozy Inventory"

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

                .addOptions(

                    {

                        label:
                            "Nông sản",

                        description:
                            "Hoa quả và vật phẩm nông nghiệp",

                        value:
                            "farming",

                        emoji:
                            "🌾",

                        default:
                            category === "farming"

                    },

                    {

                        label:
                            "Hải sản",

                        description:
                            "Những thứ bạn câu được",

                        value:
                            "seafood",

                        emoji:
                            "🐟",

                        default:
                            category === "seafood"

                    }

                );

        // ======================================
        // 📂 SELECT ROW
        // ======================================

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
                            "inventory_shop"
                        )

                        .setLabel(
                            "Cửa hàng"
                        )

                        .setEmoji(
                            "🛒"
                        )

                        .setStyle(
                            ButtonStyle.Success
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

        // ======================================
        // 📤 UPDATE
        // ======================================

        if (
            interaction.deferred
        ) {

            return await interaction.editReply({

                content: null,

                embeds: [
                    embed
                ],

                components: [
                    selectRow,
                    buttons
                ]

            });
        }

        return await interaction.update({

            content: null,

            embeds: [
                embed
            ],

            components: [
                selectRow,
                buttons
            ]

        });

    } catch (error) {

        console.error(
            "[updateInventory]",
            error
        );

        throw error;
    }
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

        return await profile.execute(
            interaction
        );
    }

    // ======================================
    // 🎒 INVENTORY
    // ======================================

    if (
        id === "shop_inventory"
    ) {

        return await inventory.execute(
            interaction
        );
    }

    // ======================================
    // ❌ CLOSE
    // ======================================

    if (
        id === "shop_close"
    ) {

        if (
            interaction.deferred ||
            interaction.replied
        ) {

            return interaction.editReply({

                content:
                    "🍃 Cửa hàng đã đóng.",

                embeds: [],

                components: []

            });
        }

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
        id.startsWith("shop_prev_")
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

        if (
            !interaction.deferred &&
            !interaction.replied
        ) {

            await interaction.deferUpdate();
        }

        return await updateShop(
            interaction,
            nextPage
        );
    }

    // ======================================
    // ▶ NEXT
    // ======================================

    if (
        id.startsWith("shop_next_")
    ) {

        const page =
            Number(
                id.split("_")[2]
            ) || 0;

        if (
            !interaction.deferred &&
            !interaction.replied
        ) {

            await interaction.deferUpdate();
        }

        return await updateShop(
            interaction,
            page + 1
        );
    }

    // ======================================
    // 🔄 REFRESH
    // ======================================

    if (
        id.startsWith("shop_refresh_")
    ) {

        const page =
            Number(
                id.split("_")[2]
            ) || 0;

        if (
            !interaction.deferred &&
            !interaction.replied
        ) {

            await interaction.deferUpdate();
        }

        return await updateShop(
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

    const result =
        shop.createShopEmbed(
            page
        );

    const embed =
        result.embed;

    const currentPage =
        result.page;

    const maxPage =
        result.maxPage;

    // ======================================
    // 📤 UPDATE AFTER DEFER
    // ======================================

    if (
        interaction.deferred
    ) {

        return await interaction.editReply({

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

    return await interaction.update({

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
