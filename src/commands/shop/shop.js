
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

// ═══════════════════════════════════════
// 🍃 VENTI • SHOP
// ═══════════════════════════════════════

const PLOTS = [
    {
        id: 2,
        name: "Ô đất #2",
        emoji: "🟫",
        price: 1000,
        description:
            "Mở khóa thêm một ô đất để trồng cây."
    },
    {
        id: 3,
        name: "Ô đất #3",
        emoji: "🟫",
        price: 3000,
        description:
            "Mở khóa thêm một ô đất để mở rộng trang trại."
    },
    {
        id: 4,
        name: "Ô đất #4",
        emoji: "🟫",
        price: 7500,
        description:
            "Một ô đất mới cho trang trại."
    },
    {
        id: 5,
        name: "Ô đất #5",
        emoji: "🟫",
        price: 15000,
        description:
            "Mở rộng thêm không gian trang trại."
    },
    {
        id: 6,
        name: "Ô đất #6",
        emoji: "🟫",
        price: 30000,
        description:
            "Một ô đất cao cấp."
    },
    {
        id: 7,
        name: "Ô đất #7",
        emoji: "🟫",
        price: 60000,
        description:
            "Ô đất cuối cùng của trang trại."
    }
];

// ═══════════════════════════════════════
// ⚙️ SHOP CONFIG
// ═══════════════════════════════════════

const SEED_SHOP_SIZE = 5;

// Shop tự đổi sau 15 phút
const SEED_SHOP_DURATION =
    15 * 60 * 1000;

// Giá đổi shop
const REFRESH_PRICE = 100;

// Mỗi loại hạt tối đa mua 5
const SEED_PURCHASE_LIMIT = 5;

// ═══════════════════════════════════════
// 🛡️ SAFE EMOJI
// ═══════════════════════════════════════

function safeEmoji(
    emoji,
    fallback = "📦"
) {
    if (!emoji) {
        return fallback;
    }

    const value =
        String(emoji).trim();

    if (
        value.includes("<") ||
        value.includes(">") ||
        value.includes(":")
    ) {
        return fallback;
    }

    if (value.length > 8) {
        return fallback;
    }

    return value;
}

// ═══════════════════════════════════════
// 🔀 RANDOM
// ═══════════════════════════════════════

function shuffle(array) {
    return [...array].sort(
        () => Math.random() - 0.5
    );
}

// ═══════════════════════════════════════
// 🌱 CREATE RANDOM SEED SHOP
// ═══════════════════════════════════════

function createSeedShop() {
    const allSeeds =
        Item
            .getAll()
            .filter(
                item =>
                    item.category === "seed"
            );

    if (!allSeeds.length) {
        return [];
    }

    return shuffle(allSeeds)
        .slice(0, SEED_SHOP_SIZE)
        .map(item => ({
            itemId: item.id,
            bought: 0
        }));
}

// ═══════════════════════════════════════
// 🌱 GET SEED SHOP
// ═══════════════════════════════════════

function getSeedShop(userId) {
    const user =
        User.getOrCreate(userId);

    const now =
        Date.now();

    const current =
        user.seedShop;

    if (
        current &&
        Array.isArray(current.items) &&
        current.items.length > 0 &&
        Number(current.createdAt || 0) +
            SEED_SHOP_DURATION >
            now
    ) {
        return current;
    }

    const shop = {
        items:
            createSeedShop(),
        createdAt:
            now
    };

    saveUserField(
        userId,
        "seedShop",
        shop
    );

    return shop;
}

// ═══════════════════════════════════════
// 🔄 REFRESH
// ═══════════════════════════════════════

function refreshSeedShop(userId) {
    const shop = {
        items:
            createSeedShop(),
        createdAt:
            Date.now()
    };

    saveUserField(
        userId,
        "seedShop",
        shop
    );

    return shop;
}

// ═══════════════════════════════════════
// ⏳ REMAINING TIME
// ═══════════════════════════════════════

function getRemainingShopTime(shop) {
    const expires =
        Number(shop.createdAt || 0) +
        SEED_SHOP_DURATION;

    return Math.max(
        0,
        expires - Date.now()
    );
}

// ═══════════════════════════════════════
// 🌱 CURRENT SEEDS
// ═══════════════════════════════════════

function getCurrentSeeds(userId) {
    const shop =
        getSeedShop(userId);

    return shop.items
        .map(entry =>
            Item.get(entry.itemId)
        )
        .filter(Boolean);
}

// ═══════════════════════════════════════
// 🏠 COMMAND
// ═══════════════════════════════════════

const command = {
    name: "shop",

    aliases: [
        "vshop"
    ],

    description:
        "🛒 Cửa hàng của Venti.",

    usage:
        "Vshop",

    category:
        "economy",

    async execute(message) {
        try {
            const userId =
                message.author.id;

            User.getOrCreate(
                userId
            );

            // Tạo shop random ngay khi mở
            getSeedShop(
                userId
            );

            const msg =
                await message.reply({
                    embeds: [
                        homeEmbed(
                            userId
                        )
                    ],
                    components: [
                        categoryRow(
                            userId
                        )
                    ]
                });

            const collector =
                msg.createMessageComponentCollector({
                    time: 120000
                });

            const state = {
                category: null,
                itemId: null
            };

            collector.on(
                "collect",
                async interaction => {
                    if (
                        interaction.user.id !==
                        userId
                    ) {
                        return interaction.reply({
                            content:
                                "🍃 Đây không phải shop của bạn.",
                            ephemeral: true
                        });
                    }

                    try {
                        const id =
                            interaction.customId;

                        // ═══════════════════
                        // CATEGORY
                        // ═══════════════════

                        if (
                            id ===
                            `shop_category_${userId}`
                        ) {
                            state.category =
                                interaction.values[0];

                            state.itemId =
                                null;

                            return showCategory(
                                interaction,
                                state.category,
                                userId
                            );
                        }

                        // ═══════════════════
                        // ITEM
                        // ═══════════════════

                        if (
                            id ===
                            `shop_item_${userId}`
                        ) {
                            state.itemId =
                                interaction.values[0];

                            return showItem(
                                interaction,
                                state.category,
                                state.itemId,
                                userId
                            );
                        }

                        // ═══════════════════
                        // BUY
                        // ═══════════════════

                        if (
                            id ===
                            `shop_buy_${userId}`
                        ) {
                            return buyItem(
                                interaction,
                                state.category,
                                state.itemId,
                                userId
                            );
                        }

                        // ═══════════════════
                        // REFRESH
                        // ═══════════════════

                        if (
                            id ===
                            `shop_refresh_${userId}`
                        ) {
                            return refreshShop(
                                interaction,
                                userId
                            );
                        }

                        // ═══════════════════
                        // HOME
                        // ═══════════════════

                        if (
                            id ===
                            `shop_home_${userId}`
                        ) {
                            state.category =
                                null;

                            state.itemId =
                                null;

                            return interaction.update({
                                embeds: [
                                    homeEmbed(
                                        userId
                                    )
                                ],
                                components: [
                                    categoryRow(
                                        userId
                                    )
                                ]
                            });
                        }

                        // ═══════════════════
                        // BACK
                        // ═══════════════════

                        if (
                            id ===
                            `shop_back_${userId}`
                        ) {
                            return showCategory(
                                interaction,
                                state.category,
                                userId
                            );
                        }

                        // ═══════════════════
                        // CLOSE
                        // ═══════════════════

                        if (
                            id ===
                            `shop_close_${userId}`
                        ) {
                            collector.stop();

                            return interaction.update({
                                content:
                                    "🍃 Venti đã đóng cửa hàng.",
                                embeds: [],
                                components: []
                            });
                        }
                    } catch (error) {
                        console.error(
                            "[shop interaction]",
                            error
                        );

                        if (
                            interaction.replied ||
                            interaction.deferred
                        ) {
                            return interaction
                                .followUp({
                                    content:
                                        "🍃 Có lỗi xảy ra trong shop.",
                                    ephemeral: true
                                })
                                .catch(
                                    () => {}
                                );
                        }

                        return interaction
                            .reply({
                                content:
                                    "🍃 Có lỗi xảy ra trong shop.",
                                ephemeral: true
                            })
                            .catch(
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
        } catch (error) {
            console.error(
                "[shop]",
                error
            );

            return message
                .reply({
                    content:
                        "🍃 Không thể mở Venti Shop."
                })
                .catch(
                    () => {}
                );
        }
    }
};

// ═══════════════════════════════════════
// 🏠 HOME EMBED
// ═══════════════════════════════════════

function homeEmbed(userId) {
    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user?.balance || 0
        );

    return new EmbedBuilder()
        .setColor("#9ccfd8")
        .setTitle(
            "🛒 Venti Shop"
        )
        .setDescription(
            [
                "+ `🌱` **Hạt giống**",
                "> 5 hạt giống ngẫu nhiên dành riêng cho bạn.",

                "",

                "+ `🎣` **Cần câu**",
                "> Mua cần câu để câu cá.",

                "",

                "+ `🟫` **Đất trang trại**",
                "> Mở khóa thêm ô đất.",

                "",

                "+ `💰` **Mora**",
                `> ${balance.toLocaleString()} Mora`
            ].join("\n")
        )
        .setFooter({
            text:
                "♡ Chọn danh mục bên dưới."
        });
}

// ═══════════════════════════════════════
// 📂 CATEGORY ROW
// ═══════════════════════════════════════

function categoryRow(userId) {
    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    `shop_category_${userId}`
                )
                .setPlaceholder(
                    "🛒 Chọn danh mục..."
                )
                .addOptions([
                    {
                        label:
                            "Hạt giống",
                        description:
                            "5 hạt giống random.",
                        value:
                            "seeds",
                        emoji:
                            "🌱"
                    },
                    {
                        label:
                            "Cần câu",
                        description:
                            "Mua cần câu.",
                        value:
                            "rods",
                        emoji:
                            "🎣"
                    },
                    {
                        label:
                            "Đất trang trại",
                        description:
                            "Mở khóa ô đất.",
                        value:
                            "plots",
                        emoji:
                            "🟫"
                    }
                ])
        );
}

// ═══════════════════════════════════════
// 📦 GET ITEMS
// ═══════════════════════════════════════

function getItems(
    category,
    userId
) {
    if (
        category ===
        "seeds"
    ) {
        return getCurrentSeeds(
            userId
        );
    }

    if (
        category ===
        "rods"
    ) {
        return Item
            .getAll()
            .filter(
                item =>
                    item.category ===
                    "rod"
            );
    }

    if (
        category ===
        "plots"
    ) {
        const farm =
            User.getFarm(
                userId
            );

        const unlocked =
            Array.isArray(
                farm?.plots
            )
                ? farm.plots
                    .filter(
                        plot =>
                            plot.unlocked
                    )
                    .map(
                        plot =>
                            Number(
                                plot.id
                            )
                    )
                : [];

        return PLOTS.filter(
            plot =>
                !unlocked.includes(
                    Number(
                        plot.id
                    )
                )
        );
    }

    return [];
}

// ═══════════════════════════════════════
// 📋 CATEGORY EMBED
// ═══════════════════════════════════════

function createCategoryEmbed(
    category,
    items,
    userId
) {
    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user?.balance || 0
        );

    let title =
        "🛒 Venti Shop";

    let description =
        "";

    // ═════════════════════════════
    // 🌱 SEEDS — GỌN
    // ═════════════════════════════

    if (
        category ===
        "seeds"
    ) {
        const shop =
            getSeedShop(
                userId
            );

        const remaining =
            getRemainingShopTime(
                shop
            );

        title =
            "+ `🌱` Hạt giống";

        description =
            [
                "> 5 hạt giống ngẫu nhiên.",
                `> 🔄 Đổi mới sau: **${formatTime(remaining)}**`,
                `> 💰 Đổi ngay: **${REFRESH_PRICE.toLocaleString()} Mora**`
            ].join("\n");
    }

    // ═════════════════════════════
    // 🎣 RODS
    // ═════════════════════════════

    if (
        category ===
        "rods"
    ) {
        title =
            "+ `🎣` Cần câu";

        description =
            "> Những chiếc cần câu giúp bạn khám phá Windrise Lake.";
    }

    // ═════════════════════════════
    // 🟫 PLOTS
    // ═════════════════════════════

    if (
        category ===
        "plots"
    ) {
        title =
            "+ `🟫` Đất trang trại";

        description =
            "> Mở khóa thêm không gian cho trang trại.";
    }

    const lines = [];

    for (
        const item of items
    ) {
        const emoji =
            safeEmoji(
                item.emoji
            );

        const price =
            getPrice(
                item
            );

        // ═════════════════════
        // 🌱 SEED
        // ═════════════════════

        if (
            category ===
            "seeds"
        ) {
            const bought =
                getBoughtCount(
                    userId,
                    item.id
                );

            const canBuy =
                Math.max(
                    0,
                    SEED_PURCHASE_LIMIT -
                    bought
                );

            lines.push(
                [
                    `+ \`${emoji}\` **${item.name}**`,
                    `> 💰 **${price.toLocaleString()} Mora**`,
                    `> 🛒 Có thể mua: **${canBuy}/${SEED_PURCHASE_LIMIT}**`
                ].join("\n")
            );

            lines.push("");
            continue;
        }

        // ═════════════════════
        // 🎣 ROD
        // ═════════════════════

        if (
            category ===
            "rods"
        ) {
            lines.push(
                [
                    `+ \`${emoji}\` **${item.name}**`,
                    `> ${item.description || "Cần câu của Venti."}`,
                    `> 💰 **${price.toLocaleString()} Mora**`,
                    `> ⭐ Level ${item.rodLevel || 1} • 🛡️ ${item.durability || item.maxDurability || 20}`
                ].join("\n")
            );

            lines.push("");
            continue;
        }

        // ═════════════════════
        // 🟫 PLOT
        // ═════════════════════

        if (
            category ===
            "plots"
        ) {
            lines.push(
                [
                    `+ \`${emoji}\` **${item.name}**`,
                    `> ${item.description || "Ô đất trang trại."}`,
                    `> 💰 **${price.toLocaleString()} Mora**`
                ].join("\n")
            );

            lines.push("");
        }
    }

    if (
        !lines.length
    ) {
        lines.push(
            "☁️ Hiện không còn sản phẩm."
        );
    }

    return new EmbedBuilder()
        .setColor("#9ccfd8")
        .setTitle(
            title
        )
        .setDescription(
            [
                description,
                "",
                ...lines,
                `+ \`💰\` **Mora:** ${balance.toLocaleString()}`,
                "",
                "♡ Chọn sản phẩm bên dưới."
            ].join("\n")
        )
        .setFooter({
            text:
                "🍃 Venti Shop · Windrise"
        });
}

// ═══════════════════════════════════════
// 📂 CATEGORY PAGE
// ═══════════════════════════════════════

async function showCategory(
    interaction,
    category,
    userId
) {
    const items =
        getItems(
            category,
            userId
        );

    if (
        !items.length
    ) {
        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        "#f2a7a7"
                    )
                    .setTitle(
                        "+ `🍃` Hết hàng"
                    )
                    .setDescription(
                        "> Danh mục này hiện không có sản phẩm."
                    )
            ],
            components: [
                homeButton(
                    userId
                )
            ]
        });
    }

    const options =
        items
            .slice(
                0,
                25
            )
            .map(
                item => {
                    const price =
                        getPrice(
                            item
                        );

                    const bought =
                        category ===
                        "seeds"
                            ? getBoughtCount(
                                userId,
                                item.id
                            )
                            : 0;

                    let description;

                    if (
                        category ===
                        "seeds"
                    ) {
                        const remaining =
                            Math.max(
                                0,
                                SEED_PURCHASE_LIMIT -
                                bought
                            );

                        description =
                            `${price.toLocaleString()} Mora • Còn ${remaining}/${SEED_PURCHASE_LIMIT}`
                                .slice(
                                    0,
                                    100
                                );
                    } else {
                        description =
                            `${price.toLocaleString()} Mora`
                                .slice(
                                    0,
                                    100
                                );
                    }

                    return {
                        label:
                            String(
                                item.name
                            ).slice(
                                0,
                                100
                            ),

                        description,

                        value:
                            String(
                                item.id
                            ),

                        emoji:
                            safeEmoji(
                                item.emoji
                            )
                    };
                }
            );

    const rows = [
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `shop_item_${userId}`
                    )
                    .setPlaceholder(
                        "📦 Chọn sản phẩm..."
                    )
                    .addOptions(
                        options
                    )
            )
    ];

    // ═════════════════════════════
    // 🌱 SEED BUTTONS
    // ═════════════════════════════

    if (
        category ===
        "seeds"
    ) {
        rows.push(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `shop_refresh_${userId}`
                        )
                        .setLabel(
                            `Đổi shop • ${REFRESH_PRICE} Mora`
                        )
                        .setEmoji(
                            "🔄"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `shop_home_${userId}`
                        )
                        .setLabel(
                            "Trang chủ"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `shop_close_${userId}`
                        )
                        .setLabel(
                            "Đóng"
                        )
                        .setStyle(
                            ButtonStyle.Danger
                        )
                )
        );
    } else {
        rows.push(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `shop_home_${userId}`
                        )
                        .setLabel(
                            "Trang chủ"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `shop_close_${userId}`
                        )
                        .setLabel(
                            "Đóng"
                        )
                        .setStyle(
                            ButtonStyle.Danger
                        )
                )
        );
    }

    return interaction.update({
        embeds: [
            createCategoryEmbed(
                category,
                items,
                userId
            )
        ],
        components:
            rows
    });
}

// ═══════════════════════════════════════
// 📦 ITEM PAGE
// ═══════════════════════════════════════

async function showItem(
    interaction,
    category,
    itemId,
    userId
) {
    const items =
        getItems(
            category,
            userId
        );

    const item =
        items.find(
            x =>
                String(
                    x.id
                ) ===
                String(
                    itemId
                )
        );

    if (!item) {
        return interaction.reply({
            content:
                "🍃 Sản phẩm không còn bán.",
            ephemeral: true
        });
    }

    const price =
        getPrice(
            item
        );

    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user?.balance || 0
        );

    const bought =
        category === "seeds"
            ? getBoughtCount(
                userId,
                item.id
            )
            : 0;

    const remaining =
        category === "seeds"
            ? Math.max(
                0,
                SEED_PURCHASE_LIMIT -
                bought
            )
            : 0;

    const limitReached =
        category === "seeds" &&
        remaining <= 0;

    const canBuy =
        balance >= price &&
        !limitReached;

    const emoji =
        safeEmoji(
            item.emoji
        );

    // ═════════════════════════════
    // 🌱 SEED — GỌN
    // ═════════════════════════════

    if (
        category ===
        "seeds"
    ) {
        const embed =
            new EmbedBuilder()
                .setColor(
                    canBuy
                        ? "#a8d8a8"
                        : "#f2a7a7"
                )
                .setTitle(
                    `+ \`${emoji}\` ${item.name}`
                )
                .setDescription(
                    [
                        `+ \`💰\` **Giá:** ${price.toLocaleString()} Mora`,
                        `+ \`💳\` **Mora:** ${balance.toLocaleString()}`,
                        `+ \`🛒\` **Có thể mua:** ${remaining}/${SEED_PURCHASE_LIMIT}`
                    ].join("\n")
                )
                .setFooter({
                    text:
                        "🍃 Hạt giống Venti"
                });

        let buttonLabel =
            "Mua";

        let buttonEmoji =
            "🛒";

        if (
            limitReached
        ) {
            buttonLabel =
                "Đã đạt giới hạn";

            buttonEmoji =
                "🔒";
        } else if (
            balance < price
        ) {
            buttonLabel =
                "Không đủ Mora";

            buttonEmoji =
                "💸";
        }

        return interaction.update({
            embeds: [
                embed
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `shop_buy_${userId}`
                            )
                            .setLabel(
                                buttonLabel
                            )
                            .setEmoji(
                                buttonEmoji
                            )
                            .setStyle(
                                ButtonStyle.Success
                            )
                            .setDisabled(
                                !canBuy
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                `shop_back_${userId}`
                            )
                            .setLabel(
                                "Quay lại"
                            )
                            .setEmoji(
                                "↩️"
                            )
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    )
            ]
        });
    }

    // ═════════════════════════════
    // 🎣 ROD / 🟫 PLOT
    // ═════════════════════════════

    const lines = [
        `+ \`${emoji}\` **${item.name}**`,
        `+ \`💰\` **Giá:** ${price.toLocaleString()} Mora`,
        `+ \`💳\` **Mora:** ${balance.toLocaleString()} Mora`
    ];

    if (
        category ===
        "rods"
    ) {
        lines.push(
            `+ \`⭐\` Level ${item.rodLevel || 1}`,
            `+ \`🛡️\` Độ bền ${item.durability || item.maxDurability || 20}`
        );
    }

    if (
        category ===
        "plots"
    ) {
        lines.push(
            `+ \`🟫\` Ô đất #${item.id}`
        );
    }

    const embed =
        new EmbedBuilder()
            .setColor(
                canBuy
                    ? "#a8d8a8"
                    : "#f2a7a7"
            )
            .setTitle(
                `+ \`${emoji}\` ${item.name}`
            )
            .setDescription(
                lines.join("\n")
            );

    return interaction.update({
        embeds: [
            embed
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `shop_buy_${userId}`
                        )
                        .setLabel(
                            canBuy
                                ? "Mua"
                                : "Không đủ Mora"
                        )
                        .setEmoji(
                            canBuy
                                ? "🛒"
                                : "💸"
                        )
                        .setStyle(
                            ButtonStyle.Success
                        )
                        .setDisabled(
                            !canBuy
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `shop_back_${userId}`
                        )
                        .setLabel(
                            "Quay lại"
                        )
                        .setEmoji(
                            "↩️"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ]
    });
}

// ═══════════════════════════════════════
// 🛒 BUY
// ═══════════════════════════════════════

async function buyItem(
    interaction,
    category,
    itemId,
    userId
) {
    const items =
        getItems(
            category,
            userId
        );

    const item =
        items.find(
            x =>
                String(
                    x.id
                ) ===
                String(
                    itemId
                )
        );

    if (!item) {
        return interaction.reply({
            content:
                "🍃 Sản phẩm không còn bán.",
            ephemeral: true
        });
    }

    const price =
        getPrice(
            item
        );

    // ═════════════════════════════
    // 🌱 LIMIT 5
    // ═════════════════════════════

    if (
        category ===
        "seeds"
    ) {
        const bought =
            getBoughtCount(
                userId,
                item.id
            );

        if (
            bought >=
            SEED_PURCHASE_LIMIT
        ) {
            return interaction.reply({
                content:
                    `🔒 Bạn đã mua đủ **${SEED_PURCHASE_LIMIT}** lần loại hạt này.`,
                ephemeral: true
            });
        }
    }

    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user?.balance || 0
        );

    if (
        balance <
        price
    ) {
        return interaction.reply({
            content:
                "💸 Bạn không đủ Mora.",
            ephemeral: true
        });
    }

    // ═════════════════════════════
    // 🟫 PLOT
    // ═════════════════════════════

    if (
        category ===
        "plots"
    ) {
        return buyPlot(
            interaction,
            item,
            price,
            userId
        );
    }

    // ═════════════════════════════
    // 💰 REMOVE MONEY
    // ═════════════════════════════

    const removed =
        removeBalance(
            userId,
            price
        );

    if (!removed) {
        return interaction.reply({
            content:
                "💸 Không thể trừ Mora.",
            ephemeral: true
        });
    }

    try {
        addInventoryItem(
            userId,
            item.id,
            1
        );

        if (
            category ===
            "seeds"
        ) {
            increaseBoughtCount(
                userId,
                item.id
            );
        }
    } catch (error) {
        addBalance(
            userId,
            price
        );

        throw error;
    }

    const emoji =
        safeEmoji(
            item.emoji
        );

    const newBought =
        category === "seeds"
            ? getBoughtCount(
                userId,
                item.id
            )
            : 0;

    const remaining =
        category === "seeds"
            ? Math.max(
                0,
                SEED_PURCHASE_LIMIT -
                newBought
            )
            : 0;

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    "#a8d8a8"
                )
                .setTitle(
                    "+ `♡` Mua thành công"
                )
                .setDescription(
                    [
                        `+ \`${emoji}\` **${item.name} ×1**`,
                        `+ \`💰\` Đã trả: **${price.toLocaleString()} Mora**`,
                        category === "seeds"
                            ? `+ \`🛒\` Có thể mua thêm: **${remaining}/${SEED_PURCHASE_LIMIT}**`
                            : "",
                        "",
                        "+ `🎒` Đã thêm vào Inventory."
                    ]
                        .filter(Boolean)
                        .join("\n")
                )
        ],
        components: [
            homeButton(
                userId
            )
        ]
    });
}

// ═══════════════════════════════════════
// 🔄 REFRESH SHOP
// ═══════════════════════════════════════

async function refreshShop(
    interaction,
    userId
) {
    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user?.balance || 0
        );

    if (
        balance <
        REFRESH_PRICE
    ) {
        return interaction.reply({
            content:
                `💸 Bạn cần **${REFRESH_PRICE.toLocaleString()} Mora** để đổi shop.`,
            ephemeral: true
        });
    }

    const removed =
        removeBalance(
            userId,
            REFRESH_PRICE
        );

    if (!removed) {
        return interaction.reply({
            content:
                "💸 Không thể trừ Mora.",
            ephemeral: true
        });
    }

    // ═════════════════════════════
    // 🔄 RANDOM NGAY LẬP TỨC
    // ═════════════════════════════

    refreshSeedShop(
        userId
    );

    // Reset state bằng cách
    // hiển thị category mới ngay
    return showCategory(
        interaction,
        "seeds",
        userId
    );
}

// ═══════════════════════════════════════
// 🟫 BUY PLOT
// ═══════════════════════════════════════

async function buyPlot(
    interaction,
    item,
    price,
    userId
) {
    const farm =
        User.getFarm(
            userId
        );

    if (
        !farm ||
        !Array.isArray(
            farm.plots
        )
    ) {
        return interaction.reply({
            content:
                "🍃 Không tìm thấy trang trại.",
            ephemeral: true
        });
    }

    const plotId =
        Number(
            item.id
        );

    const existing =
        farm.plots.find(
            plot =>
                Number(
                    plot.id
                ) ===
                plotId
        );

    if (
        existing &&
        existing.unlocked
    ) {
        return interaction.reply({
            content:
                "🟫 Ô đất này đã được mở.",
            ephemeral: true
        });
    }

    const removed =
        removeBalance(
            userId,
            price
        );

    if (!removed) {
        return interaction.reply({
            content:
                "💸 Không thể trừ Mora.",
            ephemeral: true
        });
    }

    if (existing) {
        existing.unlocked =
            true;
    } else {
        farm.plots.push({
            id:
                plotId,

            unlocked:
                true,

            seed:
                null,

            plantedAt:
                null,

            readyAt:
                null
        });
    }

    User.updateFarm(
        userId,
        farm
    );

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    "#a8d8a8"
                )
                .setTitle(
                    "+ `🟫` Mở đất thành công"
                )
                .setDescription(
                    [
                        `+ \`🟫\` **Ô đất #${plotId}**`,
                        "+ Đã được mở khóa.",
                        "",
                        "+ `💰` Đã trả",
                        `> -${price.toLocaleString()} Mora`,
                        "",
                        "♡ Chúc bạn có một mùa vụ thật tốt."
                    ].join("\n")
                )
        ],
        components: [
            homeButton(
                userId
            )
        ]
    });
}

// ═══════════════════════════════════════
// 🎒 INVENTORY
// ═══════════════════════════════════════

function addInventoryItem(
    userId,
    itemId,
    amount
) {
    if (
        Item &&
        typeof Item.add ===
        "function"
    ) {
        return Item.add(
            userId,
            itemId,
            amount
        );
    }

    if (
        User &&
        typeof User.addItem ===
        "function"
    ) {
        return User.addItem(
            userId,
            itemId,
            amount
        );
    }

    const user =
        User.getOrCreate(
            userId
        );

    const inventory = {
        ...(user.inventory || {})
    };

    inventory[itemId] =
        Number(
            inventory[itemId] || 0
        ) + amount;

    if (
        typeof User.update ===
        "function"
    ) {
        User.update(
            userId,
            {
                inventory
            }
        );

        return;
    }

    if (
        typeof User.updateUser ===
        "function"
    ) {
        User.updateUser(
            userId,
            {
                inventory
            }
        );

        return;
    }

    throw new Error(
        "Không tìm thấy hàm thêm item vào inventory."
    );
}

// ═══════════════════════════════════════
// 💸 REMOVE BALANCE
// ═══════════════════════════════════════

function removeBalance(
    userId,
    amount
) {
    if (
        typeof User.removeBalance ===
        "function"
    ) {
        const result =
            User.removeBalance(
                userId,
                amount
            );

        return result !== false;
    }

    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user.balance || 0
        );

    if (
        balance <
        amount
    ) {
        return false;
    }

    const newBalance =
        balance -
        amount;

    if (
        typeof User.updateBalance ===
        "function"
    ) {
        User.updateBalance(
            userId,
            newBalance
        );

        return true;
    }

    if (
        typeof User.updateUser ===
        "function"
    ) {
        User.updateUser(
            userId,
            {
                balance:
                    newBalance
            }
        );

        return true;
    }

    user.balance =
        newBalance;

    return true;
}

// ═══════════════════════════════════════
// 💰 ADD BALANCE
// ═══════════════════════════════════════

function addBalance(
    userId,
    amount
) {
    if (
        typeof User.addBalance ===
        "function"
    ) {
        return User.addBalance(
            userId,
            amount
        );
    }

    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user.balance || 0
        );

    const newBalance =
        balance +
        amount;

    if (
        typeof User.updateBalance ===
        "function"
    ) {
        return User.updateBalance(
            userId,
            newBalance
        );
    }

    if (
        typeof User.updateUser ===
        "function"
    ) {
        return User.updateUser(
            userId,
            {
                balance:
                    newBalance
            }
        );
    }

    user.balance =
        newBalance;

    return true;
}

// ═══════════════════════════════════════
// 🏠 HOME BUTTON
// ═══════════════════════════════════════

function homeButton(
    userId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `shop_home_${userId}`
                )
                .setLabel(
                    "Trang chủ"
                )
                .setEmoji(
                    "🏠"
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

// ═══════════════════════════════════════
// 💰 PRICE
// ═══════════════════════════════════════

function getPrice(
    item
) {
    return Number(
        item.price ??
        item.buyPrice ??
        0
    );
}

// ═══════════════════════════════════════
// ⏳ TIME
// ═══════════════════════════════════════

function formatTime(
    ms
) {
    const seconds =
        Math.floor(
            Number(
                ms || 0
            ) / 1000
        );

    if (
        seconds <
        60
    ) {
        return `${seconds} giây`;
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remain =
        seconds %
        60;

    if (
        remain ===
        0
    ) {
        return `${minutes} phút`;
    }

    return `${minutes} phút ${remain} giây`;
}

// ═══════════════════════════════════════
// 💾 SAVE USER FIELD
// ═══════════════════════════════════════

function saveUserField(
    userId,
    field,
    value
) {
    if (
        typeof User.updateUser ===
        "function"
    ) {
        return User.updateUser(
            userId,
            {
                [field]:
                    value
            }
        );
    }

    if (
        typeof User.update ===
        "function"
    ) {
        return User.update(
            userId,
            {
                [field]:
                    value
            }
        );
    }

    const user =
        User.getOrCreate(
            userId
        );

    user[field] =
        value;

    return true;
}

// ═══════════════════════════════════════
// 🛒 PURCHASE COUNT
// ═══════════════════════════════════════

function getBoughtMap(
    userId
) {
    const user =
        User.getOrCreate(
            userId
        );

    return {
        ...(user.seedShopBought || {})
    };
}

function getBoughtCount(
    userId,
    itemId
) {
    const map =
        getBoughtMap(
            userId
        );

    return Number(
        map[itemId] || 0
    );
}

function increaseBoughtCount(
    userId,
    itemId
) {
    const map =
        getBoughtMap(
            userId
        );

    map[itemId] =
        Number(
            map[itemId] || 0
        ) + 1;

    saveUserField(
        userId,
        "seedShopBought",
        map
    );

    return map[itemId];
}

module.exports =
    command;

