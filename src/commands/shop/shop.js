
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
// 🌱 SEED SHOP CONFIG
// ═══════════════════════════════════════

const SEED_SHOP_COUNT = 5;
const SEED_SHOP_REFRESH = 15 * 60 * 1000;

const SEED_REFRESH_PRICE = 100;

const MAX_BUY_PER_SEED = 10;

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

function getUser(userId) {
    return User.getOrCreate(
        userId
    );
}

// ═══════════════════════════════════════
// 🌱 SEED SHOP STATE
// ═══════════════════════════════════════
//
// Lưu trực tiếp trong user:
// user.seedShop = {
//     items: ["wheat_seed", ...],
//     createdAt: 123456789,
//     purchases: {
//         wheat_seed: 2
//     }
// }
//
// Nếu shop hết 15 phút → tự random lại.
//
// ═══════════════════════════════════════

function getSeedItems() {
    return Item
        .getAll()
        .filter(
            item =>
                item &&
                item.category === "seed"
        );
}

function randomSeedItems() {
    const seeds =
        getSeedItems();

    if (!seeds.length) {
        return [];
    }

    const shuffled = [
        ...seeds
    ];

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

    return shuffled
        .slice(
            0,
            Math.min(
                SEED_SHOP_COUNT,
                shuffled.length
            )
        )
        .map(
            item =>
                String(item.id)
        );
}

function createSeedShop() {
    return {
        items:
            randomSeedItems(),

        createdAt:
            Date.now(),

        purchases: {}
    };
}

function saveSeedShop(
    userId,
    seedShop
) {
    return User.update(
        userId,
        {
            seedShop
        }
    );
}

function getSeedShop(
    userId
) {
    const user =
        getUser(userId);

    let shop =
        user?.seedShop;

    const now =
        Date.now();

    const expired =
        !shop ||
        !Array.isArray(
            shop.items
        ) ||
        !shop.createdAt ||
        now -
            Number(
                shop.createdAt
            ) >=
            SEED_SHOP_REFRESH;

    if (expired) {
        shop =
            createSeedShop();

        saveSeedShop(
            userId,
            shop
        );

        return shop;
    }

    if (
        !shop.purchases ||
        typeof shop.purchases !==
            "object"
    ) {
        shop.purchases = {};

        saveSeedShop(
            userId,
            shop
        );
    }

    return shop;
}

// ═══════════════════════════════════════
// ⏳ SEED SHOP TIME
// ═══════════════════════════════════════

function getSeedShopRemaining(
    shop
) {
    const expiresAt =
        Number(
            shop.createdAt || 0
        ) +
        SEED_SHOP_REFRESH;

    return Math.max(
        0,
        expiresAt -
            Date.now()
    );
}

function formatTime(
    ms
) {
    const seconds =
        Math.max(
            0,
            Math.floor(
                Number(ms || 0) /
                    1000
            )
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
        seconds % 60;

    if (!remain) {
        return `${minutes} phút`;
    }

    return `${minutes} phút ${remain} giây`;
}

// ═══════════════════════════════════════
// 🔄 REFRESH SEED SHOP
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
// 📦 GET SHOP ITEMS
// ═══════════════════════════════════════

function getItems(
    category,
    userId
) {
    // 🌱 HẠT GIỐNG
    if (
        category ===
        "seeds"
    ) {
        const shop =
            getSeedShop(
                userId
            );

        return shop.items
            .map(
                itemId =>
                    Item.get(
                        itemId
                    )
            )
            .filter(Boolean);
    }

    // 🎣 CẦN CÂU
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

    // 🟫 ĐẤT
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
// 💰 BALANCE
// ═══════════════════════════════════════

function getBalance(
    userId
) {
    const user =
        getUser(userId);

    return Number(
        user?.balance || 0
    );
}

// ═══════════════════════════════════════
// 💠 XU
// ═══════════════════════════════════════
//
// Hỗ trợ:
// user.xu
// user.coins
// user.gems
//
// Ưu tiên xu.
//
// ═══════════════════════════════════════

function getXu(
    userId
) {
    const user =
        getUser(userId);

    return Number(
        user?.xu ??
            user?.coins ??
            user?.gems ??
            0
    );
}

function removeXu(
    userId,
    amount
) {
    const user =
        getUser(userId);

    const current =
        getXu(userId);

    if (
        current <
        amount
    ) {
        return false;
    }

    const field =
        user?.xu !== undefined
            ? "xu"
            : user?.coins !==
              undefined
            ? "coins"
            : "gems";

    if (
        typeof User.update ===
        "function"
    ) {
        User.update(
            userId,
            {
                [field]:
                    current -
                    amount
            }
        );

        return true;
    }

    return false;
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
        getUser(userId);

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
        getUser(userId);

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
// 🎒 ADD INVENTORY
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
        getUser(userId);

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

        return true;
    }

    throw new Error(
        "Không tìm thấy hàm thêm item."
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
                "> Mỗi 15 phút Venti sẽ đổi 5 loại hạt giống riêng cho bạn.",

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
                "- `💠` **Xu**",
                `> ${xu.toLocaleString()} Xu`
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
                            "5 loại hạt giống riêng của bạn.",
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

        title =
            "● `🌱` Hạt giống";

        description =
            [
                "> Hạt giống trong shop được random riêng cho bạn.",
                `> 🔄 Shop sẽ đổi sau **${formatTime(
                    getSeedShopRemaining(
                        shop
                    )
                )}**.`,
                `> 📦 Mỗi loại tối đa **${MAX_BUY_PER_SEED} lần**.`
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
            "";

        if (
            category ===
            "seeds"
        ) {
            const shop =
                getSeedShop(
                    userId
                );

            const bought =
                Number(
                    shop.purchases?.[
                        item.id
                    ] || 0
                );

            extra =
                `> 📦 Đã mua: **${bought}/${MAX_BUY_PER_SEED}**`;
        }

        lines.push(
            [
                `● \`${emoji}\` **${item.name}**`,
                `> ${item.description || "Một vật phẩm trong cửa hàng Venti."}`,
                `> 💰 Giá: **${price.toLocaleString()} Mora**`,
                extra
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
                        item.minHarvest ||
                        1
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
                    item.rodLevel ||
                    1
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

    const result = [
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
        result.push(
            "",
            `● \`💠\` **Xu hiện có**`,
            `> ${xu.toLocaleString()} Xu`
        );
    }

    result.push(
        "",
        "♡ Chọn sản phẩm bên dưới để xem và mua."
    );

    return new EmbedBuilder()
        .setColor(
            "#9ccfd8"
        )
        .setTitle(
            title
        )
        .setDescription(
            result.join("\n")
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
                        const shop =
                            getSeedShop(
                                userId
                            );

                        const bought =
                            Number(
                                shop.purchases?.[
                                    item.id
                                ] || 0
                            );

                        description =
                            `${price.toLocaleString()} Mora • ${bought}/${MAX_BUY_PER_SEED}`;
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

    const components = [
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `shop_item_${userId}`
                    )
                    .setPlaceholder(
                        "📦 Chọn sản phẩm để mua..."
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
                            `shop_seed_refresh_${userId}`
                        )
                        .setLabel(
                            `Đổi shop • ${SEED_REFRESH_PRICE} Xu`
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
// 🔄 MANUAL SEED REFRESH
// ═══════════════════════════════════════

async function manualSeedRefresh(
    interaction,
    userId
) {
    const xu =
        getXu(
            userId
        );

    if (
        xu <
        SEED_REFRESH_PRICE
    ) {
        return interaction.reply({
            content:
                `💠 Bạn cần **${SEED_REFRESH_PRICE} Xu** để đổi shop.`,
            ephemeral: true
        });
    }

    const removed =
        removeXu(
            userId,
            SEED_REFRESH_PRICE
        );

    if (!removed) {
        return interaction.reply({
            content:
                "💠 Không thể trừ Xu.",
            ephemeral: true
        });
    }

    const shop =
        refreshSeedShop(
            userId
        );

    return interaction.update({
        embeds: [
            createCategoryEmbed(
                "seeds",
                getItems(
                    "seeds",
                    userId
                ),
                userId
            )
        ],
        components:
            seedCategoryComponents(
                userId
            )
    });
}

// ═══════════════════════════════════════
// 🌱 SEED COMPONENTS
// ═══════════════════════════════════════

function seedCategoryComponents(
    userId
) {
    const items =
        getItems(
            "seeds",
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
                        "📦 Chọn hạt giống để mua..."
                    )
                    .addOptions(
                        items
                            .slice(
                                0,
                                25
                            )
                            .map(
                                item => {
                                    const shop =
                                        getSeedShop(
                                            userId
                                        );

                                    const bought =
                                        Number(
                                            shop.purchases?.[
                                                item.id
                                            ] || 0
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
                                            `${getPrice(
                                                item
                                            ).toLocaleString()} Mora • ${bought}/${MAX_BUY_PER_SEED}`.slice(
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
                        `shop_seed_refresh_${userId}`
                    )
                    .setLabel(
                        `Đổi shop • ${SEED_REFRESH_PRICE} Xu`
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

    const emoji =
        safeEmoji(
            item.emoji
        );

    const canBuy =
        balance >=
        price;

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

    let bought =
        0;

    if (
        category ===
        "seeds"
    ) {
        const shop =
            getSeedShop(
                userId
            );

        bought =
            Number(
                shop.purchases?.[
                    item.id
                ] || 0
            );

        lines.push(
            "",
            "● `📦` **Giới hạn mua**",
            `> ${bought}/${MAX_BUY_PER_SEED}`,
            "",
            "● `🔄` **Shop**",
            `> Đổi sau ${formatTime(
                getSeedShopRemaining(
                    shop
                )
            )}`
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
                    item.minHarvest ||
                    1
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
                item.rodLevel ||
                1
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

    const limitReached =
        category ===
            "seeds" &&
        bought >=
            MAX_BUY_PER_SEED;

    const disabled =
        !canBuy ||
        limitReached;

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
            "📦";
    } else if (
        !canBuy
    ) {
        buttonLabel =
            "Không đủ Mora";

        buttonEmoji =
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
                            buttonLabel
                        )
                        .setEmoji(
                            buttonEmoji
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

    // 🌱 LIMIT SEED
    if (
        category ===
        "seeds"
    ) {
        const shop =
            getSeedShop(
                userId
            );

        const bought =
            Number(
                shop.purchases?.[
                    item.id
                ] || 0
            );

        if (
            bought >=
            MAX_BUY_PER_SEED
        ) {
            return interaction.reply({
                content:
                    `📦 Bạn đã mua đủ **${MAX_BUY_PER_SEED}** lần loại hạt này trong lượt shop hiện tại.`,
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

    // 💸 REMOVE MONEY
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
    } catch (
        error
    ) {
        addBalance(
            userId,
            price
        );

        throw error;
    }

    // 🌱 UPDATE PURCHASE COUNT
    if (
        category ===
        "seeds"
    ) {
        const shop =
            getSeedShop(
                userId
            );

        if (
            !shop.purchases
        ) {
            shop.purchases = {};
        }

        shop.purchases[
            item.id
        ] =
            Number(
                shop.purchases[
                    item.id
                ] || 0
            ) + 1;

        saveSeedShop(
            userId,
            shop
        );
    }

    const emoji =
        safeEmoji(
            item.emoji
        );

    const newBalance =
        getBalance(
            userId
        );

    let description = [
        `● \`${emoji}\` **${item.name} ×1**`,
        `> ${
            item.description ||
            "Vật phẩm đã được thêm vào túi đồ."
        }`,
        "",
        "● `💰` **Đã trả**",
        `> -${price.toLocaleString()} Mora`,
        "",
        "● `🎒` **Inventory**",
        "> Đã thêm vật phẩm vào túi đồ."
    ];

    if (
        category ===
        "seeds"
    ) {
        const shop =
            getSeedShop(
                userId
            );

        const current =
            Number(
                shop.purchases?.[
                    item.id
                ] || 0
            );

        description.push(
            "",
            "● `📦` **Giới hạn mua**",
            `> ${current}/${MAX_BUY_PER_SEED}`,
            "",
            "● `💳` **Mora còn lại**",
            `> ${newBalance.toLocaleString()} Mora`
        );
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

            getUser(
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

                        // ═══════════════════════
                        // CATEGORY
                        // ═══════════════════════

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

                        // ═══════════════════════
                        // ITEM
                        // ═══════════════════════

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

                        // ═══════════════════════
                        // BUY
                        // ═══════════════════════

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

                        // ═══════════════════════
                        // REFRESH SEED SHOP
                        // ═══════════════════════

                        if (
                            id ===
                            `shop_seed_refresh_${userId}`
                        ) {
                            state.category =
                                "seeds";

                            state.itemId =
                                null;

                            return manualSeedRefresh(
                                interaction,
                                userId
                            );
                        }

                        // ═══════════════════════
                        // HOME
                        // ═══════════════════════

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

                        // ═══════════════════════
                        // BACK
                        // ═══════════════════════

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

                        // ═══════════════════════
                        // CLOSE
                        // ═══════════════════════

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
                    } catch (
                        error
                    ) {
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
        } catch (
            error
        ) {
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

