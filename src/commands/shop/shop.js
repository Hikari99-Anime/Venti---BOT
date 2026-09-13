
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
// 🍃 COLUMBINA • SHOP
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
            "Một ô đất mới cho trang trại của bạn."
    },
    {
        id: 5,
        name: "Ô đất #5",
        emoji: "🟫",
        price: 15000,
        description:
            "Mở rộng trang trại với một ô đất mới."
    },
    {
        id: 6,
        name: "Ô đất #6",
        emoji: "🟫",
        price: 30000,
        description:
            "Một ô đất cao cấp để tiếp tục phát triển trang trại."
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
// 🌱 RANDOM SEED SHOP
// ═══════════════════════════════════════

const SEED_SHOP_DURATION =
    15 * 60 * 1000;

const SEED_SHOP_SIZE = 5;

const SEED_REFRESH_PRICE = 100;

// userId => {
//     items: [itemId...],
//     bought: {
//         itemId: number
//     },
//     createdAt: number
// }
const seedShops = new Map();

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
// 🎲 RANDOM
// ═══════════════════════════════════════

function randomArray(array) {
    return [...array]
        .sort(
            () => Math.random() - 0.5
        );
}

// ═══════════════════════════════════════
// 🌱 GET ALL SEEDS
// ═══════════════════════════════════════

function getAllSeeds() {
    return Item
        .getAll()
        .filter(
            item =>
                item.category ===
                "seed"
        );
}

// ═══════════════════════════════════════
// 🌱 CREATE USER SEED SHOP
// ═══════════════════════════════════════

function createSeedShop(userId) {
    const seeds =
        getAllSeeds();

    if (!seeds.length) {
        return null;
    }

    const selected =
        randomArray(seeds)
            .slice(
                0,
                Math.min(
                    SEED_SHOP_SIZE,
                    seeds.length
                )
            );

    const shop = {
        items: selected.map(
            item =>
                String(item.id)
        ),

        bought: {},

        createdAt:
            Date.now()
    };

    seedShops.set(
        String(userId),
        shop
    );

    return shop;
}

// ═══════════════════════════════════════
// 🌱 GET USER SEED SHOP
// ═══════════════════════════════════════

function getSeedShop(userId) {
    const key =
        String(userId);

    let shop =
        seedShops.get(key);

    if (!shop) {
        return createSeedShop(
            userId
        );
    }

    const expired =
        Date.now() -
            shop.createdAt >=
        SEED_SHOP_DURATION;

    if (expired) {
        return createSeedShop(
            userId
        );
    }

    return shop;
}

// ═══════════════════════════════════════
// 🌱 REFRESH USER SEED SHOP
// ═══════════════════════════════════════

function refreshSeedShop(userId) {
    return createSeedShop(
        userId
    );
}

// ═══════════════════════════════════════
// 🌱 GET RANDOM SEED ITEMS
// ═══════════════════════════════════════

function getSeedItems(userId) {
    const shop =
        getSeedShop(userId);

    if (!shop) {
        return [];
    }

    const allSeeds =
        getAllSeeds();

    return shop.items
        .map(
            id =>
                allSeeds.find(
                    item =>
                        String(
                            item.id
                        ) === String(id)
                )
        )
        .filter(Boolean);
}

// ═══════════════════════════════════════
// 🌱 BOUGHT COUNT
// ═══════════════════════════════════════

function getBoughtCount(
    userId,
    itemId
) {
    const shop =
        getSeedShop(userId);

    if (!shop) {
        return 0;
    }

    return Number(
        shop.bought[
            String(itemId)
        ] || 0
    );
}

// ═══════════════════════════════════════
// 🌱 MAX BUY
// ═══════════════════════════════════════

function canBuySeed(
    userId,
    itemId
) {
    return (
        getBoughtCount(
            userId,
            itemId
        ) < 10
    );
}

// ═══════════════════════════════════════
// 🌱 INCREASE BOUGHT COUNT
// ═══════════════════════════════════════

function increaseBoughtCount(
    userId,
    itemId,
    amount = 1
) {
    const shop =
        getSeedShop(userId);

    if (!shop) {
        return false;
    }

    const id =
        String(itemId);

    const current =
        Number(
            shop.bought[id] || 0
        );

    if (
        current + amount >
        10
    ) {
        return false;
    }

    shop.bought[id] =
        current + amount;

    return true;
}

// ═══════════════════════════════════════
// ⏳ REMAINING TIME
// ═══════════════════════════════════════

function getRemainingShopTime(
    userId
) {
    const shop =
        getSeedShop(userId);

    if (!shop) {
        return 0;
    }

    return Math.max(
        0,
        SEED_SHOP_DURATION -
            (Date.now() -
                shop.createdAt)
    );
}

// ═══════════════════════════════════════
// COMMAND
// ═══════════════════════════════════════

const command = {
    name: "shop",

    aliases: [
        "vshop"
    ],

    description:
        "🛒 Cửa hàng của Columbina.",

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

            // Tạo shop hạt ngay khi mở
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

                        // ═════════════════════
                        // CATEGORY
                        // ═════════════════════

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

                        // ═════════════════════
                        // ITEM
                        // ═════════════════════

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

                        // ═════════════════════
                        // BUY
                        // ═════════════════════

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

                        // ═════════════════════
                        // REFRESH SEED SHOP
                        // ═════════════════════

                        if (
                            id ===
                            `shop_refresh_${userId}`
                        ) {
                            return refreshShop(
                                interaction,
                                userId
                            );
                        }

                        // ═════════════════════
                        // HOME
                        // ═════════════════════

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

                        // ═════════════════════
                        // BACK
                        // ═════════════════════

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

                        // ═════════════════════
                        // CLOSE
                        // ═════════════════════

                        if (
                            id ===
                            `shop_close_${userId}`
                        ) {
                            collector.stop();

                            return interaction.update({
                                content:
                                    "🍃 Columbina đã đóng cửa hàng.",

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
                        "🍃 Không thể mở Columbina Shop."
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
            "🛒 Columbina Shop"
        )

        .setDescription(
            [
                "- `🌱` **Hạt giống**",
                "> Mỗi người chơi có 5 loại hạt riêng.",
                "> Shop hạt thay đổi sau mỗi 15 phút.",

                "",

                "- `🎣` **Cần câu**",
                "> Mua cần câu để câu cá.",

                "",

                "- `🟫` **Đất trang trại**",
                "> Mở khóa thêm ô đất.",

                "",

                "- `💰` **Mora**",
                `> ${balance.toLocaleString()} Mora`
            ].join("\n")
        )

        .setFooter({
            text:
                "♡ Chọn danh mục bên dưới để xem sản phẩm."
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
                            "5 hạt giống riêng của bạn.",

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
        // QUAN TRỌNG:
        // Không trả toàn bộ seed.
        // Chỉ trả đúng 5 seed
        // đã random cho user.
        return getSeedItems(
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
        "🛒 Columbina Shop";

    let description =
        "";

    if (
        category ===
        "seeds"
    ) {
        title =
            "● `🌱` Hạt giống";

        description =
            [
                "> Đây là 5 loại hạt giống",
                "> dành riêng cho bạn.",
                "> Shop thay đổi mỗi 15 phút."
            ].join("\n");
    }

    if (
        category ===
        "rods"
    ) {
        title =
            "● `🎣` Cần câu";

        description =
            "> Những chiếc cần câu giúp bạn khám phá Windrise Lake.";
    }

    if (
        category ===
        "plots"
    ) {
        title =
            "● `🟫` Đất trang trại";

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

        let extra =
            [];

        // ═════════════════════
        // SEED
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

            if (
                bought >= 10
            ) {
                extra.push(
                    "> 📦 Đã mua: **10/10**"
                );

                extra.push(
                    "> 🔒 **Đã đạt giới hạn**"
                );
            } else {
                extra.push(
                    `> 📦 Đã mua: **${bought}/10**`
                );
            }

            if (
                item.growTime
            ) {
                extra.push(
                    `> ⏳ Lớn trong: **${formatTime(item.growTime)}**`
                );
            }

            if (
                item.minHarvest ||
                item.maxHarvest
            ) {
                extra.push(
                    `> 🌾 Thu hoạch: **${item.minHarvest || 1} - ${item.maxHarvest || item.minHarvest || 1}**`
                );
            }
        }

        // ═════════════════════
        // ROD
        // ═════════════════════

        if (
            category ===
            "rods"
        ) {
            extra.push(
                `> ⭐ Cấp cần: **Level ${item.rodLevel || 1}**`
            );

            extra.push(
                `> 🛡️ Độ bền: **${item.durability || item.maxDurability || 20}**`
            );
        }

        // ═════════════════════
        // PLOT
        // ═════════════════════

        if (
            category ===
            "plots"
        ) {
            extra.push(
                `> 🟫 Ô đất: **#${item.id}**`
            );
        }

        lines.push(
            [
                `● \`${emoji}\` **${item.name}**`,
                `> ${item.description || "Một vật phẩm trong cửa hàng Venti."}`,
                `> 💰 Giá: **${price.toLocaleString()} Mora**`,
                ...extra
            ].join("\n")
        );

        lines.push("");
    }

    if (
        !lines.length
    ) {
        lines.push(
            "☁️ Hiện không còn sản phẩm nào trong danh mục này."
        );
    }

    const finalLines = [
        description,
        "",
        ...lines,
        `● \`💰\` **Mora hiện có**`,
        `> ${balance.toLocaleString()} Mora`
    ];

    if (
        category ===
        "seeds"
    ) {
        const remaining =
            getRemainingShopTime(
                userId
            );

        finalLines.push(
            "",
            `⏰ **Shop mới sau: ${formatDuration(remaining)}**`,
            "",
            "🔄 Có thể đổi shop ngay với **100 Mora**."
        );
    }

    finalLines.push(
        "",
        "♡ Chọn sản phẩm bên dưới để xem và mua."
    );

    return new EmbedBuilder()
        .setColor("#9ccfd8")

        .setTitle(
            title
        )

        .setDescription(
            finalLines.join("\n")
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
                        "● `🍃` Hết hàng"
                    )
                    .setDescription(
                        [
                            "> Danh mục này hiện không còn sản phẩm.",
                            "",
                            "♡ Hãy quay lại sau nhé."
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
            .slice(0, 25)
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
                            `${price.toLocaleString()} Mora • ${bought}/10`;
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

    const components = [];

    components.push(
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `shop_item_${userId}`
                    )
                    .setPlaceholder(
                        "📦 Chọn sản phẩm để xem..."
                    )
                    .addOptions(
                        options
                    )
            )
    );

    // Nút riêng cho shop hạt
    if (
        category ===
        "seeds"
    ) {
        components.push(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `shop_refresh_${userId}`
                        )
                        .setLabel(
                            "Đổi shop"
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
        components.push(
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

        components
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

    let canBuy =
        balance >= price;

    const emoji =
        safeEmoji(
            item.emoji
        );

    const lines = [
        `● \`${emoji}\` **${item.name}**`,
        `> ${item.description || "Một vật phẩm trong cửa hàng Venti."}`,
        "",
        "● `💰` **Giá**",
        `> ${price.toLocaleString()} Mora`,
        "",
        "● `💳` **Mora của bạn**",
        `> ${balance.toLocaleString()} Mora`
    ];

    // ═════════════════════
    // SEED
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

        lines.push(
            "",
            "● `📦` **Giới hạn mua**",
            `> ${bought}/10`
        );

        if (
            bought >= 10
        ) {
            canBuy =
                false;

            lines.push(
                "> 🔒 Bạn đã mua đủ 10 lần loại hạt này trong shop hiện tại."
            );
        }

        if (
            item.growTime
        ) {
            lines.push(
                "",
                "● `⏳` **Thời gian**",
                `> ${formatTime(item.growTime)}`
            );
        }

        if (
            item.minHarvest ||
            item.maxHarvest
        ) {
            lines.push(
                "",
                "● `🌾` **Thu hoạch**",
                `> ${item.minHarvest || 1} - ${item.maxHarvest || item.minHarvest || 1}`
            );
        }
    }

    // ═════════════════════
    // ROD
    // ═════════════════════

    if (
        category ===
        "rods"
    ) {
        lines.push(
            "",
            "● `⭐` **Cấp cần**",
            `> Level ${item.rodLevel || 1}`,

            "",
            "● `🛡️` **Độ bền**",
            `> ${item.durability || item.maxDurability || 20}`
        );
    }

    // ═════════════════════
    // PLOT
    // ═════════════════════

    if (
        category ===
        "plots"
    ) {
        lines.push(
            "",
            "● `🟫` **Ô đất**",
            `> Ô đất #${item.id}`
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
                `● \`${emoji}\` ${item.name}`
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
                                : category ===
                                  "seeds" &&
                                  getBoughtCount(
                                      userId,
                                      item.id
                                  ) >= 10
                                    ? "Đã đủ 10 lần"
                                    : "Không đủ Mora"
                        )
                        .setEmoji(
                            canBuy
                                ? "🛒"
                                : "🔒"
                        )
                        .setStyle(
                            canBuy
                                ? ButtonStyle.Success
                                : ButtonStyle.Secondary
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

    // ═════════════════════
    // SEED LIMIT
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

        if (
            bought >= 10
        ) {
            return interaction.reply({
                content:
                    "🔒 Bạn đã mua đủ 10 lần loại hạt này trong shop hiện tại.",
                ephemeral: true
            });
        }
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

    // ═════════════════════
    // PLOT
    // ═════════════════════

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

    // ═════════════════════
    // REMOVE MONEY
    // ═════════════════════

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

        // ═════════════════════
        // INCREASE SEED COUNT
        // ═════════════════════

        if (
            category ===
            "seeds"
        ) {
            const increased =
                increaseBoughtCount(
                    userId,
                    item.id,
                    1
                );

            if (!increased) {
                // Hoàn tiền nếu count lỗi
                addBalance(
                    userId,
                    price
                );

                return interaction.reply({
                    content:
                        "🍃 Không thể cập nhật giới hạn mua.",
                    ephemeral: true
                });
            }
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
        category ===
        "seeds"
            ? getBoughtCount(
                  userId,
                  item.id
              )
            : null;

    const description = [
        `● \`${emoji}\` **${item.name} ×1**`,
        `> ${item.description || "Vật phẩm đã được thêm vào túi đồ."}`,
        "",
        "● `💰` **Đã trả**",
        `> ${price.toLocaleString()} Mora`
    ];

    if (
        category ===
        "seeds"
    ) {
        description.push(
            "",
            "● `📦` **Đã mua trong shop**",
            `> ${newBought}/10`
        );

        if (
            newBought >= 10
        ) {
            description.push(
                "> 🔒 Đã đạt giới hạn 10 lần."
            );
        }
    }

    description.push(
        "",
        "● `🎒` **Inventory**",
        "> Đã thêm vật phẩm vào túi đồ."
    );

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    "#a8d8a8"
                )
                .setTitle(
                    "● `♡` Mua thành công"
                )
                .setDescription(
                    description.join(
                        "\n"
                    )
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
                    "● `🟫` Mở đất thành công"
                )
                .setDescription(
                    [
                        `● \`🟫\` **Ô đất #${plotId}**`,
                        "> Đã được mở khóa cho trang trại.",
                        "",
                        "● `💰` **Đã trả**",
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
        SEED_REFRESH_PRICE
    ) {
        return interaction.reply({
            content:
                `💸 Bạn cần **${SEED_REFRESH_PRICE} Mora** để đổi shop.`,
            ephemeral: true
        });
    }

    const removed =
        removeBalance(
            userId,
            SEED_REFRESH_PRICE
        );

    if (!removed) {
        return interaction.reply({
            content:
                "💸 Không thể trừ Mora.",
            ephemeral: true
        });
    }

    const oldShop =
        getSeedShop(
            userId
        );

    const oldIds =
        oldShop?.items || [];

    let newShop =
        refreshSeedShop(
            userId
        );

    // Cố gắng tránh trường hợp
    // random ra đúng nguyên bộ cũ
    if (
        newShop &&
        newShop.items.length > 1 &&
        arraysEqual(
            newShop.items,
            oldIds
        )
    ) {
        newShop =
            refreshSeedShop(
                userId
            );
    }

    return interaction.update({
        embeds: [
            createCategoryEmbed(
                "seeds",
                getSeedItems(
                    userId
                ),
                userId
            )
        ],

        components: [
            seedShopComponents(
                userId
            )
        ]
    });
}

// ═══════════════════════════════════════
// 🌱 SEED COMPONENTS
// ═══════════════════════════════════════

function seedShopComponents(
    userId
) {
    const items =
        getSeedItems(
            userId
        );

    const options =
        items
            .slice(0, 25)
            .map(
                item => {
                    const price =
                        getPrice(
                            item
                        );

                    const bought =
                        getBoughtCount(
                            userId,
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
                            `${price.toLocaleString()} Mora • ${bought}/10`
                                .slice(
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

    return [
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `shop_item_${userId}`
                    )
                    .setPlaceholder(
                        "🌱 Chọn hạt giống..."
                    )
                    .addOptions(
                        options
                    )
            ),

        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `shop_refresh_${userId}`
                    )
                    .setLabel(
                        "Đổi shop"
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
    ];
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
// ⏰ FORMAT DURATION
// ═══════════════════════════════════════

function formatDuration(
    ms
) {
    const totalSeconds =
        Math.max(
            0,
            Math.floor(
                Number(ms || 0) /
                    1000
            )
        );

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds %
        60;

    return `${minutes} phút ${String(
        seconds
    ).padStart(
        2,
        "0"
    )} giây`;
}

// ═══════════════════════════════════════
// 🔍 ARRAY EQUAL
// ═══════════════════════════════════════

function arraysEqual(
    a,
    b
) {
    if (
        !Array.isArray(a) ||
        !Array.isArray(b)
    ) {
        return false;
    }

    if (
        a.length !==
        b.length
    ) {
        return false;
    }

    const x =
        [...a]
            .map(String)
            .sort();

    const y =
        [...b]
            .map(String)
            .sort();

    return x.every(
        (value, index) =>
            value ===
            y[index]
    );
}

module.exports = command;

