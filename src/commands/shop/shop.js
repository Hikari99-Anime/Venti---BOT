
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

const SHOP_REFRESH = 15 * 60 * 1000;

// 💎 Đổi shop
const REROLL_PRICE = 100;

// 🌱 Số hạt giống xuất hiện
const SEED_SHOP_SIZE = 5;

// 🌱 Tối đa mua 1 loại trong mỗi shop
const MAX_BUY_PER_ITEM = 10;

// ═══════════════════════════════════════
// 🟫 PLOTS
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
// 💰 BALANCE
// ═══════════════════════════════════════

function getBalance(userId) {
    const user =
        User.getOrCreate(userId);

    return Number(
        user?.balance || 0
    );
}

function getXu(userId) {
    const user =
        User.getOrCreate(userId);

    return Number(
        user?.xu ??
        user?.coins ??
        user?.coin ??
        0
    );
}

function removeBalance(
    userId,
    amount
) {
    if (
        typeof User.removeBalance ===
        "function"
    ) {
        return (
            User.removeBalance(
                userId,
                amount
            ) !== false
        );
    }

    const user =
        User.getOrCreate(userId);

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
        balance - amount;

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

    if (
        typeof User.update ===
        "function"
    ) {
        User.update(
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
        User.getOrCreate(userId);

    const balance =
        Number(
            user.balance || 0
        );

    const newBalance =
        balance + amount;

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

    if (
        typeof User.update ===
        "function"
    ) {
        return User.update(
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
// 💎 XU
// ═══════════════════════════════════════

function removeXu(
    userId,
    amount
) {
    const user =
        User.getOrCreate(userId);

    const xu =
        getXu(userId);

    if (
        xu <
        amount
    ) {
        return false;
    }

    const newXu =
        xu - amount;

    const data = {};

    if (
        user.xu !== undefined
    ) {
        data.xu = newXu;
    } else if (
        user.coins !== undefined
    ) {
        data.coins = newXu;
    } else if (
        user.coin !== undefined
    ) {
        data.coin = newXu;
    } else {
        data.xu = newXu;
    }

    if (
        typeof User.update ===
        "function"
    ) {
        User.update(
            userId,
            data
        );

        return true;
    }

    if (
        typeof User.updateUser ===
        "function"
    ) {
        User.updateUser(
            userId,
            data
        );

        return true;
    }

    Object.assign(
        user,
        data
    );

    return true;
}

// ═══════════════════════════════════════
// 🎲 RANDOM
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

function shuffle(array) {
    return [...array]
        .sort(
            () =>
                Math.random() -
                0.5
        );
}

// ═══════════════════════════════════════
// 🌱 SHOP DATA
// ═══════════════════════════════════════
//
// Quan trọng:
// Shop được lưu vào User để:
// - Chọn item không random lại
// - Mua item không random lại
// - Đóng Vshop rồi mở lại vẫn giữ shop
//
// ═══════════════════════════════════════

function getShopData(userId) {
    const user =
        User.getOrCreate(userId);

    if (
        !user.shop ||
        typeof user.shop !== "object"
    ) {
        user.shop = {};
    }

    if (
        !Array.isArray(
            user.shop.seeds
        )
    ) {
        user.shop.seeds = [];
    }

    if (
        !user.shop.seedBuys ||
        typeof user.shop.seedBuys !== "object"
    ) {
        user.shop.seedBuys = {};
    }

    return user.shop;
}

// ═══════════════════════════════════════
// 🌱 CREATE RANDOM SEEDS
// ═══════════════════════════════════════

function generateSeedShop(
    userId
) {
    const user =
        User.getOrCreate(userId);

    const allSeeds =
        Item
            .getAll()
            .filter(
                item =>
                    item.category ===
                    "seed"
            );

    const selected =
        shuffle(
            allSeeds
        )
            .slice(
                0,
                Math.min(
                    SEED_SHOP_SIZE,
                    allSeeds.length
                )
            )
            .map(
                item =>
                    String(
                        item.id
                    )
            );

    const now =
        Date.now();

    const shop = {
        ...(user.shop || {})
    };

    shop.seeds =
        selected;

    shop.seedBuys = {};

    shop.seedUpdatedAt =
        now;

    shop.seedExpiresAt =
        now +
        SHOP_REFRESH;

    saveShop(
        userId,
        shop
    );

    return shop;
}

// ═══════════════════════════════════════
// 💾 SAVE SHOP
// ═══════════════════════════════════════

function saveShop(
    userId,
    shop
) {
    if (
        typeof User.update ===
        "function"
    ) {
        User.update(
            userId,
            {
                shop
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
                shop
            }
        );

        return;
    }

    const user =
        User.getOrCreate(
            userId
        );

    user.shop =
        shop;
}

// ═══════════════════════════════════════
// 🌱 GET ACTIVE SEED SHOP
// ═══════════════════════════════════════

function getSeedShop(
    userId
) {
    const shop =
        getShopData(
            userId
        );

    const now =
        Date.now();

    const valid =
        Array.isArray(
            shop.seeds
        ) &&
        shop.seeds.length > 0 &&
        Number(
            shop.seedExpiresAt || 0
        ) > now;

    if (!valid) {
        return generateSeedShop(
            userId
        );
    }

    return shop;
}

// ═══════════════════════════════════════
// ⏳ SHOP TIME
// ═══════════════════════════════════════

function formatTime(
    ms
) {
    const seconds =
        Math.max(
            0,
            Math.floor(
                Number(
                    ms || 0
                ) / 1000
            )
        );

    if (
        seconds <
        60
    ) {
        return `${seconds} giây`;
    }

    const minutes =
        Math.floor(
            seconds /
            60
        );

    const remain =
        seconds %
        60;

    if (!remain) {
        return `${minutes} phút`;
    }

    return `${minutes} phút ${remain} giây`;
}

// ═══════════════════════════════════════
// 📦 GET ITEMS
// ═══════════════════════════════════════

function getItems(
    category,
    userId
) {
    // 🌱 SEEDS
    if (
        category ===
        "seeds"
    ) {
        const shop =
            getSeedShop(
                userId
            );

        const ids =
            shop.seeds || [];

        return ids
            .map(
                id =>
                    Item.get(id)
            )
            .filter(Boolean);
    }

    // 🎣 RODS
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

    // 🟫 PLOTS
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
// 🛒 SEED BUY COUNT
// ═══════════════════════════════════════

function getSeedBuyCount(
    userId,
    itemId
) {
    const shop =
        getSeedShop(
            userId
        );

    return Number(
        shop.seedBuys?.[
            itemId
        ] || 0
    );
}

function increaseSeedBuyCount(
    userId,
    itemId
) {
    const shop =
        getSeedShop(
            userId
        );

    if (
        !shop.seedBuys
    ) {
        shop.seedBuys = {};
    }

    shop.seedBuys[itemId] =
        Number(
            shop.seedBuys[itemId] ||
            0
        ) + 1;

    saveShop(
        userId,
        shop
    );
}

// ═══════════════════════════════════════
// 🏠 HOME EMBED
// ═══════════════════════════════════════

function homeEmbed(
    userId
) {
    const balance =
        getBalance(
            userId
        );

    const xu =
        getXu(
            userId
        );

    const shop =
        getSeedShop(
            userId
        );

    const remain =
        Number(
            shop.seedExpiresAt || 0
        ) -
        Date.now();

    return new EmbedBuilder()
        .setColor(
            "#9ccfd8"
        )

        .setTitle(
            "🛒 Venti Shop"
        )

        .setDescription(
            [
                "- `🌱` **Hạt giống**",
                "> Mỗi người sẽ có 5 loại hạt giống ngẫu nhiên.",
                "> Shop giữ nguyên trong 15 phút.",
                "> Mỗi loại chỉ mua tối đa 10 lần.",

                "",

                "- `🎣` **Cần câu**",
                "> Mua cần câu để câu cá.",

                "",

                "- `🟫` **Đất trang trại**",
                "> Mở khóa thêm ô đất.",

                "",

                "- `💰` **Mora**",
                `> ${balance.toLocaleString()} Mora`,

                "",

                "- `💎` **Xu**",
                `> ${xu.toLocaleString()} Xu`,

                "",

                "- `🔄` **Shop hạt giống**",
                `> Làm mới sau: **${formatTime(
                    remain
                )}**`,
                `> Đổi ngay: **${REROLL_PRICE} Xu**`
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
                            "5 hạt ngẫu nhiên riêng cho bạn.",

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
// 📋 CATEGORY EMBED
// ═══════════════════════════════════════

function createCategoryEmbed(
    category,
    items,
    userId
) {
    const balance =
        getBalance(
            userId
        );

    const xu =
        getXu(
            userId
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

        const remain =
            Number(
                shop.seedExpiresAt ||
                0
            ) -
            Date.now();

        title =
            "● `🌱` Hạt giống";

        description =
            [
                "> Hạt giống được chọn ngẫu nhiên riêng cho bạn.",
                `> Shop đổi sau **${formatTime(
                    remain
                )}**.`,
                `> 🔄 Đổi ngay: **${REROLL_PRICE} Xu**`
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

        let buyInfo =
            "";

        if (
            category ===
            "seeds"
        ) {
            const bought =
                getSeedBuyCount(
                    userId,
                    item.id
                );

            buyInfo =
                `> 🛒 Đã mua: **${bought}/${MAX_BUY_PER_ITEM}**`;
        }

        lines.push(
            [
                `● \`${emoji}\` **${item.name}**`,
                `> ${item.description || "Một vật phẩm trong cửa hàng Venti."}`,
                `> 💰 Giá: **${price.toLocaleString()} Mora**`,
                buyInfo
            ]
                .filter(Boolean)
                .join("\n")
        );

        if (
            category ===
            "seeds"
        ) {
            if (
                item.growTime
            ) {
                lines.push(
                    `> ⏳ Lớn trong: **${formatTime(
                        item.growTime
                    )}**`
                );
            }

            if (
                item.minHarvest ||
                item.maxHarvest
            ) {
                lines.push(
                    `> 🌾 Thu hoạch: **${
                        item.minHarvest || 1
                    } - ${
                        item.maxHarvest ||
                        item.minHarvest ||
                        1
                    }**`
                );
            }
        }

        if (
            category ===
            "rods"
        ) {
            lines.push(
                `> ⭐ Cấp cần: **Level ${
                    item.rodLevel || 1
                }**`
            );

            lines.push(
                `> 🛡️ Độ bền: **${
                    item.durability ||
                    item.maxDurability ||
                    20
                }**`
            );
        }

        if (
            category ===
            "plots"
        ) {
            lines.push(
                `> 🟫 Ô đất: **#${item.id}**`
            );
        }

        lines.push("");
    }

    if (
        !lines.length
    ) {
        lines.push(
            "☁️ Hiện không còn sản phẩm nào trong danh mục này."
        );
    }

    return new EmbedBuilder()
        .setColor(
            "#9ccfd8"
        )

        .setTitle(
            title
        )

        .setDescription(
            [
                description,
                "",
                ...lines,
                `● \`💰\` **Mora hiện có**`,
                `> ${balance.toLocaleString()} Mora`,
                "",
                `● \`💎\` **Xu hiện có**`,
                `> ${xu.toLocaleString()} Xu`,
                "",
                "♡ Chọn sản phẩm bên dưới để xem và mua."
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
                            getSeedBuyCount(
                                userId,
                                item.id
                            );

                        description =
                            `${price.toLocaleString()} Mora • ${bought}/${MAX_BUY_PER_ITEM}`;
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

    // 🌱 Nút đổi shop chỉ dành cho hạt
    if (
        category ===
        "seeds"
    ) {
        rows.push(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `shop_reroll_${userId}`
                        )
                        .setLabel(
                            `Đổi shop • ${REROLL_PRICE} Xu`
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

    const balance =
        getBalance(
            userId
        );

    const canBuy =
        balance >=
        price;

    const emoji =
        safeEmoji(
            item.emoji
        );

    const lines = [
        `● \`${emoji}\` **${item.name}**`,
        `> ${
            item.description ||
            "Một vật phẩm trong cửa hàng Venti."
        }`,

        "",

        "● `💰` **Giá**",
        `> ${price.toLocaleString()} Mora`,

        "",

        "● `💳` **Mora của bạn**",
        `> ${balance.toLocaleString()} Mora`
    ];

    if (
        category ===
        "seeds"
    ) {
        const bought =
            getSeedBuyCount(
                userId,
                item.id
            );

        const remaining =
            Math.max(
                0,
                MAX_BUY_PER_ITEM -
                bought
            );

        lines.push(
            "",
            "● `🛒` **Giới hạn mua**",
            `> Đã mua: **${bought}/${MAX_BUY_PER_ITEM}**`,
            `> Còn có thể mua: **${remaining}**`
        );

        if (
            item.growTime
        ) {
            lines.push(
                "",
                "● `⏳` **Thời gian**",
                `> ${formatTime(
                    item.growTime
                )}`
            );
        }

        if (
            item.minHarvest ||
            item.maxHarvest
        ) {
            lines.push(
                "",
                "● `🌾` **Thu hoạch**",
                `> ${
                    item.minHarvest || 1
                } - ${
                    item.maxHarvest ||
                    item.minHarvest ||
                    1
                }`
            );
        }
    }

    if (
        category ===
        "rods"
    ) {
        lines.push(
            "",
            "● `⭐` **Cấp cần**",
            `> Level ${
                item.rodLevel || 1
            }`,

            "",

            "● `🛡️` **Độ bền**",
            `> ${
                item.durability ||
                item.maxDurability ||
                20
            }`
        );
    }

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

    const seedLimitReached =
        category ===
        "seeds" &&
        getSeedBuyCount(
            userId,
            item.id
        ) >=
        MAX_BUY_PER_ITEM;

    const disabled =
        !canBuy ||
        seedLimitReached;

    let buyLabel =
        "Mua";

    let buyEmoji =
        "🛒";

    if (
        seedLimitReached
    ) {
        buyLabel =
            "Đã đạt giới hạn";

        buyEmoji =
            "🚫";
    } else if (
        !canBuy
    ) {
        buyLabel =
            "Không đủ Mora";

        buyEmoji =
            "💸";
    }

    const embed =
        new EmbedBuilder()
            .setColor(
                disabled
                    ? "#f2a7a7"
                    : "#a8d8a8"
            )
            .setTitle(
                `● \`${emoji}\` ${item.name}`
            )
            .setDescription(
                lines.join(
                    "\n"
                )
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
                            buyLabel
                        )
                        .setEmoji(
                            buyEmoji
                        )
                        .setStyle(
                            ButtonStyle.Success
                        )
                        .setDisabled(
                            disabled
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
    // 🔒 Luôn lấy lại shop hiện tại
    // Không random ở đây
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

    // 🌱 LIMIT
    if (
        category ===
        "seeds"
    ) {
        const bought =
            getSeedBuyCount(
                userId,
                item.id
            );

        if (
            bought >=
            MAX_BUY_PER_ITEM
        ) {
            return interaction.reply({
                content:
                    `🚫 Bạn đã mua đủ **${MAX_BUY_PER_ITEM} lần** hạt giống này trong shop hiện tại.`,
                ephemeral: true
            });
        }
    }

    const price =
        getPrice(
            item
        );

    const balance =
        getBalance(
            userId
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

    // 🟫 PLOT
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

        // 🌱 Tăng lượt mua
        if (
            category ===
            "seeds"
        ) {
            increaseSeedBuyCount(
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

    let extra = "";

    if (
        category ===
        "seeds"
    ) {
        const bought =
            getSeedBuyCount(
                userId,
                item.id
            );

        extra =
            [
                "",
                "● `🛒` **Giới hạn**",
                `> Đã mua: **${bought}/${MAX_BUY_PER_ITEM}**`
            ].join("\n");
    }

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
                    [
                        `● \`${emoji}\` **${item.name} ×1**`,
                        `> ${
                            item.description ||
                            "Vật phẩm đã được thêm vào túi đồ."
                        }`,

                        "",

                        "● `💰` **Đã trả**",
                        `> ${price.toLocaleString()} Mora`,

                        extra,

                        "",

                        "● `🎒` **Inventory**",
                        "> Đã thêm vật phẩm vào túi đồ."
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
// 🔄 REROLL SHOP
// ═══════════════════════════════════════

async function rerollShop(
    interaction,
    userId
) {
    const xu =
        getXu(
            userId
        );

    if (
        xu <
        REROLL_PRICE
    ) {
        return interaction.reply({
            content:
                `💎 Bạn cần **${REROLL_PRICE} Xu** để đổi shop.\n> Xu hiện có: **${xu.toLocaleString()}**`,
            ephemeral: true
        });
    }

    const removed =
        removeXu(
            userId,
            REROLL_PRICE
        );

    if (!removed) {
        return interaction.reply({
            content:
                "💎 Không thể trừ Xu.",
            ephemeral: true
        });
    }

    generateSeedShop(
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
            inventory[itemId] ||
            0
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
// COMMAND
// ═══════════════════════════════════════

const command = {
    name:
        "shop",

    aliases: [
        "vshop"
    ],

    description:
        "🛒 Cửa hàng của Venti.",

    usage:
        "Vshop",

    category:
        "economy",

    async execute(
        message
    ) {
        try {
            const userId =
                message.author.id;

            User.getOrCreate(
                userId
            );

            // Khởi tạo shop nếu chưa có
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
                    time:
                        120000
                });

            const state = {
                category:
                    null,

                itemId:
                    null
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
                            ephemeral:
                                true
                        });
                    }

                    try {
                        const id =
                            interaction.customId;

                        // 📂 CATEGORY
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

                        // 📦 ITEM
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

                        // 🛒 BUY
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

                        // 🔄 REROLL
                        if (
                            id ===
                            `shop_reroll_${userId}`
                        ) {
                            state.category =
                                "seeds";

                            state.itemId =
                                null;

                            return rerollShop(
                                interaction,
                                userId
                            );
                        }

                        // 🏠 HOME
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

                        // ↩️ BACK
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

                        // ❌ CLOSE
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
                                    ephemeral:
                                        true
                                })
                                .catch(
                                    () => {}
                                );
                        }

                        return interaction
                            .reply({
                                content:
                                    "🍃 Có lỗi xảy ra trong shop.",
                                ephemeral:
                                    true
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

module.exports =
    command;
