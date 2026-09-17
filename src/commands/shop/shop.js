const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

const Item =
    require("../../database/models/Item");

// ═══════════════════════════════════════
// 🍃 VENTI • SHOP
// ═══════════════════════════════════════

// ======================================
// 🟫 FARM PLOTS
// ======================================

const PLOTS = [
    {
        id: 2,
        name: "Ô đất #2",
        emoji: "🟫",
        price: 1000,
        description: "Mở khóa thêm một ô đất để trồng cây."
    },
    {
        id: 3,
        name: "Ô đất #3",
        emoji: "🟫",
        price: 3000,
        description: "Mở khóa thêm một ô đất để mở rộng trang trại."
    },
    {
        id: 4,
        name: "Ô đất #4",
        emoji: "🟫",
        price: 7500,
        description: "Một ô đất mới cho trang trại."
    },
    {
        id: 5,
        name: "Ô đất #5",
        emoji: "🟫",
        price: 15000,
        description: "Mở rộng thêm không gian trang trại."
    },
    {
        id: 6,
        name: "Ô đất #6",
        emoji: "🟫",
        price: 30000,
        description: "Một ô đất cao cấp."
    },
    {
        id: 7,
        name: "Ô đất #7",
        emoji: "🟫",
        price: 60000,
        description: "Mở rộng trang trại thêm một ô đất."
    },
    {
        id: 8,
        name: "Ô đất #8",
        emoji: "🟫",
        price: 120000,
        description: "Một ô đất lớn dành cho trang trại phát triển."
    },
    {
        id: 9,
        name: "Ô đất #9",
        emoji: "🟫",
        price: 250000,
        description: "Ô đất cao cấp cho những mùa vụ lớn."
    },
    {
        id: 10,
        name: "Ô đất #10",
        emoji: "🟫",
        price: 500000,
        description: "Ô đất cuối cùng của trang trại."
    }
];

// ======================================
// ⚙️ CONFIG
// ======================================

const SEED_SHOP_SIZE = 5;
const SEED_SHOP_DURATION = 15 * 60 * 1000;
const REFRESH_PRICE = 100;
const SEED_PURCHASE_LIMIT = 5;

// ======================================
// 🌱 SEED IDS
// ======================================

const SEED_IDS = [
    "apple",
    "orange",
    "wheat",
    "tomato",
    "carrot",
    "potato",
    "corn",
    "cabbage",
    "lettuce",
    "strawberry",
    "blueberry",
    "grape",
    "peach",
    "pear",
    "lemon",
    "watermelon",
    "pineapple",
    "coconut",
    "eggplant",
    "chili",
    "golden_apple",
    "crystal_berry"
];

// ======================================
// 🎣 ROD IDS
// ======================================

const ROD_IDS = [
    "fishing_rod",
    "iron_rod",
    "golden_rod",
    "wind_rod"
];

// ======================================
// 🛡️ SAFE EMOJI
// ======================================

function safeEmoji(emoji, fallback = "📦") {
    if (!emoji) {
        return fallback;
    }

    const value = String(emoji).trim();

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

// ======================================
// 🔀 SHUFFLE
// ======================================

function shuffle(array) {
    return [...array].sort(
        () => Math.random() - 0.5
    );
}

// ======================================
// 🌱 CREATE SEED SHOP
// ======================================

function createSeedShop() {
    const allItems = Item.getAll();

    if (!Array.isArray(allItems)) {
        return [];
    }

    const seeds = allItems.filter(item =>
        SEED_IDS.includes(String(item.id))
    );

    return shuffle(seeds)
        .slice(0, SEED_SHOP_SIZE)
        .map(item => ({
            itemId: item.id
        }));
}

// ======================================
// 🌱 GET SEED SHOP
// ======================================

function getSeedShop(userId) {
    const user = User.getOrCreate(userId);

    const now = Date.now();
    const current = user.seedShop;

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
        items: createSeedShop(),
        createdAt: now
    };

    saveUserField(
        userId,
        "seedShop",
        shop
    );

    return shop;
}

// ======================================
// 🔄 REFRESH
// ======================================

function refreshSeedShop(userId) {
    const shop = {
        items: createSeedShop(),
        createdAt: Date.now()
    };

    saveUserField(
        userId,
        "seedShop",
        shop
    );

    return shop;
}

// ======================================
// ⏳ TIME
// ======================================

function getRemainingShopTime(shop) {
    const expires =
        Number(shop.createdAt || 0) +
        SEED_SHOP_DURATION;

    return Math.max(
        0,
        expires - Date.now()
    );
}

function formatTime(ms) {
    const seconds = Math.floor(
        Number(ms || 0) / 1000
    );

    if (seconds < 60) {
        return `${seconds} giây`;
    }

    const minutes = Math.floor(
        seconds / 60
    );

    const remain = seconds % 60;

    if (remain === 0) {
        return `${minutes} phút`;
    }

    return `${minutes} phút ${remain} giây`;
}

// ======================================
// 🌱 CURRENT SEEDS
// ======================================

function getCurrentSeeds(userId) {
    const shop = getSeedShop(userId);

    return shop.items
        .map(entry =>
            Item.get(entry.itemId)
        )
        .filter(Boolean);
}

// ======================================
// 🏠 COMMAND
// ======================================

const command = {

    name: "shop",

    aliases: ["vshop"],

    description:
        "🛒 Cửa hàng của Venti.",

    usage: "Vshop",

    category: "economy",

    async execute(message) {

        try {

            const userId =
                message.author
                    ? message.author.id
                    : message.user.id;

            User.getOrCreate(userId);

            getSeedShop(userId);

            const msg =
                await message.reply({

                    embeds: [
                        homeEmbed(userId)
                    ],

                    components: [
                        categoryRow(userId)
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

                        // CATEGORY
                        if (
                            id ===
                            `shop_category_${userId}`
                        ) {

                            state.category =
                                interaction.values[0];

                            state.itemId = null;

                            return showCategory(
                                interaction,
                                state.category,
                                userId
                            );
                        }

                        // ITEM
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

                        // BUY
                        if (
                            id ===
                            `shop_buy_${userId}`
                        ) {

                            return openBuyModal(
                                interaction,
                                state.category,
                                state.itemId,
                                userId
                            );
                        }

                        // REFRESH
                        if (
                            id ===
                            `shop_refresh_${userId}`
                        ) {

                            return refreshShop(
                                interaction,
                                userId
                            );
                        }

                        // HOME
                        if (
                            id ===
                            `shop_home_${userId}`
                        ) {

                            state.category = null;
                            state.itemId = null;

                            return interaction.update({

                                embeds: [
                                    homeEmbed(userId)
                                ],

                                components: [
                                    categoryRow(userId)
                                ]

                            });
                        }

                        // BACK
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

                        // CLOSE
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
                                .catch(() => {});
                        }

                        return interaction
                            .reply({
                                content:
                                    "🍃 Có lỗi xảy ra trong shop.",
                                ephemeral: true
                            })
                            .catch(() => {});
                    }
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
                .catch(() => {});
        }
    }
};

// ======================================
// 🏠 HOME EMBED
// ======================================

function homeEmbed(userId) {

    const user =
        User.getOrCreate(userId);

    const balance =
        Number(user?.balance || 0);

    return new EmbedBuilder()

        .setColor("#A8DCC0")

        .setAuthor({
            name: "☁️ Venti · Shop"
        })

        .setTitle("🍃 Venti Shop")

        .setDescription(

            "☁️ `🍃` **Một góc nhỏ của cửa hàng Venti**\n\n" +

            "- `🌱` **Hạt giống**\n" +
            "> Hạt giống ngẫu nhiên dành riêng cho bạn.\n\n" +

            "- `🎣` **Cần câu**\n" +
            "> Những chiếc cần câu để khám phá Windrise Lake.\n\n" +

            "- `🟫` **Đất trang trại**\n" +
            "> Mở khóa thêm không gian cho trang trại.\n\n" +

            "- `💰` **Tài chính**\n" +
            `> 💵 **Mora:** ${balance.toLocaleString()}\n\n` +

            "☕ `🍃` **Chọn một danh mục để bắt đầu mua sắm.**"
        )

        .setFooter({
            text: "☁️ Venti • Cozy Corner 🍃"
        })

        .setTimestamp();
}

// ======================================
// 📂 CATEGORY ROW
// ======================================

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
                        label: "Hạt giống",
                        description:
                            "5 hạt giống ngẫu nhiên.",
                        value: "seeds",
                        emoji: "🌱"
                    },

                    {
                        label: "Cần câu",
                        description:
                            "Mua cần câu.",
                        value: "rods",
                        emoji: "🎣"
                    },

                    {
                        label: "Đất trang trại",
                        description:
                            "Mở khóa ô đất.",
                        value: "plots",
                        emoji: "🟫"
                    }

                ])
        );
}

// ======================================
// 📦 GET ITEMS
// ======================================

function getItems(category, userId) {

    if (category === "seeds") {
        return getCurrentSeeds(userId);
    }

    if (category === "rods") {

        const allItems = Item.getAll();

        if (!Array.isArray(allItems)) {
            return [];
        }

        return allItems.filter(item =>
            ROD_IDS.includes(String(item.id))
        );
    }

    if (category === "plots") {

        const farm =
            User.getFarm(userId);

        const unlocked =
            Array.isArray(farm?.plots)
                ? farm.plots
                    .filter(plot => plot.unlocked)
                    .map(plot => Number(plot.id))
                : [];

        return PLOTS.filter(plot =>
            !unlocked.includes(
                Number(plot.id)
            )
        );
    }

    return [];
}

// ======================================
// 📋 CATEGORY EMBED
// ======================================

function createCategoryEmbed(
    category,
    items,
    userId
) {

    const user =
        User.getOrCreate(userId);

    const balance =
        Number(user?.balance || 0);

    let title = "🍃 Venti Shop";
    let intro = "";
    let icon = "🍃";

    if (category === "seeds") {

        const shop =
            getSeedShop(userId);

        const remaining =
            getRemainingShopTime(shop);

        title = "🌱 Hạt Giống";
        icon = "🌱";

        intro = [
            "☁️ `🌱` **Hạt giống dành cho mùa vụ của bạn.**",
            `> 🔄 Làm mới sau: **${formatTime(remaining)}**`,
            `> 💰 Đổi shop: **${REFRESH_PRICE.toLocaleString()} Mora**`,
            "> 🛒 Mỗi loại tối đa **5 hạt**."
        ].join("\n");
    }

    if (category === "rods") {

        title = "🎣 Cần Câu";
        icon = "🎣";

        intro =
            "☁️ `🎣` **Những chiếc cần câu giúp bạn khám phá Windrise Lake.**";
    }

    if (category === "plots") {

        title = "🟫 Đất Trang Trại";
        icon = "🟫";

        intro =
            "☁️ `🟫` **Mở rộng trang trại và tạo thêm không gian trồng trọt.**";
    }

    const lines = [];

    for (const item of items) {

        const emoji =
            safeEmoji(item.emoji);

        const price =
            getPrice(item);

        if (category === "seeds") {

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
                `- ${emoji} **${item.name}**`
            );

            lines.push(
                `> \`💰 Giá       : ${price.toLocaleString()} Mora / hạt\``
            );

            lines.push(
                `> \`🌱 Có thể mua: ${canBuy}/${SEED_PURCHASE_LIMIT} hạt\``
            );

            lines.push("");
        }

        if (category === "rods") {

            lines.push(
                `- ${emoji} **${item.name}**`
            );

            lines.push(
                `> \`💰 Giá       : ${price.toLocaleString()} Mora\``
            );

            lines.push(
                `> \`⭐ Level     : ${item.rodLevel || 1}\``
            );

            lines.push("");
        }

        if (category === "plots") {

            lines.push(
                `- ${emoji} **${item.name}**`
            );

            lines.push(
                `> \`💰 Giá       : ${price.toLocaleString()} Mora\``
            );

            lines.push("");
        }
    }

    if (!lines.length) {
        lines.push(
            "☁️ Hiện không còn sản phẩm."
        );
    }

    return new EmbedBuilder()

        .setColor("#A8DCC0")

        .setAuthor({
            name: `☁️ Venti · ${title}`
        })

        .setTitle(`${icon} ${title}`)

        .setDescription(

            intro +
            "\n\n" +

            lines.join("\n") +

            "\n" +

            `- \`💰\` **Mora hiện tại:** ${balance.toLocaleString()}\n\n` +

            "☕ `🍃` **Chọn sản phẩm bên dưới để xem chi tiết.**"
        )

        .setFooter({
            text: "☁️ Venti • Cozy Corner 🍃"
        })

        .setTimestamp();
}

// ======================================
// 📂 SHOW CATEGORY
// ======================================

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

    if (!items.length) {

        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor("#f2a7a7")

                    .setTitle("🍃 Hết hàng")

                    .setDescription(
                        "☁️ Hiện tại danh mục này không có sản phẩm."
                    )

                    .setFooter({
                        text:
                            "☁️ Venti • Cozy Corner 🍃"
                    })

            ],

            components: [
                homeButton(userId)
            ]
        });
    }

    const options =
        items
            .slice(0, 25)
            .map(item => {

                const price =
                    getPrice(item);

                const bought =
                    category === "seeds"
                        ? getBoughtCount(
                            userId,
                            item.id
                        )
                        : 0;

                let description;

                if (category === "seeds") {

                    const remaining =
                        Math.max(
                            0,
                            SEED_PURCHASE_LIMIT -
                                bought
                        );

                    description =
                        `${price.toLocaleString()} Mora/hạt • Còn ${remaining} hạt`;

                } else {

                    description =
                        `${price.toLocaleString()} Mora`;
                }

                return {

                    label:
                        String(item.name)
                            .slice(0, 100),

                    description:
                        description
                            .slice(0, 100),

                    value:
                        String(item.id),

                    emoji:
                        safeEmoji(item.emoji)
                };
            });

    const rows = [

        new ActionRowBuilder()
            .addComponents(

                new StringSelectMenuBuilder()

                    .setCustomId(
                        `shop_item_${userId}`
                    )

                    .setPlaceholder(
                        `${category === "seeds"
                            ? "🌱"
                            : category === "rods"
                                ? "🎣"
                                : "🟫"
                        } Chọn sản phẩm...`
                    )

                    .addOptions(options)
            )
    ];

    if (category === "seeds") {

        rows.push(

            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            `shop_refresh_${userId}`
                        )

                        .setLabel(
                            `Đổi shop • ${REFRESH_PRICE}`
                        )

                        .setEmoji("🔄")

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `shop_home_${userId}`
                        )

                        .setLabel("Trang chủ")

                        .setEmoji("🏠")

                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `shop_close_${userId}`
                        )

                        .setLabel("Đóng")

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

                        .setLabel("Trang chủ")

                        .setEmoji("🏠")

                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `shop_close_${userId}`
                        )

                        .setLabel("Đóng")

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

        components: rows
    });
}

// ======================================
// 📦 SHOW ITEM
// ======================================

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
        getPrice(item);

    const user =
        User.getOrCreate(userId);

    const balance =
        Number(user?.balance || 0);

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

    const canBuy =
        balance >= price &&
        (
            category !== "seeds" ||
            remaining > 0
        );

    const emoji =
        safeEmoji(item.emoji);

    if (category === "seeds") {

        const embed =
            new EmbedBuilder()

                .setColor(
                    canBuy
                        ? "#A8DCC0"
                        : "#f2a7a7"
                )

                .setAuthor({
                    name:
                        "☁️ Venti · Hạt giống"
                })

                .setTitle(
                    `${emoji} ${item.name}`
                )

                .setDescription(

                    "☁️ `🍃` **Thông tin sản phẩm**\n\n" +

                    `- \`🌱\` **Loại:** Hạt giống\n` +
                    `- \`💰\` **Giá:** ${price.toLocaleString()} Mora / hạt\n` +
                    `- \`💵\` **Ví:** ${balance.toLocaleString()} Mora\n` +
                    `- \`📦\` **Đã mua:** ${bought}/${SEED_PURCHASE_LIMIT} hạt\n` +
                    `- \`🛒\` **Có thể mua:** ${remaining} hạt\n\n` +

                    `📝 ${item.description || "Hạt giống dùng để trồng cây."}\n\n` +

                    "☕ `🍃` **Nhập số lượng bạn muốn mua.**"
                )

                .setFooter({
                    text:
                        "☁️ Venti • Cozy Corner 🍃"
                })

                .setTimestamp();

        return interaction.update({

            embeds: [embed],

            components: [

                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()

                            .setCustomId(
                                `shop_buy_${userId}`
                            )

                            .setLabel(
                                canBuy
                                    ? "Mua số lượng"
                                    : "Không thể mua"
                            )

                            .setEmoji(
                                canBuy
                                    ? "🛒"
                                    : "🔒"
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

                            .setLabel("Quay lại")

                            .setEmoji("↩️")

                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    )
            ]
        });
    }

    const lines = [

        "☁️ `🍃` **Thông tin sản phẩm**",
        "",
        `- \`💰\` **Giá:** ${price.toLocaleString()} Mora`,
        `- \`💵\` **Ví:** ${balance.toLocaleString()} Mora`
    ];

    if (category === "rods") {

        lines.push(
            `- \`⭐\` **Level:** ${item.rodLevel || 1}`
        );
    }

    if (category === "plots") {

        lines.push(
            `- \`🟫\` **Ô đất:** #${item.id}`
        );
    }

    lines.push(
        "",
        `📝 ${item.description || "Sản phẩm của Venti Shop."}`
    );

    return interaction.update({

        embeds: [

            new EmbedBuilder()

                .setColor(
                    canBuy
                        ? "#A8DCC0"
                        : "#f2a7a7"
                )

                .setAuthor({
                    name:
                        "☁️ Venti · Shop"
                })

                .setTitle(
                    `${emoji} ${item.name}`
                )

                .setDescription(
                    lines.join("\n")
                )

                .setFooter({
                    text:
                        "☁️ Venti • Cozy Corner 🍃"
                })

                .setTimestamp()
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

                        .setLabel("Quay lại")

                        .setEmoji("↩️")

                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ]
    });
}

// ======================================
// 🛒 BUY MODAL
// ======================================

async function openBuyModal(
    interaction,
    category,
    itemId,
    userId
) {

    if (category !== "seeds") {

        return buyItem(
            interaction,
            category,
            itemId,
            userId,
            1
        );
    }

    const item =
        Item.get(itemId);

    if (!item) {

        return interaction.reply({
            content:
                "🍃 Hạt giống không còn bán.",
            ephemeral: true
        });
    }

    const bought =
        getBoughtCount(
            userId,
            itemId
        );

    const remaining =
        Math.max(
            0,
            SEED_PURCHASE_LIMIT -
                bought
        );

    if (remaining <= 0) {

        return interaction.reply({
            content:
                "🔒 Bạn đã mua đủ 5 hạt loại này.",
            ephemeral: true
        });
    }

    const modal =
        new ModalBuilder()

            .setCustomId(
                `shop_quantity_${userId}_${itemId}`
            )

            .setTitle(
                `🛒 Mua ${item.name}`
            );

    const quantityInput =
        new TextInputBuilder()

            .setCustomId("quantity")

            .setLabel(
                `Số lượng (1-${remaining})`
            )

            .setPlaceholder(
                `Nhập số lượng từ 1 đến ${remaining}`
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setRequired(true)

            .setMinLength(1)

            .setMaxLength(2);

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(quantityInput)
    );

    return interaction.showModal(modal);
}

// ======================================
// 🛒 BUY ITEM
// ======================================

async function buyItem(
    interaction,
    category,
    itemId,
    userId,
    quantity = 1
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

    quantity = Number(quantity);

    if (
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {

        return interaction.reply({
            content:
                "❌ Số lượng không hợp lệ.",
            ephemeral: true
        });
    }

    if (category === "seeds") {

        const bought =
            getBoughtCount(
                userId,
                item.id
            );

        const remaining =
            Math.max(
                0,
                SEED_PURCHASE_LIMIT -
                    bought
            );

        if (quantity > remaining) {

            return interaction.reply({
                content:
                    `🌱 Bạn chỉ có thể mua thêm **${remaining} hạt** loại này.`,
                ephemeral: true
            });
        }
    }

    const price =
        getPrice(item);

    const total =
        price * quantity;

    const user =
        User.getOrCreate(userId);

    const balance =
        Number(user?.balance || 0);

    if (balance < total) {

        return interaction.reply({

            content:
                [
                    "💸 **Không đủ Mora.**",
                    "",
                    `> Giá: **${price.toLocaleString()} Mora / hạt**`,
                    `> Số lượng: **${quantity}**`,
                    `> Tổng: **${total.toLocaleString()} Mora**`,
                    `> Bạn có: **${balance.toLocaleString()} Mora**`
                ].join("\n"),

            ephemeral: true
        });
    }

    if (category === "plots") {

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
            total
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
            quantity
        );

        if (category === "seeds") {

            increaseBoughtCount(
                userId,
                item.id,
                quantity
            );
        }

    } catch (error) {

        addBalance(
            userId,
            total
        );

        throw error;
    }

    const emoji =
        safeEmoji(item.emoji);

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

    const response = {

        embeds: [

            new EmbedBuilder()

                .setColor("#A8DCC0")

                .setAuthor({
                    name:
                        "☁️ Venti · Shop"
                })

                .setTitle(
                    "♡ Mua Thành Công"
                )

                .setDescription(

                    [
                        "☁️ `🍃` **Giao dịch hoàn tất**",
                        "",
                        `- \`${emoji}\` **Sản phẩm:** ${item.name}`,
                        `- \`🛒\` **Số lượng:** ${quantity}`,
                        `- \`💰\` **Đơn giá:** ${price.toLocaleString()} Mora`,
                        `- \`💸\` **Tổng tiền:** ${total.toLocaleString()} Mora`,
                        "",
                        category === "seeds"
                            ? `- \`🌱\` **Có thể mua thêm:** ${remaining}/${SEED_PURCHASE_LIMIT} hạt`
                            : "",
                        "",
                        "🎒 **Đã thêm vào Inventory.**",
                        "",
                        "☕ `🍃` **Cảm ơn bạn đã ghé shop của Venti.**"
                    ]
                        .filter(Boolean)
                        .join("\n")
                )

                .setFooter({
                    text:
                        "☁️ Venti • Cozy Corner 🍃"
                })

                .setTimestamp()
        ],

        components: [
            homeButton(userId)
        ]
    };

    if (interaction.isModalSubmit()) {
        return interaction.reply(response);
    }

    return interaction.update(response);
}

// ======================================
// 🟫 BUY PLOT
// ======================================

async function buyPlot(
    interaction,
    item,
    price,
    userId
) {

    const farm =
        User.getFarm(userId);

    if (
        !farm ||
        !Array.isArray(farm.plots)
    ) {

        return interaction.reply({
            content:
                "🍃 Không tìm thấy trang trại.",
            ephemeral: true
        });
    }

    const plotId =
        Number(item.id);

    const existing =
        farm.plots.find(
            plot =>
                Number(plot.id) ===
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

        existing.unlocked = true;

    } else {

        farm.plots.push({

            id: plotId,

            unlocked: true,

            seed: null,

            plantedAt: null,

            readyAt: null
        });
    }

    User.updateFarm(
        userId,
        farm
    );

    const response = {

        embeds: [

            new EmbedBuilder()

                .setColor("#A8DCC0")

                .setAuthor({
                    name:
                        "☁️ Venti · Farm"
                })

                .setTitle(
                    "🟫 Mở Đất Thành Công"
                )

                .setDescription(

                    [
                        "☁️ `🍃` **Trang trại đã được mở rộng.**",
                        "",
                        `- \`🟫\` **Ô đất:** #${plotId}`,
                        `- \`💰\` **Đã trả:** ${price.toLocaleString()} Mora`,
                        "",
                        "♡ Chúc bạn có một mùa vụ thật tốt.",
                        "",
                        "☕ `🍃` **Hãy bắt đầu gieo trồng nhé.**"
                    ].join("\n")
                )

                .setFooter({
                    text:
                        "☁️ Venti • Cozy Corner 🍃"
                })

                .setTimestamp()
        ],

        components: [
            homeButton(userId)
        ]
    };

    if (interaction.isModalSubmit()) {
        return interaction.reply(response);
    }

    return interaction.update(response);
}

// ======================================
// 🎒 INVENTORY
// ======================================

function addInventoryItem(
    userId,
    itemId,
    amount
) {

    if (
        Item &&
        typeof Item.add === "function"
    ) {

        return Item.add(
            userId,
            itemId,
            amount
        );
    }

    if (
        User &&
        typeof User.addItem === "function"
    ) {

        return User.addItem(
            userId,
            itemId,
            amount
        );
    }

    const user =
        User.getOrCreate(userId);

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

        return User.update(
            userId,
            { inventory }
        );
    }

    if (
        typeof User.updateUser ===
        "function"
    ) {

        return User.updateUser(
            userId,
            { inventory }
        );
    }

    throw new Error(
        "Không tìm thấy hàm thêm item vào inventory."
    );
}

// ======================================
// 💸 REMOVE BALANCE
// ======================================

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
        User.getOrCreate(userId);

    const balance =
        Number(user.balance || 0);

    if (balance < amount) {
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
                balance: newBalance
            }
        );

        return true;
    }

    user.balance = newBalance;

    return true;
}

// ======================================
// 💰 ADD BALANCE
// ======================================

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
        Number(user.balance || 0);

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
                balance: newBalance
            }
        );
    }

    user.balance = newBalance;

    return true;
}

// ======================================
// 🏠 HOME BUTTON
// ======================================

function homeButton(userId) {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()

                .setCustomId(
                    `shop_home_${userId}`
                )

                .setLabel("Trang chủ")

                .setEmoji("🏠")

                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

// ======================================
// 💰 PRICE
// ======================================

function getPrice(item) {

    return Number(
        item.price ??
        item.buyPrice ??
        0
    );
}

// ======================================
// 💾 SAVE
// ======================================

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
                [field]: value
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
                [field]: value
            }
        );
    }

    const user =
        User.getOrCreate(userId);

    user[field] = value;

    return true;
}

// ======================================
// 🛒 PURCHASE COUNT
// ======================================

function getBoughtMap(userId) {

    const user =
        User.getOrCreate(userId);

    return {
        ...(user.seedShopBought || {})
    };
}

function getBoughtCount(
    userId,
    itemId
) {

    const map =
        getBoughtMap(userId);

    return Number(
        map[itemId] || 0
    );
}

function increaseBoughtCount(
    userId,
    itemId,
    amount
) {

    const map =
        getBoughtMap(userId);

    map[itemId] =
        Number(map[itemId] || 0) +
        Number(amount);

    saveUserField(
        userId,
        "seedShopBought",
        map
    );

    return map[itemId];
}

// ======================================
// 🔄 REFRESH SHOP
// ======================================

async function refreshShop(
    interaction,
    userId
) {

    const user =
        User.getOrCreate(userId);

    const balance =
        Number(user?.balance || 0);

    if (balance < REFRESH_PRICE) {

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

    refreshSeedShop(userId);

    return showCategory(
        interaction,
        "seeds",
        userId
    );
}

// ======================================
// 📤 EXPORT
// ======================================

module.exports = {

    ...command,

    async buyItemFromModal(
        interaction,
        itemId,
        userId,
        quantity
    ) {

        return buyItem(
            interaction,
            "seeds",
            itemId,
            userId,
            quantity
        );
    }
};