
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
        description: "Mở khóa thêm một ô đất."
    },
    {
        id: 3,
        name: "Ô đất #3",
        emoji: "🟫",
        price: 3000,
        description: "Mở rộng trang trại."
    },
    {
        id: 4,
        name: "Ô đất #4",
        emoji: "🟫",
        price: 7500,
        description: "Thêm không gian trồng cây."
    },
    {
        id: 5,
        name: "Ô đất #5",
        emoji: "🟫",
        price: 15000,
        description: "Mở rộng trang trại."
    },
    {
        id: 6,
        name: "Ô đất #6",
        emoji: "🟫",
        price: 30000,
        description: "Ô đất cao cấp."
    },
    {
        id: 7,
        name: "Ô đất #7",
        emoji: "🟫",
        price: 60000,
        description: "Ô đất cuối cùng."
    }
];

// ═══════════════════════════════════════
// ⚙️ CONFIG
// ═══════════════════════════════════════

const SEED_SHOP_SIZE = 5;

// Shop tồn tại 15 phút
const SEED_SHOP_DURATION =
    15 * 60 * 1000;

// Đổi shop tốn 100 Mora
const REFRESH_PRICE = 100;

// Mỗi loại hạt tối đa 5 lần mua
const SEED_PURCHASE_LIMIT = 5;

// Mỗi lần mua nhận random 3 → 5
const MIN_SEED_AMOUNT = 3;
const MAX_SEED_AMOUNT = 5;

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
// 🎲 RANDOM NUMBER
// ═══════════════════════════════════════

function randomInt(
    min,
    max
) {
    return Math.floor(
        Math.random() *
            (max - min + 1)
    ) + min;
}

// ═══════════════════════════════════════
// 🌱 CREATE SEED SHOP
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
        .slice(
            0,
            SEED_SHOP_SIZE
        )
        .map(item => ({
            itemId: item.id
        }));
}

// ═══════════════════════════════════════
// 🌱 GET SEED SHOP
// ═══════════════════════════════════════

function getSeedShop(userId) {
    const user =
        User.getOrCreate(
            userId
        );

    const now =
        Date.now();

    const current =
        user.seedShop;

    /*
     * Nếu shop còn hạn:
     * → giữ nguyên 5 hạt
     *
     * Không random lại khi:
     * - mở Vshop
     * - chọn Hạt giống
     * - chọn item
     * - quay lại
     */

    if (
        current &&
        Array.isArray(
            current.items
        ) &&
        current.items.length > 0 &&
        Number(
            current.createdAt || 0
        ) +
            SEED_SHOP_DURATION >
            now
    ) {
        return current;
    }

    // Shop mới
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

function refreshSeedShop(
    userId
) {
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

function getRemainingShopTime(
    shop
) {
    const expires =
        Number(
            shop.createdAt || 0
        ) +
        SEED_SHOP_DURATION;

    return Math.max(
        0,
        expires - Date.now()
    );
}

// ═══════════════════════════════════════
// 🌱 CURRENT SEEDS
// ═══════════════════════════════════════

function getCurrentSeeds(
    userId
) {
    const shop =
        getSeedShop(
            userId
        );

    return shop.items
        .map(
            entry =>
                Item.get(
                    entry.itemId
                )
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

            // Tạo shop nếu user chưa có
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

function homeEmbed(
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

    return new EmbedBuilder()
        .setColor("#9ccfd8")
        .setTitle(
            "🛒 Venti Shop"
        )
        .setDescription(
            [
                "+ `🌱` **Hạt giống**",
                "> 5 hạt giống ngẫu nhiên riêng cho bạn.",

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

function categoryRow(
    userId
) {
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
                            "5 hạt giống random riêng cho bạn.",
                        value:
                            "seeds",
                        emoji:
                            "🌱"
                    },
                    {
                        label:
                            "Cần câu",
                        description:
                            "Mua cần câu để câu cá.",
                        value:
                            "rods",
                        emoji:
                            "🎣"
                    },
                    {
                        label:
                            "Đất trang trại",
                        description:
                            "Mở khóa thêm ô đất.",
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
                "> 5 hạt giống được chọn ngẫu nhiên.",
                `> ⏳ Đổi shop tự động sau: **${formatTime(remaining)}**`,
                `> 🔄 Đổi ngay: **${REFRESH_PRICE.toLocaleString()} Mora**`,
                `> 🛒 Mỗi loại tối đa **${SEED_PURCHASE_LIMIT} lần**`
            ].join("\n");
    }

    if (
        category ===
        "rods"
    ) {
        title =
            "+ `🎣` Cần câu";

        description =
            "> Những chiếc cần câu giúp bạn khám phá Windrise Lake.";
    }

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

        if (
            category ===
            "seeds"
        ) {
            const count =
                getBoughtCount(
                    userId,
                    item.id
                );

            lines.push(
                [
                    `+ \`${emoji}\` **${item.name}**`,
                    `> 💰 ${price.toLocaleString()} Mora`,
                    `> 🛒 Đã mua: **${count}/${SEED_PURCHASE_LIMIT}**`
                ].join("\n")
            );
        } else {
            lines.push(
                [
                    `+ \`${emoji}\` **${item.name}**`,
                    `> ${shortDescription(item.description)}`,
                    `> 💰 ${price.toLocaleString()} Mora`
                ].join("\n")
            );
        }
    }

    if (
        !lines.length
    ) {
        lines.push(
            "☁️ Hiện không có sản phẩm."
        );
    }

    return new EmbedBuilder()
        .setColor("#9ccfd8")
        .setTitle(title)
        .setDescription(
            [
                description,
                "",
                ...lines,
                "",
                "+ `💰` **Mora hiện có**",
                `> ${balance.toLocaleString()} Mora`
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
                        [
                            "> Danh mục này hiện không có sản phẩm.",
                            "",
                            "♡ Hãy kiểm tra lại Item.js."
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

                    let description =
                        `${price.toLocaleString()} Mora`;

                    if (
                        category ===
                        "seeds"
                    ) {
                        const bought =
                            getBoughtCount(
                                userId,
                                item.id
                            );

                        description =
                            `${price.toLocaleString()} Mora • ${bought}/${SEED_PURCHASE_LIMIT}`;
                    }

                    return {
                        label:
                            String(
                                item.name
                            ).slice(
                                0,
                                100
                            ),

                        description:
                            description.slice(
                                0,
                                100
                            ),

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

    // ═══════════════════════════════════
    // 🌱 SEED BUTTONS
    // ═══════════════════════════════════

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
                        .setEmoji(
                            "🏠"
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
                        .setEmoji(
                            "🏠"
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
                String(x.id) ===
                String(itemId)
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

    const limitReached =
        category === "seeds" &&
        bought >=
            SEED_PURCHASE_LIMIT;

    const canBuy =
        balance >= price &&
        !limitReached;

    const emoji =
        safeEmoji(
            item.emoji
        );

    const lines = [
        `+ \`${emoji}\` **${item.name}**`,
        `> ${shortDescription(item.description)}`,
        "",
        "+ `💰` **Giá**",
        `> ${price.toLocaleString()} Mora`,
        "",
        "+ `💳` **Mora của bạn**",
        `> ${balance.toLocaleString()} Mora`
    ];

    // ═══════════════════════════════════
    // 🌱 SEED
    // ═══════════════════════════════════

    if (
        category ===
        "seeds"
    ) {
        lines.push(
            "",
            "+ `🛒` **Giới hạn**",
            `> ${bought}/${SEED_PURCHASE_LIMIT} lần`,
            "",
            "+ `🎁` **Mỗi lần mua**",
            `> Nhận ngẫu nhiên **${MIN_SEED_AMOUNT}-${MAX_SEED_AMOUNT} hạt**`
        );

        if (
            item.growTime
        ) {
            lines.push(
                "",
                "+ `⏳` **Thời gian**",
                `> ${formatTime(item.growTime)}`
            );
        }
    }

    // ═══════════════════════════════════
    // 🎣 ROD
    // ═══════════════════════════════════

    if (
        category ===
        "rods"
    ) {
        lines.push(
            "",
            "+ `⭐` **Cấp cần**",
            `> Level ${item.rodLevel || 1}`,
            "",
            "+ `🛡️` **Độ bền**",
            `> ${item.durability || item.maxDurability || 20}`
        );
    }

    // ═══════════════════════════════════
    // 🟫 PLOT
    // ═══════════════════════════════════

    if (
        category ===
        "plots"
    ) {
        lines.push(
            "",
            "+ `🟫` **Ô đất**",
            `> Ô đất #${item.id}`
        );
    }

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

// ═══════════════════════════════════════
// 🛒 BUY ITEM
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
                String(x.id) ===
                String(itemId)
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

    // ═══════════════════════════════════
    // 🌱 SEED LIMIT
    // ═══════════════════════════════════

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
                    `🔒 Bạn đã mua đủ ${SEED_PURCHASE_LIMIT} lần loại hạt này.`,
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

    // ═══════════════════════════════════
    // 🟫 PLOT
    // ═══════════════════════════════════

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

    // ═══════════════════════════════════
    // 💰 REMOVE MONEY
    // ═══════════════════════════════════

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

    // ═══════════════════════════════════
    // 🎁 AMOUNT
    // ═══════════════════════════════════

    let amount = 1;

    if (
        category ===
        "seeds"
    ) {
        amount =
            randomInt(
                MIN_SEED_AMOUNT,
                MAX_SEED_AMOUNT
            );
    }

    try {
        addInventoryItem(
            userId,
            item.id,
            amount
        );

        // Tính theo số lần mua,
        // KHÔNG tính theo số hạt nhận được.
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

    const newCount =
        category === "seeds"
            ? getBoughtCount(
                userId,
                item.id
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
                        `+ \`${emoji}\` **${item.name} ×${amount}**`,
                        `> ${shortDescription(item.description)}`,
                        "",
                        "+ `💰` **Đã trả**",
                        `> ${price.toLocaleString()} Mora`,
                        "",
                        "+ `🎁` **Nhận được**",
                        `> **${amount} ${item.name}**`,
                        "",
                        "+ `🎒` **Inventory**",
                        "> Đã thêm vật phẩm vào túi đồ.",
                        "",
                        category === "seeds"
                            ? `+ \`🛒\` Đã mua: **${newCount}/${SEED_PURCHASE_LIMIT} lần**`
                            : ""
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

    refreshSeedShop(
        userId
    );

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
                        "> Đã được mở khóa cho trang trại.",
                        "",
                        "+ `💰` **Đã trả**",
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
// ✂️ SHORT DESCRIPTION
// ═══════════════════════════════════════

function shortDescription(
    description
) {
    if (!description) {
        return "Vật phẩm trong cửa hàng.";
    }

    const text =
        String(
            description
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    if (
        text.length <= 70
    ) {
        return text;
    }

    return (
        text.slice(
            0,
            67
        ) + "..."
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
        seconds < 60
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
        remain === 0
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
// 🛒 PURCHASE MAP
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

// ═══════════════════════════════════════
// 🔢 GET PURCHASE COUNT
// ═══════════════════════════════════════

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

// ═══════════════════════════════════════
// ➕ INCREASE PURCHASE COUNT
// ═══════════════════════════════════════

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

