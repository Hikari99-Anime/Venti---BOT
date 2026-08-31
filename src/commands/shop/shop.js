const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const User = require("../../database/models/User");
const Item = require("../../database/models/Item");

const PLOTS = [
    {
        id: 2,
        name: "Ô đất #2",
        emoji: "🟫",
        price: 1000
    },
    {
        id: 3,
        name: "Ô đất #3",
        emoji: "🟫",
        price: 3000
    },
    {
        id: 4,
        name: "Ô đất #4",
        emoji: "🟫",
        price: 7500
    },
    {
        id: 5,
        name: "Ô đất #5",
        emoji: "🟫",
        price: 15000
    },
    {
        id: 6,
        name: "Ô đất #6",
        emoji: "🟫",
        price: 30000
    },
    {
        id: 7,
        name: "Ô đất #7",
        emoji: "🟫",
        price: 60000
    }
];

module.exports = {
    name: "shop",
    aliases: ["vshop"],
    description: "Cửa hàng của Venti.",

    async execute(message) {
        const userId = message.author.id;

        User.getOrCreate(userId);

        let category = null;
        let selectedItem = null;

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("🛒 Venti Shop")
            .setDescription(
                "Chào mừng đến cửa hàng của Venti!\n\n" +
                "Chọn danh mục bên dưới."
            )
            .addFields(
                {
                    name: "🌱 Hạt giống",
                    value: "Mua hạt giống để trồng.",
                    inline: true
                },
                {
                    name: "🎣 Cần câu",
                    value: "Mua và nâng cấp cần câu.",
                    inline: true
                },
                {
                    name: "🟫 Đất",
                    value: "Mở rộng trang trại.",
                    inline: true
                }
            );

        const msg = await message.reply({
            embeds: [embed],
            components: [categoryMenu(userId)]
        });

        const collector = msg.createMessageComponentCollector({
            time: 120000
        });

        collector.on("collect", async interaction => {
            if (interaction.user.id !== userId) {
                return interaction.reply({
                    content: "❌ Đây không phải shop của bạn.",
                    ephemeral: true
                });
            }

            try {
                // =========================
                // CATEGORY
                // =========================

                if (
                    interaction.customId ===
                    `shop_category_${userId}`
                ) {
                    category = interaction.values[0];

                    return showCategory(
                        interaction,
                        category,
                        userId
                    );
                }

                // =========================
                // ITEM
                // =========================

                if (
                    interaction.customId ===
                    `shop_item_${userId}`
                ) {
                    selectedItem = interaction.values[0];

                    return showItem(
                        interaction,
                        category,
                        selectedItem,
                        userId
                    );
                }

                // =========================
                // BUY
                // =========================

                if (
                    interaction.customId ===
                    `shop_buy_${userId}`
                ) {
                    return buyItem(
                        interaction,
                        category,
                        selectedItem,
                        userId
                    );
                }

                // =========================
                // HOME
                // =========================

                if (
                    interaction.customId ===
                    `shop_home_${userId}`
                ) {
                    return interaction.update({
                        embeds: [embed],
                        components: [
                            categoryMenu(userId)
                        ]
                    });
                }

                // =========================
                // BACK
                // =========================

                if (
                    interaction.customId ===
                    `shop_back_${userId}`
                ) {
                    return showCategory(
                        interaction,
                        category,
                        userId
                    );
                }
            } catch (error) {
                console.error(
                    "Vshop error:",
                    error
                );

                if (!interaction.replied) {
                    return interaction.reply({
                        content:
                            "❌ Có lỗi xảy ra trong shop.",
                        ephemeral: true
                    });
                }
            }
        });

        collector.on("end", async () => {
            try {
                await msg.edit({
                    components: []
                });
            } catch {}
        });
    }
};

// ========================================
// 🛒 CATEGORY MENU
// ========================================

function categoryMenu(userId) {
    return new ActionRowBuilder().addComponents(
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
                        "Mua hạt giống trồng cây",
                    value: "seeds",
                    emoji: "🌱"
                },
                {
                    label: "Cần câu",
                    description:
                        "Mua cần câu",
                    value: "rods",
                    emoji: "🎣"
                },
                {
                    label: "Đất trang trại",
                    description:
                        "Mở khóa ô đất",
                    value: "plots",
                    emoji: "🟫"
                }
            ])
    );
}

// ========================================
// 📦 GET CATEGORY ITEMS
// ========================================

function getCategoryItems(category, userId) {
    if (category === "seeds") {
        return Item.getAll().filter(
            item => item.category === "seed"
        );
    }

    if (category === "rods") {
        return Item.getAll().filter(
            item => item.category === "rod"
        );
    }

    if (category === "plots") {
        const farm = User.getFarm(userId);

        const unlocked = farm.plots
            .filter(plot => plot.unlocked)
            .map(plot => Number(plot.id));

        return PLOTS.filter(
            plot =>
                !unlocked.includes(
                    Number(plot.id)
                )
        );
    }

    return [];
}

// ========================================
// 📋 SHOW CATEGORY
// ========================================

async function showCategory(
    interaction,
    category,
    userId
) {
    const items = getCategoryItems(
        category,
        userId
    );

    if (!items.length) {
        return interaction.reply({
            content:
                "❌ Không còn sản phẩm nào trong danh mục này.",
            ephemeral: true
        });
    }

    const options = items
        .slice(0, 25)
        .map(item => {
            const price = Number(
                item.price ??
                item.buyPrice ??
                0
            );

            return {
                label: item.name,
                description:
                    `${price.toLocaleString()} Mora`,
                value: String(item.id),
                emoji:
                    item.emoji || "📦"
            };
        });

    let title = "🛒 Shop";

    if (category === "seeds") {
        title = "🌱 Hạt giống";
    }

    if (category === "rods") {
        title = "🎣 Cần câu";
    }

    if (category === "plots") {
        title = "🟫 Đất trang trại";
    }

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle(title)
                .setDescription(
                    "Chọn sản phẩm bạn muốn mua:"
                )
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `shop_item_${userId}`
                    )
                    .setPlaceholder(
                        "📦 Chọn sản phẩm..."
                    )
                    .addOptions(options)
            ),

            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `shop_home_${userId}`
                    )
                    .setLabel("Trang chủ")
                    .setEmoji("🏠")
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            )
        ]
    });
}

// ========================================
// 🔍 SHOW ITEM
// ========================================

async function showItem(
    interaction,
    category,
    itemId,
    userId
) {
    const items = getCategoryItems(
        category,
        userId
    );

    const item = items.find(
        x =>
            String(x.id) ===
            String(itemId)
    );

    if (!item) {
        return interaction.reply({
            content:
                "❌ Sản phẩm không tồn tại.",
            ephemeral: true
        });
    }

    const price = Number(
        item.price ??
        item.buyPrice ??
        0
    );

    const user =
        User.getOrCreate(userId);

    const balance = Number(
        user.balance || 0
    );

    const canBuy =
        balance >= price;

    const itemEmbed =
        new EmbedBuilder()
            .setColor(
                canBuy
                    ? "#57F287"
                    : "#ED4245"
            )
            .setTitle(
                `${item.emoji || "📦"} ${item.name}`
            )
            .setDescription(
                item.description ||
                "Vật phẩm trong Venti Shop."
            )
            .addFields(
                {
                    name: "💰 Giá",
                    value:
                        `${price.toLocaleString()} Mora`,
                    inline: true
                },
                {
                    name: "💳 Mora hiện có",
                    value:
                        `${balance.toLocaleString()} Mora`,
                    inline: true
                }
            );

    if (
        category === "seeds" &&
        item.growTime
    ) {
        itemEmbed.addFields({
            name: "⏳ Thời gian lớn",
            value:
                formatTime(
                    item.growTime
                ),
            inline: true
        });
    }

    if (
        category === "rods" &&
        item.rodLevel
    ) {
        itemEmbed.addFields({
            name: "⭐ Cấp cần",
            value:
                `Level ${item.rodLevel}`,
            inline: true
        });
    }

    return interaction.update({
        embeds: [itemEmbed],
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `shop_buy_${userId}`
                    )
                    .setLabel("Mua")
                    .setEmoji("💰")
                    .setStyle(
                        ButtonStyle.Success
                    )
                    .setDisabled(!canBuy),

                new ButtonBuilder()
                    .setCustomId(
                        `shop_back_${userId}`
                    )
                    .setLabel("Quay lại")
                    .setEmoji("⬅️")
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            )
        ]
    });
}

// ========================================
// 💰 BUY
// ========================================

async function buyItem(
    interaction,
    category,
    itemId,
    userId
) {
    const items = getCategoryItems(
        category,
        userId
    );

    const item = items.find(
        x =>
            String(x.id) ===
            String(itemId)
    );

    if (!item) {
        return interaction.reply({
            content:
                "❌ Sản phẩm không tồn tại.",
            ephemeral: true
        });
    }

    const price = Number(
        item.price ??
        item.buyPrice ??
        0
    );

    const user =
        User.getOrCreate(userId);

    const balance = Number(
        user.balance || 0
    );

    if (balance < price) {
        return interaction.reply({
            content:
                "❌ Bạn không đủ Mora.",
            ephemeral: true
        });
    }

    // ====================================
    // 🟫 BUY PLOT
    // ====================================

    if (category === "plots") {
        const farm =
            User.getFarm(userId);

        const plotId =
            Number(item.id);

        const existing =
            farm.plots.find(
                plot =>
                    Number(plot.id) ===
                    plotId
            );

        if (existing?.unlocked) {
            return interaction.reply({
                content:
                    "❌ Ô đất này đã được mở.",
                ephemeral: true
            });
        }

        User.removeBalance(
            userId,
            price
        );

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

        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor("#57F287")
                    .setTitle(
                        "🟫 Mua đất thành công!"
                    )
                    .setDescription(
                        `Bạn đã mở khóa **Ô đất #${plotId}**!`
                    )
                    .addFields({
                        name: "💰 Đã trả",
                        value:
                            `-${price.toLocaleString()} Mora`
                    })
            ],
            components: []
        });
    }

    // ====================================
    // 🌱 / 🎣 BUY ITEM
    // ====================================

    User.removeBalance(
        userId,
        price
    );

    User.addItem(
        userId,
        item.id,
        1
    );

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor("#57F287")
                .setTitle(
                    "✅ Mua thành công!"
                )
                .setDescription(
                    `${item.emoji || "📦"} **${item.name}**`
                )
                .addFields({
                    name: "💰 Đã trả",
                    value:
                        `-${price.toLocaleString()} Mora`
                })
                .setFooter({
                    text:
                        "Vật phẩm đã được thêm vào inventory."
                })
        ],
        components: []
    });
}

// ========================================
// ⏳ TIME
// ========================================

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

    const remain =
        seconds % 60;

    if (remain === 0) {
        return `${minutes} phút`;
    }

    return `${minutes} phút ${remain} giây`;
}
