const help = require("../interactions/buttons/help");
const profile = require("../interactions/buttons/profile");
const inventory = require("../interactions/buttons/inventory");
const shop = require("../interactions/buttons/shop");
const fish = require("../interactions/buttons/fish");
const helpMenu = require("../interactions/menus/helpMenu");

async function handleInteraction(interaction) {
    try {
        if (interaction.isButton()) {
            const id = interaction.customId;

            // ─────────────────────────────
            // HELP
            // ─────────────────────────────

            if (id.startsWith("help_")) {
                return help.execute(interaction);
            }

            // ─────────────────────────────
            // PROFILE
            // ─────────────────────────────

            if (id.startsWith("profile_")) {
                if (
                    id === "profile_inventory" ||
                    id === "profile_shop"
                ) {
                    return routeProfile(interaction);
                }

                return profile.execute(interaction);
            }

            // ─────────────────────────────
            // INVENTORY
            // ─────────────────────────────

            if (id.startsWith("inventory_")) {
                return routeInventory(interaction);
            }

            // ─────────────────────────────
            // SHOP
            // ─────────────────────────────

            if (id.startsWith("shop_")) {
                return routeShop(interaction);
            }

            // ─────────────────────────────
            // FISHING
            // ─────────────────────────────

            if (id.startsWith("fish_")) {
                return fish.execute(interaction);
            }
        }

        // ─────────────────────────────
        // HELP SELECT MENU
        // ─────────────────────────────

        if (interaction.isStringSelectMenu()) {
            if (
                interaction.customId === "help_menu"
            ) {
                return helpMenu.execute(interaction);
            }
        }
    } catch (error) {
        console.error(
            "⚠️ Interaction Error:",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {
            return interaction.followUp({
                content:
                    "🍃 Có lỗi xảy ra khi xử lý thao tác này.",
                ephemeral: true
            }).catch(() => {});
        }

        return interaction.reply({
            content:
                "🍃 Có lỗi xảy ra khi xử lý thao tác này.",
            ephemeral: true
        }).catch(() => {});
    }
}

// ─────────────────────────────────────
// PROFILE ROUTER
// ─────────────────────────────────────

async function routeProfile(interaction) {
    const id = interaction.customId;

    if (id === "profile_inventory") {
        return inventory.execute(interaction);
    }

    if (id === "profile_shop") {
        return shop.execute(interaction);
    }

    return profile.execute(interaction);
}

// ─────────────────────────────────────
// INVENTORY ROUTER
// ─────────────────────────────────────

async function routeInventory(interaction) {
    const id = interaction.customId;

    if (id === "inventory_shop") {
        return shop.execute(interaction);
    }

    if (id === "inventory_back") {
        return profile.execute(interaction);
    }

    if (id === "inventory_close") {
        return interaction.update({
            content:
                "🍃 The wind has carried the menu away.",
            embeds: [],
            components: []
        });
    }

    return;
}

// ─────────────────────────────────────
// SHOP ROUTER
// ─────────────────────────────────────

async function routeShop(interaction) {
    const id = interaction.customId;

    // Profile
    if (id === "shop_profile") {
        return profile.execute(interaction);
    }

    // Inventory
    if (id === "shop_inventory") {
        return inventory.execute(interaction);
    }

    // Close
    if (id === "shop_close") {
        return interaction.update({
            content:
                "🍃 The shop has closed.",
            embeds: [],
            components: []
        });
    }

    // Previous page
    if (id.startsWith("shop_prev_")) {
        const page =
            Number(id.split("_")[2]) || 0;

        const nextPage =
            Math.max(0, page - 1);

        return updateShop(
            interaction,
            nextPage
        );
    }

    // Next page
    if (id.startsWith("shop_next_")) {
        const page =
            Number(id.split("_")[2]) || 0;

        const nextPage =
            page + 1;

        return updateShop(
            interaction,
            nextPage
        );
    }

    // Refresh
    if (id.startsWith("shop_refresh_")) {
        const page =
            Number(id.split("_")[2]) || 0;

        return updateShop(
            interaction,
            page
        );
    }

    return;
}

// ─────────────────────────────────────
// UPDATE SHOP
// ─────────────────────────────────────

async function updateShop(
    interaction,
    page
) {
    const {
        embed,
        page: currentPage,
        maxPage
    } = shop.createShopEmbed(page);

    return interaction.update({
        embeds: [embed],
        components: [
            shop.createButtons(
                currentPage,
                maxPage
            )
        ]
    });
}

module.exports = {
    handleInteraction
};
