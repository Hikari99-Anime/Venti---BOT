const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const User = require("../../database/models/User");
const Item = require("../../database/models/Item");

module.exports = {
    name: "inventory",
    aliases: ["vinventory", "inv"],
    description: "Xem túi đồ của bạn.",

    async execute(message) {
        const userId = message.author.id;

        User.getOrCreate(userId);

        const msg = await message.reply(
            createInventoryHome(userId)
        );

        const collector =
            msg.createMessageComponentCollector({
                time: 180000
            });

        collector.on(
            "collect",
            async interaction => {
                if (
                    interaction.user.id !==
                    userId
                ) {
                    return interaction.reply({
                        content:
                            "❌ Đây không phải inventory của bạn.",
                        ephemeral: true
                    });
                }

                try {
                    // =========================
                    // CHỌN LOẠI
                    // =========================

                    if (
                        interaction.customId ===
                        `inv_category_${userId}`
                    ) {
                        const category =
                            interaction.values[0];

                        return showCategory(
                            interaction,
                            userId,
                            category
                        );
                    }

                    // =========================
                    // CHỌN ITEM
                    // =========================

                    if (
                        interaction.customId ===
                        `inv_item_${userId}`
                    ) {
                        const itemId =
                            interaction.values[0];

                        return showItem(
                            interaction,
                            userId,
                            itemId
                        );
                    }

                    // =========================
                    // REFRESH
                    // =========================

                    if (
                        interaction.customId ===
                        `inv_refresh_${userId}`
                    ) {
                        return interaction.update(
                            createInventoryHome(
                                userId
                            )
                        );
                    }

                    // =========================
                    // HOME
                    // =========================

                    if (
                        interaction.customId ===
                        `inv_home_${userId}`
                    ) {
                        return interaction.update(
                            createInventoryHome(
                                userId
                            )
                        );
                    }

                    // =========================
                    // BACK CATEGORY
                    // =========================

                    if (
                        interaction.customId ===
                        `inv_back_${userId}`
                    ) {
                        return interaction.update(
                            createInventoryHome(
                                userId
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        "Inventory error:",
                        error
                    );

                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Có lỗi xảy ra với inventory.",
                            ephemeral: true
                        });
                    }
                }
            }
        );

        collector.on(
            "end",
            async () => {
                try {
                    await msg.edit({
                        components: []
                    });
                } catch {}
            }
        );
    }
};

// ==========================================
// 🎒 INVENTORY HOME
// ==========================================

function createInventoryHome(userId) {
    const user =
        User.getOrCreate(userId);

    const inventory =
        user.inventory || {};

    const items =
        getInventoryItems(inventory);

    const counts = {
        farm: 0,
        fish: 0,
        other: 0
    };

    for (
        const item of items
    ) {
        const category =
            getCategory(item);

        if (
            category === "farm"
        ) {
            counts.farm++;
        } else if (
            category === "fish"
        ) {
            counts.fish++;
        } else {
            counts.other++;
        }
    }

    const totalQuantity =
        items.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.amount || 0
                ),
            0
        );

    const totalValue =
        items.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.sellPrice || 0
                ) *
                Number(
                    item.amount || 0
                ),
            0
        );

    const embed =
        new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
                `🎒 Túi đồ của ${userId === "" ? "bạn" : "bạn"}`
            )
            .setDescription(
                "Chọn một danh mục để xem vật phẩm."
            )
            .addFields(
                {
                    name: "🌾 Nông sản",
                    value:
                        `${counts.farm} loại`,
                    inline: true
                },
                {
                    name: "🐟 Hải sản",
                    value:
                        `${counts.fish} loại`,
                    inline: true
                },
                {
                    name: "📦 Khác",
                    value:
                        `${counts.other} loại`,
                    inline: true
                },
                {
                    name: "🔢 Tổng số lượng",
                    value:
                        `${totalQuantity.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "💰 Giá trị bán",
                    value:
                        `${totalValue.toLocaleString()} Mora`,
                    inline: true
                }
            )
            .setFooter({
                text:
                    "Chọn danh mục bên dưới."
            });

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(
                            `inv_category_${userId}`
                        )
                        .setPlaceholder(
                            "🎒 Chọn danh mục..."
                        )
                        .addOptions([
                            {
                                label:
                                    "Nông sản",
                                description:
                                    "Cây trồng và sản phẩm từ farm",
                                value:
                                    "farm",
                                emoji:
                                    "🌾"
                            },
                            {
                                label:
                                    "Hải sản",
                                description:
                                    "Cá và các sản phẩm câu được",
                                value:
                                    "fish",
                                emoji:
                                    "🐟"
                            },
                            {
                                label:
                                    "Vật phẩm khác",
                                description:
                                    "Các vật phẩm khác",
                                value:
                                    "other",
                                emoji:
                                    "📦"
                            }
                        ])
                ),

            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `inv_refresh_${userId}`
                        )
                        .setLabel(
                            "Làm mới"
                        )
                        .setEmoji(
                            "🔄"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ]
    };
}

// ==========================================
// 📦 GET INVENTORY
// ==========================================

function getInventoryItems(
    inventory
) {
    const result = [];

    for (
        const [
            itemId,
            amount
        ] of Object.entries(
            inventory
        )
    ) {
        const item =
            Item.get(itemId);

        if (!item) {
            continue;
        }

        const quantity =
            Number(amount || 0);

        if (quantity <= 0) {
            continue;
        }

        result.push({
            ...item,
            amount: quantity
        });
    }

    return result;
}

// ==========================================
// 🏷️ CATEGORY
// ==========================================

function getCategory(item) {
    if (
        item.category ===
            "fish" ||
        item.category ===
            "seafood"
    ) {
        return "fish";
    }

    if (
        item.category ===
            "crop" ||
        item.category ===
            "farm" ||
        item.category ===
            "food" ||
        item.category ===
            "seed"
    ) {
        return "farm";
    }

    // Dự phòng cho cá nếu item chưa có category
    const id =
        String(
            item.id || ""
        ).toLowerCase();

    if (
        id.includes("fish")
    ) {
        return "fish";
    }

    return "other";
}

// ==========================================
// 📋 SHOW CATEGORY
// ==========================================

async function showCategory(
    interaction,
    userId,
    category
) {
    const user =
        User.getOrCreate(userId);

    const items =
        getInventoryItems(
            user.inventory || {}
        ).filter(
            item =>
                getCategory(item) ===
                category
        );

    let title =
        "📦 Vật phẩm";

    let emoji =
        "📦";

    if (
        category ===
        "farm"
    ) {
        title =
            "🌾 Nông sản";
        emoji =
            "🌾";
    }

    if (
        category ===
        "fish"
    ) {
        title =
            "🐟 Hải sản";
        emoji =
            "🐟";
    }

    if (!items.length) {
        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        "#ED4245"
                    )
                    .setTitle(
                        title
                    )
                    .setDescription(
                        `${emoji} Bạn chưa có vật phẩm nào trong danh mục này.`
                    )
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `inv_home_${userId}`
                            )
                            .setLabel(
                                "Quay lại"
                            )
                            .setEmoji(
                                "⬅️"
                            )
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    )
            ]
        });
    }

    const options =
        items
            .slice(0, 25)
            .map(item => {
                const sellPrice =
                    Number(
                        item.sellPrice ||
                        0
                    );

                return {
                    label:
                        item.name,

                    description:
                        `Có ${item.amount} | Bán ${sellPrice.toLocaleString()} Mora/cái`,

                    value:
                        String(
                            item.id
                        ),

                    emoji:
                        item.emoji ||
                        "📦"
                };
            });

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    "#57F287"
                )
                .setTitle(
                    title
                )
                .setDescription(
                    `Có **${items.length} loại vật phẩm**.\n\n` +
                    "Chọn vật phẩm để xem chi tiết."
                )
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(
                            `inv_item_${userId}`
                        )
                        .setPlaceholder(
                            "📦 Chọn vật phẩm..."
                        )
                        .addOptions(
                            options
                        )
                ),

            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `inv_home_${userId}`
                        )
                        .setLabel(
                            "Danh mục"
                        )
                        .setEmoji(
                            "⬅️"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `inv_refresh_${userId}`
                        )
                        .setLabel(
                            "Làm mới"
                        )
                        .setEmoji(
                            "🔄"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                )
        ]
    });
}

// ==========================================
// 🔍 SHOW ITEM
// ==========================================

async function showItem(
    interaction,
    userId,
    itemId
) {
    const user =
        User.getOrCreate(userId);

    const amount =
        Number(
            user.inventory?.[
                itemId
            ] || 0
        );

    const item =
        Item.get(itemId);

    if (!item) {
        return interaction.reply({
            content:
                "❌ Item không tồn tại.",
            ephemeral: true
        });
    }

    if (amount <= 0) {
        return interaction.reply({
            content:
                "❌ Bạn không còn item này.",
            ephemeral: true
        });
    }

    const sellPrice =
        Number(
            item.sellPrice || 0
        );

    const total =
        sellPrice *
        amount;

    const category =
        getCategory(item);

    let categoryName =
        "📦 Khác";

    if (
        category ===
        "farm"
    ) {
        categoryName =
            "🌾 Nông sản";
    }

    if (
        category ===
        "fish"
    ) {
        categoryName =
            "🐟 Hải sản";
    }

    const embed =
        new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle(
                `${item.emoji || "📦"} ${item.name}`
            )
            .setDescription(
                item.description ||
                "Không có mô tả."
            )
            .addFields(
                {
                    name:
                        "📂 Loại",
                    value:
                        categoryName,
                    inline: true
                },
                {
                    name:
                        "🔢 Số lượng",
                    value:
                        `×${amount.toLocaleString()}`,
                    inline: true
                },
                {
                    name:
                        "💰 Giá bán",
                    value:
                        `${sellPrice.toLocaleString()} Mora/cái`,
                    inline: true
                },
                {
                    name:
                        "💵 Giá trị toàn bộ",
                    value:
                        `${total.toLocaleString()} Mora`,
                    inline: true
                }
            );

    return interaction.update({
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `inv_back_${userId}`
                        )
                        .setLabel(
                            "Danh mục"
                        )
                        .setEmoji(
                            "⬅️"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `inv_refresh_${userId}`
                        )
                        .setLabel(
                            "Làm mới"
                        )
                        .setEmoji(
                            "🔄"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                )
        ]
    });
}
