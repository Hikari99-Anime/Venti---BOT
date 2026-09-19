const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MessageFlags
} = require("discord.js");

const User =
    require("../../database/models/User");

const Item =
    require("../../database/models/Item");

// ==========================================
// 🎨 COLORS
// ==========================================

const COLORS = {
    primary: 0xA8DCC0,
    success: 0xA8D8A8,
    warning: 0xFFD166,
    error: 0xF2A7A7
};

// ==========================================
// 📦 DANH MỤC
// ==========================================

const CATEGORIES = {
    farm: {
        name: "Nông sản",
        emoji: "🌾",
        category: "farming"
    },

    fish: {
        name: "Hải sản",
        emoji: "🐟",
        category: "seafood"
    },

    seeds: {
        name: "Hạt giống",
        emoji: "🌱",
        category: "seed"
    },

    tools: {
        name: "Nông cụ",
        emoji: "🧰",
        category: "tool"
    }
};

// ==========================================
// 🔢 GET AMOUNT
// ==========================================

function getAmount(value) {
    if (typeof value === "number") {
        return Number(value);
    }

    if (
        value &&
        typeof value === "object"
    ) {
        return Number(
            value.amount || 0
        );
    }

    return 0;
}

// ==========================================
// 📦 GET ALL ITEMS
// ==========================================

function getAllItems() {
    try {
        if (
            Item &&
            typeof Item.getAll === "function"
        ) {
            const items =
                Item.getAll();

            if (Array.isArray(items)) {
                return items;
            }

            if (
                items &&
                typeof items === "object"
            ) {
                return Object.values(items);
            }
        }
    } catch (error) {
        console.error(
            "[inventory] Item.getAll:",
            error
        );
    }

    return [];
}

// ==========================================
// 📦 GET CATEGORY ITEMS
// ==========================================

function getCategoryItems(
    user,
    category
) {
    const inventory =
        user.inventory || {};

    const data =
        CATEGORIES[category];

    if (!data) {
        return [];
    }

    const allItems =
        getAllItems();

    return allItems
        .filter(item => {
            if (
                !item ||
                !item.id
            ) {
                return false;
            }

            if (
                item.category !==
                data.category
            ) {
                return false;
            }

            const amount =
                getAmount(
                    inventory[item.id]
                );

            return amount > 0;
        })
        .map(item => ({
            ...item,

            amount:
                getAmount(
                    inventory[item.id]
                )
        }));
}

// ==========================================
// 🔢 TOTAL
// ==========================================

function getTotalAmount(user) {
    const inventory =
        user.inventory || {};

    return Object.values(
        inventory
    ).reduce(
        (total, value) => {
            return (
                total +
                getAmount(value)
            );
        },
        0
    );
}

// ==========================================
// 🧩 TEXT
// ==========================================

function text(content) {
    return new TextDisplayBuilder()
        .setContent(content);
}

// ==========================================
// ➖ SEPARATOR
// ==========================================

function separator() {
    return new SeparatorBuilder();
}

// ==========================================
// 📦 ITEM LINE
// ==========================================

function formatItemLine(item) {
    const emoji =
        item.emoji || "📦";

    const name =
        String(
            item.name || item.id
        );

    const amount =
        Number(
            item.amount || 0
        );

    // Căn tên cho đẹp
    const paddedName =
        name.padEnd(
            14,
            " "
        );

    return (
        `> \`${emoji} ${paddedName}: ×${amount}\``
    );
}

// ==========================================
// 🌾 CATEGORY BLOCK
// ==========================================

function createCategoryBlock(
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

    if (!data) {
        return "";
    }

    const lines = [
        `- \`${data.emoji}\` **${data.name}**`
    ];

    if (!items.length) {
        lines.push(
            "> `☁️ Chưa có vật phẩm`"
        );
    } else {
        for (const item of items) {
            lines.push(
                formatItemLine(item)
            );
        }
    }

    return lines.join("\n");
}

// ==========================================
// 🏠 HOME PANEL
// ==========================================

function inventoryPanel(
    userId,
    user,
    username,
    category = "farm"
) {
    const data =
        CATEGORIES[category] ||
        CATEGORIES.farm;

    const total =
        getTotalAmount(user);

    const categoryItems =
        getCategoryItems(
            user,
            category
        );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.primary
            )

            // ==================================
            // HEADER
            // ==================================

            .addTextDisplayComponents(
                text(
                    [
                        "# 🍃 Túi Đồ",
                        `☁️ **${username}** · Columbina`,
                        "",
                        `> ${data.emoji} Đang xem **${data.name}**`
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            // ==================================
            // CATEGORY
            // ==================================

            .addTextDisplayComponents(
                text(
                    [
                        createCategoryBlock(
                            user,
                            category
                        ),

                        ""
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            // ==================================
            // TOTAL
            // ==================================

            .addTextDisplayComponents(
                text(
                    [
                        "- `🎒` **Tổng vật phẩm**",

                        `> \`📦 Số lượng   : ${total} vật phẩm\``,

                        `> \`🌱 Loại item  : ${categoryItems.length}\``
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            // ==================================
            // MENU
            // ==================================

            .addActionRowComponents(
                createMenu(category)
            )

            .addSeparatorComponents(
                separator()
            )

            // ==================================
            // BUTTONS
            // ==================================

            .addActionRowComponents(
                createButtons()
            );

    return container;
}

// ==========================================
// 📂 CATEGORY MENU
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

                .setMinValues(1)
                .setMaxValues(1)

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
                    },

                    {
                        label:
                            "Hạt giống",

                        description:
                            "Hạt giống để trồng cây",

                        value:
                            "seeds",

                        emoji:
                            "🌱",

                        default:
                            category === "seeds"
                    },

                    {
                        label:
                            "Nông cụ",

                        description:
                            "Cuốc, bình tưới & nước",

                        value:
                            "tools",

                        emoji:
                            "🧰",

                        default:
                            category === "tools"
                    }
                )
        );
}

// ==========================================
// 🔘 BUTTONS
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

                .setEmoji(
                    "🔄"
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

        try {

            const userId =
                message.author.id;

            const user =
                User.getOrCreate(
                    userId
                );

            if (!user) {
                return message.reply({
                    content:
                        "`❌` Không thể tải túi đồ."
                });
            }

            const username =
                message.author.globalName ||
                message.author.username ||
                "Traveler";

            // ==================================
            // 📦 SEND V2
            // ==================================

            const msg =
                await message.reply({
                    components: [
                        inventoryPanel(
                            userId,
                            user,
                            username,
                            "farm"
                        )
                    ],

                    flags:
                        MessageFlags.IsComponentsV2
                });

            // ==================================
            // 🎮 COLLECTOR
            // ==================================

            const collector =
                msg.createMessageComponentCollector({
                    time: 120000
                });

            collector.on(
                "collect",
                async interaction => {

                    // ==================================
                    // 🔐 USER CHECK
                    // ==================================

                    if (
                        interaction.user.id !==
                        userId
                    ) {
                        return interaction.reply({
                            content:
                                "`❌` Đây không phải túi đồ của bạn.",

                            flags:
                                MessageFlags.Ephemeral
                        });
                    }

                    try {

                        const id =
                            interaction.customId;

                        // ==================================
                        // 📂 CATEGORY
                        // ==================================

                        if (
                            id ===
                            "inventory_category"
                        ) {

                            const category =
                                interaction.values?.[0];

                            if (
                                !category ||
                                !CATEGORIES[category]
                            ) {
                                return interaction.reply({
                                    content:
                                        "`❌` Danh mục không hợp lệ.",

                                    flags:
                                        MessageFlags.Ephemeral
                                });
                            }

                            const latestUser =
                                User.getOrCreate(
                                    userId
                                );

                            return interaction.update({
                                components: [
                                    inventoryPanel(
                                        userId,
                                        latestUser,
                                        interaction.user.globalName ||
                                        interaction.user.username ||
                                        "Traveler",
                                        category
                                    )
                                ],

                                flags:
                                    MessageFlags.IsComponentsV2
                            });
                        }

                        // ==================================
                        // 🔄 REFRESH
                        // ==================================

                        if (
                            id ===
                            "inventory_refresh"
                        ) {

                            const latestUser =
                                User.getOrCreate(
                                    userId
                                );

                            return interaction.update({
                                components: [
                                    inventoryPanel(
                                        userId,
                                        latestUser,
                                        interaction.user.globalName ||
                                        interaction.user.username ||
                                        "Traveler",
                                        "farm"
                                    )
                                ],

                                flags:
                                    MessageFlags.IsComponentsV2
                            });
                        }

                        // ==================================
                        // ❌ CLOSE
                        // ==================================

                        if (
                            id ===
                            "inventory_close"
                        ) {

                            collector.stop(
                                "closed"
                            );

                            return interaction.update({
                                components: [
                                    new ContainerBuilder()
                                        .setAccentColor(
                                            COLORS.primary
                                        )

                                        .addTextDisplayComponents(
                                            text(
                                                [
                                                    "# 🍃 Túi đồ đã đóng",
                                                    "",
                                                    "> ☁️ Hẹn gặp lại tại Mondstadt!",
                                                    "",
                                                    "🌱 Chúc bạn có một chuyến phiêu lưu thật vui."
                                                ].join("\n")
                                            )
                                        )
                                ],

                                flags:
                                    MessageFlags.IsComponentsV2
                            });
                        }

                        // ==================================
                        // ❓ UNKNOWN
                        // ==================================

                        return interaction.reply({
                            content:
                                "`❌` Tương tác không hợp lệ.",

                            flags:
                                MessageFlags.Ephemeral
                        });

                    } catch (error) {

                        console.error(
                            "[inventory interaction]",
                            error
                        );

                        if (
                            interaction.replied ||
                            interaction.deferred
                        ) {
                            return interaction
                                .followUp({
                                    content:
                                        "`❌` Có lỗi xảy ra khi xử lý túi đồ.",

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => {}
                                );
                        }

                        return interaction
                            .reply({
                                content:
                                    "`❌` Có lỗi xảy ra khi xử lý túi đồ.",

                                flags:
                                    MessageFlags.Ephemeral
                            })
                            .catch(
                                () => {}
                            );
                    }
                }
            );

            // ==================================
            // ⏱️ END
            // ==================================

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

            return msg;

        } catch (error) {

            console.error(
                "[inventory]",
                error
            );

            return message
                .reply({
                    content:
                        "`❌` Không thể mở túi đồ."
                })
                .catch(
                    () => {}
                );
        }
    },

    // ======================================
    // 📤 EXPORT
    // ======================================

    inventoryPanel,

    getCategoryItems,

    getAllItems,

    getTotalAmount,

    getAmount,

    createMenu,

    createButtons,

    CATEGORIES
};
