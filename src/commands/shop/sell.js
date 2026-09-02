
const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const User =
    require("../../database/models/User");

const Item =
    require("../../database/models/Item");

// ==========================================
// 💸 VENTI • MARKET
// ==========================================

module.exports = {
    name: "sell",

    aliases: [
        "sellitem",
        "vsell"
    ],

    description:
        "Bán vật phẩm lấy Mora.",

    usage:
        "Vsell",

    category:
        "economy",

    async execute(message) {
        const userId =
            message.author.id;

        const user =
            User.getOrCreate(
                userId
            );

        if (!user) {
            return message.reply({
                content:
                    "❌ Không thể tải dữ liệu người dùng."
            });
        }

        return openSellMenu(
            message,
            userId
        );
    }
};

// ==========================================
// 🎨 SAFE EMOJI
// ==========================================

function safeEmoji(
    emoji,
    fallback = "📦"
) {
    if (!emoji) {
        return fallback;
    }

    const value =
        String(
            emoji
        ).trim();

    if (
        value.includes("<") ||
        value.includes(">") ||
        value.includes(":")
    ) {
        return fallback;
    }

    if (
        value.length > 8
    ) {
        return fallback;
    }

    return value;
}

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(
    value
) {
    return Number(
        value || 0
    ).toLocaleString();
}

// ==========================================
// 🎒 GET INVENTORY AMOUNT
// ==========================================

function getAmount(
    inventory,
    itemId
) {
    const value =
        inventory?.[itemId];

    if (
        typeof value ===
        "object"
    ) {
        return Number(
            value?.amount || 0
        );
    }

    return Number(
        value || 0
    );
}

// ==========================================
// 📦 GET SELLABLE ITEMS
// ==========================================

function getSellableItems(
    userId,
    category
) {
    const user =
        User.get(
            userId
        ) ||
        User.getOrCreate(
            userId
        );

    const inventory =
        user?.inventory || {};

    return Item
        .getAll()
        .filter(
            item => {
                if (
                    item.category !==
                    category
                ) {
                    return false;
                }

                if (
                    !item.sellPrice
                ) {
                    return false;
                }

                return (
                    getAmount(
                        inventory,
                        item.id
                    ) > 0
                );
            }
        );
}

// ==========================================
// 🏷️ CATEGORY NAME
// ==========================================

function getCategoryName(
    category
) {
    if (
        category ===
        "farming"
    ) {
        return "🌾 Nông sản";
    }

    if (
        category ===
        "seafood"
    ) {
        return "🌊 Hải sản";
    }

    return "📦 Vật phẩm";
}

// ==========================================
// 📊 CATEGORY EMBED
// ==========================================

function createCategoryEmbed(
    userId
) {
    const farmingItems =
        getSellableItems(
            userId,
            "farming"
        );

    const seafoodItems =
        getSellableItems(
            userId,
            "seafood"
        );

    const farmingText =
        farmingItems.length
            ? farmingItems
                .slice(0, 8)
                .map(item => {
                    const amount =
                        getAmount(
                            User.get(userId)?.inventory,
                            item.id
                        );

                    return (
                        `> ${safeEmoji(item.emoji)} **${item.name}**\n` +
                        `> 🎒 Số lượng: **${amount}**\n` +
                        `> 💰 Giá bán: **${money(item.sellPrice)} Mora / cái**`
                    );
                })
                .join("\n\n")
            : "> ☁️ Bạn chưa có nông sản để bán.";

    const seafoodText =
        seafoodItems.length
            ? seafoodItems
                .slice(0, 8)
                .map(item => {
                    const amount =
                        getAmount(
                            User.get(userId)?.inventory,
                            item.id
                        );

                    return (
                        `> ${safeEmoji(item.emoji)} **${item.name}**\n` +
                        `> 🎒 Số lượng: **${amount}**\n` +
                        `> 💰 Giá bán: **${money(item.sellPrice)} Mora / cái**`
                    );
                })
                .join("\n\n")
            : "> ☁️ Bạn chưa có hải sản để bán.";

    return new EmbedBuilder()
        .setColor("#57F287")

        .setTitle(
            "💸 Venti Market"
        )

        .setDescription(
            [
                "🍃 Bán vật phẩm để nhận Mora.",
                "",
                "● 🌾 **Nông sản**",
                "",
                farmingText,
                "",
                "● 🌊 **Hải sản**",
                "",
                seafoodText,
                "",
                "● 💡 **Hướng dẫn**",
                "> Chọn một danh mục bên dưới.",
                "> Sau đó chọn vật phẩm bạn muốn bán."
            ].join("\n")
        )

        .setFooter({
            text:
                "Venti Market • Chỉ hiển thị vật phẩm bạn đang có."
        });
}

// ==========================================
// 📂 CATEGORY SELECT
// ==========================================

function createCategorySelect(
    userId
) {
    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    `sell_category_${userId}`
                )
                .setPlaceholder(
                    "📦 Chọn danh mục..."
                )
                .addOptions([
                    {
                        label:
                            "Nông sản",

                        description:
                            "Xem nông sản bạn đang có.",

                        value:
                            "farming",

                        emoji:
                            "🌾"
                    },

                    {
                        label:
                            "Hải sản",

                        description:
                            "Xem cá bạn đang có.",

                        value:
                            "seafood",

                        emoji:
                            "🌊"
                    }
                ])
        );
}

// ==========================================
// 📦 ITEM EMBED
// ==========================================

function createItemsEmbed(
    userId,
    category,
    items
) {
    const user =
        User.get(
            userId
        );

    const inventory =
        user?.inventory || {};

    const lines = [];

    lines.push(
        `● ${getCategoryName(category)}`
    );

    lines.push("");

    for (
        const item of items
    ) {
        const amount =
            getAmount(
                inventory,
                item.id
            );

        const total =
            Number(
                item.sellPrice || 0
            ) *
            amount;

        lines.push(
            `> ${safeEmoji(item.emoji)} **${item.name}**`
        );

        lines.push(
            `> 🎒 Số lượng: **${amount}**`
        );

        lines.push(
            `> 💰 Giá bán: **${money(item.sellPrice)} Mora / cái**`
        );

        lines.push(
            `> 💵 Bán hết: **${money(total)} Mora**`
        );

        lines.push("");
    }

    lines.push(
        "● 📌 **Lưu ý**"
    );

    lines.push(
        "> Chọn vật phẩm bên dưới để bán."
    );

    lines.push(
        "> Giá bán được tính theo từng cái."
    );

    return new EmbedBuilder()
        .setColor("#57F287")

        .setTitle(
            `${getCategoryName(category)} • Venti Market`
        )

        .setDescription(
            lines.join("\n")
        )

        .setFooter({
            text:
                "Venti Market • Chọn vật phẩm để tiếp tục."
        });
}

// ==========================================
// 📦 ITEM SELECT
// ==========================================

function createItemSelect(
    userId,
    items
) {
    const options =
        items
            .slice(0, 25)
            .map(item => {
                const user =
                    User.get(
                        userId
                    );

                const inventory =
                    user?.inventory || {};

                const amount =
                    getAmount(
                        inventory,
                        item.id
                    );

                return {
                    label:
                        String(
                            item.name
                        ).slice(
                            0,
                            100
                        ),

                    description:
                        `Có ${amount} • ${money(item.sellPrice)} Mora/cái`,

                    value:
                        String(
                            item.id
                        ),

                    emoji:
                        safeEmoji(
                            item.emoji
                        )
                };
            });

    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    `sell_item_${userId}`
                )
                .setPlaceholder(
                    "📦 Chọn vật phẩm muốn bán..."
                )
                .addOptions(
                    options
                )
        );
}

// ==========================================
// 🔙 BACK BUTTON
// ==========================================

function createBackButton(
    userId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `sell_back_${userId}`
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
        );
}

// ==========================================
// 💰 SELL ITEM EMBED
// ==========================================

function createSellItemEmbed(
    item,
    amount
) {
    const price =
        Number(
            item.sellPrice || 0
        );

    const allPrice =
        price *
        amount;

    return new EmbedBuilder()
        .setColor("#FFD166")

        .setTitle(
            `${safeEmoji(item.emoji)} ${item.name}`
        )

        .setDescription(
            [
                `● ${safeEmoji(item.emoji)} **Thông tin vật phẩm**`,
                "",
                `> 📦 Tên: **${item.name}**`,
                `> 🎒 Đang có: **${amount}**`,
                `> 💰 Giá bán: **${money(price)} Mora / cái**`,
                `> 💵 Bán toàn bộ: **${money(allPrice)} Mora**`,
                "",
                "● 🛒 **Chọn số lượng**",
                "> 💰 Bán 1 cái",
                "> 💰 Bán 5 cái",
                "> 💸 Bán toàn bộ"
            ].join("\n")
        )

        .setFooter({
            text:
                "Venti Market • Giá bán tính theo từng cái."
        });
}

// ==========================================
// 🔘 SELL BUTTONS
// ==========================================

function createSellButtons(
    userId,
    amount
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `sell_one_${userId}`
                )
                .setLabel(
                    "Bán 1"
                )
                .setEmoji(
                    "💰"
                )
                .setStyle(
                    ButtonStyle.Primary
                )
                .setDisabled(
                    amount < 1
                ),

            new ButtonBuilder()
                .setCustomId(
                    `sell_five_${userId}`
                )
                .setLabel(
                    "Bán 5"
                )
                .setEmoji(
                    "💰"
                )
                .setStyle(
                    ButtonStyle.Success
                )
                .setDisabled(
                    amount < 5
                ),

            new ButtonBuilder()
                .setCustomId(
                    `sell_all_${userId}`
                )
                .setLabel(
                    "Bán tất cả"
                )
                .setEmoji(
                    "💸"
                )
                .setStyle(
                    ButtonStyle.Danger
                )
                .setDisabled(
                    amount < 1
                ),

            new ButtonBuilder()
                .setCustomId(
                    `sell_back_item_${userId}`
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
        );
}

// ==========================================
// 🏠 OPEN MENU
// ==========================================

async function openSellMenu(
    message,
    userId
) {
    const msg =
        await message.reply({
            embeds: [
                createCategoryEmbed(
                    userId
                )
            ],

            components: [
                createCategorySelect(
                    userId
                )
            ]
        });

    const collector =
        msg.createMessageComponentCollector({
            time:
                120000
        });

    let selectedCategory =
        null;

    let selectedItem =
        null;

    collector.on(
        "collect",
        async interaction => {
            if (
                interaction.user.id !==
                userId
            ) {
                return interaction.reply({
                    content:
                        "❌ Đây không phải menu của bạn.",

                    ephemeral:
                        true
                });
            }

            try {
                const id =
                    interaction.customId;

                // ==================================
                // CATEGORY
                // ==================================

                if (
                    id ===
                    `sell_category_${userId}`
                ) {
                    selectedCategory =
                        interaction.values[0];

                    const items =
                        getSellableItems(
                            userId,
                            selectedCategory
                        );

                    if (
                        !items.length
                    ) {
                        return interaction.reply({
                            content:
                                selectedCategory ===
                                "farming"
                                    ? "🌾 Bạn chưa có nông sản nào để bán."
                                    : "🌊 Bạn chưa có hải sản nào để bán.",

                            ephemeral:
                                true
                        });
                    }

                    return interaction.update({
                        embeds: [
                            createItemsEmbed(
                                userId,
                                selectedCategory,
                                items
                            )
                        ],

                        components: [
                            createItemSelect(
                                userId,
                                items
                            ),

                            createBackButton(
                                userId
                            )
                        ]
                    });
                }

                // ==================================
                // ITEM
                // ==================================

                if (
                    id ===
                    `sell_item_${userId}`
                ) {
                    selectedItem =
                        interaction.values[0];

                    const item =
                        Item.get(
                            selectedItem
                        );

                    if (!item) {
                        return interaction.reply({
                            content:
                                "❌ Item không tồn tại.",

                            ephemeral:
                                true
                        });
                    }

                    const currentUser =
                        User.get(
                            userId
                        );

                    const amount =
                        getAmount(
                            currentUser?.inventory,
                            selectedItem
                        );

                    if (
                        amount <= 0
                    ) {
                        return interaction.reply({
                            content:
                                `🎒 Bạn không còn **${item.name}**.`,

                            ephemeral:
                                true
                        });
                    }

                    return interaction.update({
                        embeds: [
                            createSellItemEmbed(
                                item,
                                amount
                            )
                        ],

                        components: [
                            createSellButtons(
                                userId,
                                amount
                            )
                        ]
                    });
                }

                // ==================================
                // BACK CATEGORY
                // ==================================

                if (
                    id ===
                    `sell_back_${userId}`
                ) {
                    selectedCategory =
                        null;

                    selectedItem =
                        null;

                    return interaction.update({
                        embeds: [
                            createCategoryEmbed(
                                userId
                            )
                        ],

                        components: [
                            createCategorySelect(
                                userId
                            )
                        ]
                    });
                }

                // ==================================
                // BACK ITEM
                // ==================================

                if (
                    id ===
                    `sell_back_item_${userId}`
                ) {
                    if (
                        !selectedCategory
                    ) {
                        return interaction.update({
                            embeds: [
                                createCategoryEmbed(
                                    userId
                                )
                            ],

                            components: [
                                createCategorySelect(
                                    userId
                                )
                            ]
                        });
                    }

                    const items =
                        getSellableItems(
                            userId,
                            selectedCategory
                        );

                    if (
                        !items.length
                    ) {
                        return interaction.update({
                            embeds: [
                                createCategoryEmbed(
                                    userId
                                )
                            ],

                            components: [
                                createCategorySelect(
                                    userId
                                )
                            ]
                        });
                    }

                    return interaction.update({
                        embeds: [
                            createItemsEmbed(
                                userId,
                                selectedCategory,
                                items
                            )
                        ],

                        components: [
                            createItemSelect(
                                userId,
                                items
                            ),

                            createBackButton(
                                userId
                            )
                        ]
                    });
                }

                // ==================================
                // SELL
                // ==================================

                if (
                    id ===
                    `sell_one_${userId}` ||
                    id ===
                    `sell_five_${userId}` ||
                    id ===
                    `sell_all_${userId}`
                ) {
                    if (
                        !selectedItem
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Chưa chọn vật phẩm.",

                            ephemeral:
                                true
                        });
                    }

                    const item =
                        Item.get(
                            selectedItem
                        );

                    if (!item) {
                        return interaction.reply({
                            content:
                                "❌ Item không tồn tại.",

                            ephemeral:
                                true
                        });
                    }

                    const currentUser =
                        User.get(
                            userId
                        );

                    const currentAmount =
                        getAmount(
                            currentUser?.inventory,
                            selectedItem
                        );

                    if (
                        currentAmount <= 0
                    ) {
                        return interaction.reply({
                            content:
                                `🎒 Bạn không còn **${item.name}**.`,

                            ephemeral:
                                true
                        });
                    }

                    let sellAmount =
                        1;

                    if (
                        id ===
                        `sell_five_${userId}`
                    ) {
                        sellAmount =
                            5;
                    }

                    if (
                        id ===
                        `sell_all_${userId}`
                    ) {
                        sellAmount =
                            currentAmount;
                    }

                    if (
                        sellAmount >
                        currentAmount
                    ) {
                        return interaction.reply({
                            content:
                                `🎒 Bạn chỉ có **${currentAmount} ${item.name}**.`,

                            ephemeral:
                                true
                        });
                    }

                    const total =
                        Number(
                            item.sellPrice || 0
                        ) *
                        sellAmount;

                    // ==================================
                    // REMOVE ITEM
                    // ==================================

                    const removed =
                        Item.remove(
                            userId,
                            selectedItem,
                            sellAmount
                        );

                    if (
                        removed ===
                        false
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Không thể trừ vật phẩm.",

                            ephemeral:
                                true
                        });
                    }

                    // ==================================
                    // ADD MORA
                    // ==================================

                    User.addBalance(
                        userId,
                        total
                    );

                    const latestUser =
                        User.get(
                            userId
                        );

                    const remaining =
                        getAmount(
                            latestUser?.inventory,
                            selectedItem
                        );

                    const successEmbed =
                        new EmbedBuilder()
                            .setColor(
                                "#57F287"
                            )

                            .setTitle(
                                "● 💸 Bán thành công"
                            )

                            .setDescription(
                                [
                                    `> ${safeEmoji(item.emoji)} **${item.name} ×${sellAmount}**`,
                                    "",
                                    `● 💰 **Giao dịch**`,
                                    `> 💵 Nhận được: **+${money(total)} Mora**`,
                                    `> 🎒 Còn lại: **${remaining}**`,
                                    "",
                                    "● 🍃 **Venti Market**",
                                    "> Giao dịch đã được hoàn tất."
                                ].join("\n")
                            )

                            .setFooter({
                                text:
                                    "Venti Market"
                            });

                    return interaction.update({
                        embeds: [
                            successEmbed
                        ],

                        components: []
                    });
                }

            } catch (error) {
                console.error(
                    "[sell interaction]",
                    error
                );

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {
                    return interaction.followUp({
                        content:
                            "🍃 Có lỗi xảy ra trong Market.",

                        ephemeral:
                            true
                    }).catch(
                        () => {}
                    );
                }

                return interaction.reply({
                    content:
                        "🍃 Có lỗi xảy ra trong Market.",

                    ephemeral:
                        true
                }).catch(
                    () => {}
                );
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

