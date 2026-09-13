
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

const COLORS = {
    primary: "#9ccfd8",
    success: "#a8d8a8",
    warning: "#ffd166",
    error: "#f2a7a7"
};

const SEED_SHOP_SIZE = 5;
const SEED_SHOP_INTERVAL = 15 * 60 * 1000;
const REFRESH_COST = 100;
const MAX_BUY_PER_SEED = 10;

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
// 👤 USER
// ═══════════════════════════════════════

function ensureUser(userId) {
    return User.getOrCreate(userId);
}

// ═══════════════════════════════════════
// 🌱 SEED SHOP DATA
// ═══════════════════════════════════════

function getSeedShopData(userId) {
    const user =
        ensureUser(userId);

    /*
     * Dữ liệu lưu trong user:
     *
     * user.seedShop = {
     *     startedAt: timestamp,
     *     items: ["seed_1", ...],
     *     bought: {
     *         seed_1: 3
     *     }
     * }
     */

    let shop =
        user.seedShop;

    if (
        !shop ||
        typeof shop !== "object"
    ) {
        shop = createSeedShop();
        saveSeedShop(
            userId,
            shop
        );
        return shop;
    }

    const startedAt =
        Number(
            shop.startedAt || 0
        );

    const expired =
        !startedAt ||
        Date.now() -
            startedAt >=
            SEED_SHOP_INTERVAL;

    if (expired) {
        shop =
            createSeedShop();

        saveSeedShop(
            userId,
            shop
        );
    }

    return shop;
}

// ═══════════════════════════════════════
// 🎲 RANDOM SEED SHOP
// ═══════════════════════════════════════

function createSeedShop() {
    const seeds =
        Item
            .getAll()
            .filter(
                item =>
                    item.category ===
                    "seed"
            );

    const shuffled =
        [...seeds];

    for (
        let i =
            shuffled.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            shuffled[i],
            shuffled[j]
        ] = [
            shuffled[j],
            shuffled[i]
        ];
    }

    const selected =
        shuffled
            .slice(
                0,
                SEED_SHOP_SIZE
            )
            .map(
                item =>
                    String(
                        item.id
                    )
            );

    const bought = {};

    for (
        const itemId of selected
    ) {
        bought[itemId] = 0;
    }

    return {
        startedAt:
            Date.now(),

        items:
            selected,

        bought
    };
}

// ═══════════════════════════════════════
// 💾 SAVE SHOP
// ═══════════════════════════════════════

function saveSeedShop(
    userId,
    shop
) {
    if (
        typeof User.update ===
        "function"
    ) {
        return User.update(
            userId,
            {
                seedShop:
                    shop
            }
        );
    }

    if (
        typeof User.updateUser ===
        "function"
    ) {
        return User.updateUser(
            userId,
            {
                seedShop:
                    shop
            }
        );
    }

    const user =
        User.getOrCreate(
            userId
        );

    user.seedShop =
        shop;

    return true;
}

// ═══════════════════════════════════════
// 🌱 GET RANDOM SEEDS
// ═══════════════════════════════════════

function getRandomSeeds(
    userId
) {
    const shop =
        getSeedShopData(
            userId
        );

    return shop.items
        .map(
            id =>
                Item.get(id)
        )
        .filter(Boolean);
}

// ═══════════════════════════════════════
// 🔄 REFRESH TIMER
// ═══════════════════════════════════════

function getSeedShopRemaining(
    userId
) {
    const shop =
        getSeedShopData(
            userId
        );

    const remaining =
        Number(
            shop.startedAt || 0
        ) +
        SEED_SHOP_INTERVAL -
        Date.now();

    return Math.max(
        0,
        remaining
    );
}

// ═══════════════════════════════════════
// 🛒 BUY COUNT
// ═══════════════════════════════════════

function getBoughtCount(
    userId,
    itemId
) {
    const shop =
        getSeedShopData(
            userId
        );

    return Number(
        shop.bought?.[itemId] ||
        0
    );
}

// ═══════════════════════════════════════
// ➕ BUY COUNT
// ═══════════════════════════════════════

function increaseBoughtCount(
    userId,
    itemId
) {
    const shop =
        getSeedShopData(
            userId
        );

    if (
        !shop.bought ||
        typeof shop.bought !==
        "object"
    ) {
        shop.bought = {};
    }

    shop.bought[itemId] =
        Number(
            shop.bought[itemId] ||
            0
        ) + 1;

    saveSeedShop(
        userId,
        shop
    );

    return shop.bought[itemId];
}

// ═══════════════════════════════════════
// 🔄 FORCE REFRESH
// ═══════════════════════════════════════

function refreshSeedShop(
    userId
) {
    const shop =
        createSeedShop();

    saveSeedShop(
        userId,
        shop
    );

    return shop;
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
        return getRandomSeeds(
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
// 💰 BALANCE
// ═══════════════════════════════════════

function getBalance(
    userId
) {
    const user =
        User.getOrCreate(
            userId
        );

    return Number(
        user?.balance || 0
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
// 🪙 XU
// ═══════════════════════════════════════

function getXu(
    userId
) {
    const user =
        User.getOrCreate(
            userId
        );

    return Number(
        user?.xu ||
        user?.coins ||
        user?.tokens ||
        0
    );
}

function removeXu(
    userId,
    amount
) {
    const user =
        User.getOrCreate(
            userId
        );

    const field =
        user.xu !== undefined
            ? "xu"
            : user.coins !== undefined
                ? "coins"
                : "tokens";

    const current =
        Number(
            user[field] || 0
        );

    if (
        current <
        amount
    ) {
        return false;
    }

    const value =
        current -
        amount;

    if (
        typeof User.update ===
        "function"
    ) {
        User.update(
            userId,
            {
                [field]:
                    value
            }
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
                [field]:
                    value
            }
        );

        return true;
    }

    user[field] =
        value;

    return true;
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
        "Không tìm thấy hàm thêm item."
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
                    COLORS.success
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
// 🏠 HOME
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

    return new EmbedBuilder()
        .setColor(
            COLORS.primary
        )
        .setTitle(
            "🛒 Venti Shop"
        )
        .setDescription(
            [
                "- `🌱` **Hạt giống**",
                "> Mỗi người chơi có 5 hạt giống ngẫu nhiên.",
                "> Shop hạt giống thay đổi mỗi 15 phút.",

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

                "- `🪙` **Xu**",
                `> ${xu.toLocaleString()} Xu`
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
                            "5 loại hạt giống ngẫu nhiên.",
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

    const lines = [];

    if (
        category ===
        "seeds"
    ) {
        const remaining =
            getSeedShopRemaining(
                userId
            );

        lines.push(
            "`🌱` **Hạt giống hôm nay**",
            "> Danh sách riêng của bạn.",
            `> 🔄 Đổi lượt sau: **${formatTime(remaining)}**`,
            ""
        );

        for (
            const item of items
        ) {
            const emoji =
                safeEmoji(
                    item.emoji,
                    "🌱"
                );

            const price =
                getPrice(
                    item
                );

            const bought =
                getBoughtCount(
                    userId,
                    item.id
                );

            lines.push(
                [
                    `● \`${emoji}\` **${item.name}**`,
                    `> ${item.description || "Hạt giống dùng để trồng cây."}`,
                    `> 💰 Giá: **${price.toLocaleString()} Mora**`,
                    `> 🛒 Đã mua: **${bought}/${MAX_BUY_PER_SEED}**`
                ].join("\n")
            );

            if (
                item.growTime
            ) {
                lines.push(
                    `> ⏳ Lớn trong: **${formatTime(item.growTime)}**`
                );
            }

            if (
                item.minHarvest ||
                item.maxHarvest
            ) {
                lines.push(
                    `> 🌾 Thu hoạch: **${item.minHarvest || 1} - ${item.maxHarvest || item.minHarvest || 1}**`
                );
            }

            lines.push("");
        }

        lines.push(
            "● `🔄` **Đổi shop**",
            `> Đổi 5 hạt giống mới với **${REFRESH_COST} Xu**.`,
            "",
            "♡ Mỗi loại hạt giống tối đa 10 lần mua trong một lượt."
        );
    }

    if (
        category ===
        "rods"
    ) {
        lines.push(
            "`🎣` **Cần câu**",
            ""
        );

        for (
            const item of items
        ) {
            const emoji =
                safeEmoji(
                    item.emoji,
                    "🎣"
                );

            const price =
                getPrice(
                    item
                );

            lines.push(
                [
                    `● \`${emoji}\` **${item.name}**`,
                    `> ${item.description || "Một chiếc cần câu."}`,
                    `> 💰 Giá: **${price.toLocaleString()} Mora**`,
                    `> ⭐ Level: **${item.rodLevel || 1}**`,
                    `> 🛡️ Độ bền: **${item.durability || item.maxDurability || 20}**`,
                    ""
                ].join("\n")
            );
        }
    }

    if (
        category ===
        "plots"
    ) {
        lines.push(
            "`🟫` **Đất trang trại**",
            ""
        );

        for (
            const item of items
        ) {
            lines.push(
                [
                    `● \`🟫\` **${item.name}**`,
                    `> ${item.description}`,
                    `> 💰 Giá: **${getPrice(item).toLocaleString()} Mora**`,
                    ""
                ].join("\n")
            );
        }
    }

    lines.push(
        "● `💰` **Mora hiện có**",
        `> ${balance.toLocaleString()} Mora`,
        "",
        "● `🪙` **Xu hiện có**",
        `> ${xu.toLocaleString()} Xu`
    );

    return new EmbedBuilder()
        .setColor(
            COLORS.primary
        )
        .setTitle(
            category === "seeds"
                ? "● `🌱` Hạt giống"
                : category === "rods"
                    ? "● `🎣` Cần câu"
                    : "● `🟫` Đất trang trại"
        )
        .setDescription(
            lines.join("\n")
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
                        COLORS.error
                    )
                    .setTitle(
                        "● `🍃` Hết hàng"
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
                        category === "seeds"
                            ? getBoughtCount(
                                userId,
                                item.id
                            )
                            : 0;

                    const soldOut =
                        category === "seeds" &&
                        bought >=
                        MAX_BUY_PER_SEED;

                    return {
                        label:
                            String(
                                item.name
                            ).slice(
                                0,
                                100
                            ),

                        description:
                            category === "seeds"
                                ? `${price.toLocaleString()} Mora • ${bought}/${MAX_BUY_PER_SEED}`
                                    .slice(
                                        0,
                                        100
                                    )
                                : `${price.toLocaleString()} Mora`
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
                                item.emoji,
                                category === "seeds"
                                    ? "🌱"
                                    : category === "rods"
                                        ? "🎣"
                                        : "🟫"
                            ),

                        default:
                            false
                    };
                }
            );

    const components = [
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
                            `Đổi shop • ${REFRESH_COST} Xu`
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

    const balance =
        getBalance(
            userId
        );

    const canBuy =
        balance >=
        price;

    const emoji =
        safeEmoji(
            item.emoji,
            category === "seeds"
                ? "🌱"
                : category === "rods"
                    ? "🎣"
                    : "🟫"
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
            "● `🛒` **Giới hạn mua**",
            `> ${bought}/${MAX_BUY_PER_SEED}`,
            "",
            "● `🔄` **Shop**",
            `> Còn ${formatTime(getSeedShopRemaining(userId))} trước khi đổi lượt.`
        );

        if (
            bought >=
            MAX_BUY_PER_SEED
        ) {
            lines.push(
                "",
                "`⚠️` Bạn đã đạt giới hạn 10 lần mua loại hạt này."
            );
        }
    }

    if (
        category ===
        "seeds" &&
        item.growTime
    ) {
        lines.push(
            "",
            "● `⏳` **Thời gian**",
            `> ${formatTime(item.growTime)}`
        );
    }

    if (
        category ===
        "seeds" &&
        (
            item.minHarvest ||
            item.maxHarvest
        )
    ) {
        lines.push(
            "",
            "● `🌾` **Thu hoạch**",
            `> ${item.minHarvest || 1} - ${item.maxHarvest || item.minHarvest || 1}`
        );
    }

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

    const bought =
        category === "seeds"
            ? getBoughtCount(
                userId,
                item.id
            )
            : 0;

    const disabled =
        !canBuy ||
        (
            category === "seeds" &&
            bought >=
            MAX_BUY_PER_SEED
        );

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    disabled
                        ? COLORS.error
                        : COLORS.success
                )
                .setTitle(
                    `● \`${emoji}\` ${item.name}`
                )
                .setDescription(
                    lines.join("\n")
                )
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `shop_buy_${userId}`
                        )
                        .setLabel(
                            bought >= MAX_BUY_PER_SEED &&
                            category === "seeds"
                                ? "Đã đạt giới hạn"
                                : canBuy
                                    ? "Mua"
                                    : "Không đủ Mora"
                        )
                        .setEmoji(
                            bought >= MAX_BUY_PER_SEED &&
                            category === "seeds"
                                ? "🔒"
                                : canBuy
                                    ? "🛒"
                                    : "💸"
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

    // ═══════════════════════════════
    // 🌱 SEED LIMIT
    // ═══════════════════════════════

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
            MAX_BUY_PER_SEED
        ) {
            return interaction.reply({
                content:
                    `🔒 Bạn đã mua đủ ${MAX_BUY_PER_SEED} lần loại hạt này trong lượt shop.`,
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

    // ═══════════════════════════════
    // 🟫 PLOT
    // ═══════════════════════════════

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

    // ═══════════════════════════════
    // 💸 REMOVE MONEY
    // ═══════════════════════════════

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
            item.emoji,
            category === "seeds"
                ? "🌱"
                : "🎣"
        );

    const newBought =
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
                    COLORS.success
                )
                .setTitle(
                    "● `♡` Mua thành công"
                )
                .setDescription(
                    [
                        `● \`${emoji}\` **${item.name} ×1**`,
                        `> ${item.description || "Vật phẩm đã được thêm vào túi đồ."}`,
                        "",
                        "● `💰` **Đã trả**",
                        `> -${price.toLocaleString()} Mora`,
                        "",
                        category === "seeds"
                            ? [
                                "● `🛒` **Đã mua trong lượt**",
                                `> ${newBought}/${MAX_BUY_PER_SEED}`,
                                ""
                            ].join("\n")
                            : "",
                        "● `🎒` **Inventory**",
                        "> Đã thêm vật phẩm vào túi đồ."
                    ]
                        .filter(
                            Boolean
                        )
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
// 🔄 REFRESH SHOP BUTTON
// ═══════════════════════════════════════

async function refreshShop(
    interaction,
    userId
) {
    const xu =
        getXu(
            userId
        );

    if (
        xu <
        REFRESH_COST
    ) {
        return interaction.reply({
            content:
                `🪙 Bạn cần **${REFRESH_COST} Xu** để đổi shop.\n> Hiện có: **${xu.toLocaleString()} Xu**`,
            ephemeral: true
        });
    }

    const removed =
        removeXu(
            userId,
            REFRESH_COST
        );

    if (!removed) {
        return interaction.reply({
            content:
                "🪙 Không thể trừ Xu.",
            ephemeral: true
        });
    }

    refreshSeedShop(
        userId
    );

    const items =
        getRandomSeeds(
            userId
        );

    return interaction.update({
        embeds: [
            createCategoryEmbed(
                "seeds",
                items,
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
        getRandomSeeds(
            userId
        );

    return [
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `shop_item_${userId}`
                    )
                    .setPlaceholder(
                        "📦 Chọn hạt giống..."
                    )
                    .addOptions(
                        items.map(
                            item => {
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
                                        `${getPrice(item).toLocaleString()} Mora • ${bought}/${MAX_BUY_PER_SEED}`
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
                                            item.emoji,
                                            "🌱"
                                        )
                                };
                            }
                        )
                    )
            ),

        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `shop_refresh_${userId}`
                    )
                    .setLabel(
                        `Đổi shop • ${REFRESH_COST} Xu`
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
    ];
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

    if (
        remain ===
        0
    ) {
        return `${minutes} phút`;
    }

    return `${minutes} phút ${remain} giây`;
}

// ═══════════════════════════════════════
// 🛒 COMMAND
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

            ensureUser(
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
                            components:
                                []
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

module.exports =
    command;
