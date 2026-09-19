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

const Quest =
    require("../../database/models/Quest");

const Item =
    require("../../database/models/Item");

// =====================================================
// 🍃 VENTI FARM
// =====================================================

const COLORS = {
    primary: 0xA8DCC0,
    success: 0xA8D8A8,
    warning: 0xFFD166,
    error: 0xF2A7A7,
    blue: 0xA8CFF0
};

const MAX_PLOTS = 10;
const DEFAULT_UNLOCKED_PLOTS = 1;
const COLLECTOR_TIME = 120000;

// =====================================================
// 👤 USER
// =====================================================

function ensureUser(userId) {
    const user = User.getOrCreate(userId);

    if (!user) {
        throw new Error("Không thể tạo user.");
    }

    return user;
}

// =====================================================
// 🌱 DEFAULT FARM
// =====================================================

function createDefaultFarm() {
    return {
        plots: Array.from(
            { length: MAX_PLOTS },
            (_, index) => ({
                id: index + 1,
                unlocked:
                    index < DEFAULT_UNLOCKED_PLOTS,
                tilled: false,
                seed: null,
                plantedAt: null,
                readyAt: null,
                watered: false
            })
        )
    };
}

// =====================================================
// 🧹 NORMALIZE FARM
// =====================================================

function normalizeFarm(farm) {
    if (!farm || typeof farm !== "object") {
        return createDefaultFarm();
    }

    if (!Array.isArray(farm.plots)) {
        farm.plots = [];
    }

    const normalized = [];

    for (let i = 1; i <= MAX_PLOTS; i++) {
        const oldPlot = farm.plots.find(
            plot =>
                Number(plot.id) === i
        );

        if (oldPlot) {
            normalized.push({
                id: i,

                unlocked:
                    Boolean(oldPlot.unlocked) ||
                    i <= DEFAULT_UNLOCKED_PLOTS,

                tilled:
                    Boolean(oldPlot.tilled),

                seed:
                    oldPlot.seed || null,

                plantedAt:
                    oldPlot.plantedAt || null,

                readyAt:
                    oldPlot.readyAt || null,

                watered:
                    Boolean(oldPlot.watered)
            });
        } else {
            normalized.push({
                id: i,

                unlocked:
                    i <= DEFAULT_UNLOCKED_PLOTS,

                tilled: false,
                seed: null,
                plantedAt: null,
                readyAt: null,
                watered: false
            });
        }
    }

    normalized[0].unlocked = true;

    farm.plots = normalized;

    return farm;
}

// =====================================================
// 🌾 GET FARM
// =====================================================

function getFarm(userId) {
    ensureUser(userId);

    let farm = User.getFarm(userId);

    if (!farm) {
        farm = createDefaultFarm();

        User.updateFarm(
            userId,
            farm
        );

        return farm;
    }

    const before =
        JSON.stringify(farm);

    farm =
        normalizeFarm(farm);

    const after =
        JSON.stringify(farm);

    if (before !== after) {
        User.updateFarm(
            userId,
            farm
        );
    }

    return farm;
}

// =====================================================
// 🎒 INVENTORY
// =====================================================

function getInventory(userId) {
    const user =
        ensureUser(userId);

    return user.inventory || {};
}

// =====================================================
// 🔢 ITEM AMOUNT
// =====================================================

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

// =====================================================
// 🌱 CHECK IS SEED
// =====================================================

function isSeedItem(item) {
    if (!item || !item.id) {
        return false;
    }

    /*
     * Hạt giống (category: "seed") là item riêng biệt
     * với nông sản thu hoạch (category: "farming").
     * Mỗi hạt giống có "cropId" trỏ tới nông sản mà
     * nó trồng ra (xem items.js).
     */

    return (
        item.category === "seed" ||
        item.type === "seed" ||
        item.itemType === "seed"
    );
}

// =====================================================
// 🌱 GET SEEDS
// =====================================================

function getSeeds(userId) {
    const inventory =
        getInventory(userId);

    const allItems =
        Item.getAll();

    return allItems.filter(item => {
        if (!isSeedItem(item)) {
            return false;
        }

        const amount =
            getAmount(
                inventory[item.id]
            );

        return amount > 0;
    });
}

// =====================================================
// ⛏️ NÔNG CỤ (CUỐC / BÌNH TƯỚI / NƯỚC)
// =====================================================

function hasHoe(userId) {
    const inventory =
        getInventory(userId);

    return (
        getAmount(inventory.hoe) > 0
    );
}

function hasWateringCan(userId) {
    const inventory =
        getInventory(userId);

    return (
        getAmount(
            inventory.watering_can
        ) > 0
    );
}

function getWaterAmount(userId) {
    const inventory =
        getInventory(userId);

    return getAmount(
        inventory.water
    );
}

// =====================================================
// ⭐ RATING (SAO NÔNG SẢN)
// =====================================================

function ratingStars(rating) {
    const value =
        Math.max(
            1,
            Math.min(
                5,
                Number(rating || 1)
            )
        );

    return (
        "⭐".repeat(value) +
        "☆".repeat(5 - value)
    );
}

// =====================================================
// ➖ REMOVE ITEM
// =====================================================

function removeItem(
    userId,
    itemId,
    amount = 1
) {
    const user =
        ensureUser(userId);

    const inventory = {
        ...(user.inventory || {})
    };

    const current =
        getAmount(
            inventory[itemId]
        );

    if (current < amount) {
        return false;
    }

    const newAmount =
        current - amount;

    if (newAmount <= 0) {
        delete inventory[itemId];
    } else {
        /*
         * Giữ dạng number vì inventory
         * hiện tại của bạn dùng số lượng trực tiếp.
         */
        inventory[itemId] =
            newAmount;
    }

    User.update(
        userId,
        {
            inventory
        }
    );

    return true;
}

// =====================================================
// ➕ ADD ITEM
// =====================================================

function addItem(
    userId,
    itemId,
    amount = 1
) {
    return User.addItem(
        userId,
        itemId,
        amount
    );
}

// =====================================================
// 🔎 GET PLOT
// =====================================================

function getPlot(
    farm,
    plotId
) {
    return farm.plots.find(
        plot =>
            Number(plot.id) ===
            Number(plotId)
    );
}

// =====================================================
// ⏱️ FORMAT TIME
// =====================================================

function formatTime(ms) {
    let seconds =
        Math.max(
            0,
            Math.floor(
                Number(ms || 0) / 1000
            )
        );

    const days =
        Math.floor(
            seconds / 86400
        );

    seconds %= 86400;

    const hours =
        Math.floor(
            seconds / 3600
        );

    seconds %= 3600;

    const minutes =
        Math.floor(
            seconds / 60
        );

    seconds %= 60;

    const parts = [];

    if (days) {
        parts.push(
            `${days} ngày`
        );
    }

    if (hours) {
        parts.push(
            `${hours} giờ`
        );
    }

    if (minutes) {
        parts.push(
            `${minutes} phút`
        );
    }

    if (
        seconds ||
        !parts.length
    ) {
        parts.push(
            `${seconds} giây`
        );
    }

    return parts.join(" ");
}

// =====================================================
// 🧩 HELPERS
// =====================================================

function text(content) {
    return new TextDisplayBuilder()
        .setContent(content);
}

function separator() {
    return new SeparatorBuilder();
}

// =====================================================
// 🌱 GET PLOT STATUS
// =====================================================

function getPlotStatus(plot) {
    if (!plot || !plot.unlocked) {
        return {
            emoji: "🔒",
            label: "Chưa mở",
            description:
                "Ô đất chưa được mở."
        };
    }

    if (!plot.seed) {
        if (!plot.tilled) {
            return {
                emoji: "🟤",
                label: "Chưa cày",
                description:
                    "Cần cày đất trước khi trồng."
            };
        }

        return {
            emoji: "🟫",
            label: "Đất trống",
            description:
                "Có thể trồng cây."
        };
    }

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    const remaining =
        readyAt - Date.now();

    if (remaining <= 0) {
        return {
            emoji: "🌾",
            label: "Sẵn sàng",
            description:
                "Cây đã trưởng thành."
        };
    }

    const seed =
        Item.get(plot.seed);

    return {
        emoji:
            seed?.emoji ||
            "🌱",

        label:
            seed?.name ||
            "Đang trồng",

        description:
            `Còn ${formatTime(
                remaining
            )}`
    };
}

// =====================================================
// 🏠 HOME PANEL
// =====================================================

function farmPanel(
    userId,
    author
) {
    const farm =
        getFarm(userId);

    const authorName =
        author?.globalName ||
        author?.username ||
        "Nông dân";

    const unlocked =
        farm.plots.filter(
            plot =>
                plot.unlocked
        );

    const plotLines =
        unlocked.map(plot => {
            const status =
                getPlotStatus(plot);

            return (
                `> **\`#${plot.id}\`** ` +
                `${status.emoji} ` +
                `**${status.label}**` +
                ` · ${status.description}`
            );
        });

    const emptyCount =
        unlocked.filter(
            plot =>
                !plot.seed
        ).length;

    const readyCount =
        unlocked.filter(
            plot =>
                plot.seed &&
                Number(
                    plot.readyAt || 0
                ) <= Date.now()
        ).length;

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.primary
            )

            .addTextDisplayComponents(
                text(
                    [
                        "# 🍃 Trang Trại Columbina",
                        `☁️ **${authorName}** · Windrise`,
                        "",
                        "> 🌱 Chăm cây · ⏳ Chờ lớn · 🌾 Thu hoạch"
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                text(
                    [
                        "### 📊 Tổng quan",
                        `> 🌱 Ô đất: **${unlocked.length}/${MAX_PLOTS}**`,
                        `> 🟫 Đất trống: **${emptyCount}**`,
                        `> 🌾 Sẵn sàng thu hoạch: **${readyCount}**`
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                text(
                    [
                        "### 🌱 Các ô đất",
                        "",
                        plotLines.length
                            ? plotLines.join("\n")
                            : "> ❌ Chưa có ô đất."
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                text(
                    "### 🪴 Chọn ô đất\n> Chọn một ô đất bên dưới để xem trạng thái hoặc trồng cây."
                )
            )

            .addActionRowComponents(
                plotMenu(userId)
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                `farm_quick_harvest_${userId}`
                            )
                            .setLabel(
                                "Thu hoạch tất cả"
                            )
                            .setEmoji("🌾")
                            .setStyle(
                                ButtonStyle.Success
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                `farm_refresh_${userId}`
                            )
                            .setLabel(
                                "Làm mới"
                            )
                            .setEmoji("🔄")
                            .setStyle(
                                ButtonStyle.Secondary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                `farm_close_${userId}`
                            )
                            .setLabel(
                                "Đóng"
                            )
                            .setEmoji("✖️")
                            .setStyle(
                                ButtonStyle.Danger
                            )
                    )
            );

    return container;
}

// =====================================================
// 📋 PLOT MENU
// =====================================================

function plotMenu(userId) {
    const farm =
        getFarm(userId);

    const plots =
        farm.plots.filter(
            plot =>
                plot.unlocked
        );

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `farm_plot_${userId}`
            )
            .setPlaceholder(
                "🪴 Chọn ô đất..."
            )
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                plots.map(plot => {
                    const status =
                        getPlotStatus(plot);

                    return {
                        label:
                            `Ô đất #${plot.id}`,

                        description:
                            String(
                                status.description
                            ).slice(
                                0,
                                100
                            ),

                        value:
                            String(plot.id),

                        emoji:
                            status.emoji
                    };
                })
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

// =====================================================
// ◀️ BACK
// =====================================================

function backButton(userId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `farm_home_${userId}`
                )
                .setLabel(
                    "Về trang trại"
                )
                .setEmoji("🍃")
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

// =====================================================
// 🌱 EMPTY PLOT PANEL
// =====================================================

function emptyPlotPanel(
    userId,
    plot
) {
    const seeds =
        getSeeds(userId);

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.primary
            )

            .addTextDisplayComponents(
                text(
                    [
                        `# 🪴 Ô đất #${plot.id}`,
                        plot.tilled
                            ? "> 🟫 **Đất trống**"
                            : "> 🟤 **Đất chưa cày**"
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            );

    // ================================================
    // 🟤 CHƯA CÀY ĐẤT
    // ================================================

    if (!plot.tilled) {
        const owned =
            hasHoe(userId);

        container
            .addTextDisplayComponents(
                text(
                    [
                        "### ⛏️ Cày đất",
                        owned
                            ? "> Đất này cần được cày trước khi trồng cây."
                            : "> ❌ Bạn chưa có **Cuốc**.",
                        owned
                            ? ""
                            : "> 🛍️ Hãy vào **Vshop** mục **Nông cụ** để mua Cuốc."
                    ]
                        .filter(Boolean)
                        .join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `farm_till_${userId}_${plot.id}`
                            )
                            .setLabel(
                                "Cày đất"
                            )
                            .setEmoji("⛏️")
                            .setStyle(
                                ButtonStyle.Success
                            )
                            .setDisabled(
                                !owned
                            )
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(userId)
            );

        return container;
    }

    if (!seeds.length) {
        container
            .addTextDisplayComponents(
                text(
                    [
                        "### 🌱 Hạt giống",
                        "> ❌ Bạn chưa có hạt giống nào.",
                        "",
                        "> 🛍️ Hãy vào **Vshop** để mua hạt giống."
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(userId)
            );

        return container;
    }

    const inventory =
        getInventory(userId);

    const seedLines =
        seeds.map(seed => {
            const amount =
                getAmount(
                    inventory[seed.id]
                );

            return (
                `> ${seed.emoji || "🌱"} ` +
                `**${seed.name}** ×${amount}`
            );
        });

    container
        .addTextDisplayComponents(
            text(
                [
                    "### 🌱 Hạt giống của bạn",
                    "",
                    seedLines.join("\n"),
                    "",
                    "> Chọn hạt giống bên dưới để trồng."
                ].join("\n")
            )
        )

        .addSeparatorComponents(
            separator()
        )

        .addActionRowComponents(
            seedMenu(
                userId,
                plot.id,
                seeds,
                inventory
            )
        )

        .addSeparatorComponents(
            separator()
        )

        .addActionRowComponents(
            backButton(userId)
        );

    return container;
}

// =====================================================
// 🌱 SEED MENU
// =====================================================

function seedMenu(
    userId,
    plotId,
    seeds,
    inventory
) {
    const options =
        seeds
            .slice(0, 25)
            .map(seed => {
                const amount =
                    getAmount(
                        inventory[seed.id]
                    );

                const crop =
                    Item.get(
                        seed.cropId ||
                        String(seed.id).replace(/_seed$/, "")
                    );

                const stars =
                    crop
                        ? `${crop.rating || 1}⭐ `
                        : "";

                return {
                    label:
                        String(
                            seed.name
                        ).slice(
                            0,
                            100
                        ),

                    description:
                        `${stars}Có ${amount} • Lớn trong ${formatTime(
                            Number(
                                seed.growTime ||
                                30000
                            )
                        )}`.slice(
                            0,
                            100
                        ),

                    value:
                        String(seed.id),

                    emoji:
                        seed.emoji ||
                        "🌱"
                };
            });

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `farm_seed_${userId}_${plotId}`
            )
            .setPlaceholder(
                "🌱 Chọn hạt giống để trồng..."
            )
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(options);

    return new ActionRowBuilder()
        .addComponents(menu);
}

// =====================================================
// 🌾 PLANTED PANEL
// =====================================================

function plantedPlotPanel(
    userId,
    plot,
    seed,
    crop,
    ready,
    now,
    readyAt
) {
    const remaining =
        Math.max(
            0,
            readyAt - now
        );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                ready
                    ? COLORS.success
                    : COLORS.primary
            )

            .addTextDisplayComponents(
                text(
                    [
                        `# ${seed.emoji || "🌱"} ${seed.name}`,
                        `> 🪴 Ô đất **#${plot.id}**`
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            );

    if (ready) {
        container.addTextDisplayComponents(
            text(
                [
                    "### 🌾 Trạng thái",
                    "> 🟢 **Cây đã trưởng thành!**",
                    "> Có thể thu hoạch ngay."
                ].join("\n")
            )
        );
    } else {
        container.addTextDisplayComponents(
            text(
                [
                    "### ⏳ Đang phát triển",
                    `> 🌱 Còn **${formatTime(
                        remaining
                    )}**`,
                    `> 🕐 Hoàn thành <t:${Math.floor(
                        readyAt / 1000
                    )}:R>`
                ].join("\n")
            )
        );
    }

    container.addSeparatorComponents(
        separator()
    );

    container.addTextDisplayComponents(
        text(
            [
                "### 🌾 Nông sản",
                crop
                    ? `> ${crop.emoji || "🌾"} **${crop.name}** · ${ratingStars(crop.rating)}`
                    : "> ❌ Không tìm thấy nông sản."
            ].join("\n")
        )
    );

    container.addSeparatorComponents(
        separator()
    );

    if (ready) {
        container.addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            `farm_harvest_${userId}_${plot.id}`
                        )
                        .setLabel(
                            "Thu hoạch"
                        )
                        .setEmoji("🌾")
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `farm_quick_harvest_${userId}`
                        )
                        .setLabel(
                            "Thu hoạch tất cả"
                        )
                        .setEmoji("⚡")
                        .setStyle(
                            ButtonStyle.Success
                        )
                )
        );
    } else {
        const canWater =
            !plot.watered &&
            hasWateringCan(userId) &&
            getWaterAmount(userId) > 0;

        container.addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `farm_refresh_${userId}`
                        )
                        .setLabel(
                            "Kiểm tra"
                        )
                        .setEmoji("🔄")
                        .setStyle(
                            ButtonStyle.Secondary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `farm_water_${userId}_${plot.id}`
                        )
                        .setLabel(
                            plot.watered
                                ? "Đã tưới"
                                : "Tưới nước"
                        )
                        .setEmoji("💧")
                        .setStyle(
                            ButtonStyle.Primary
                        )
                        .setDisabled(
                            !canWater
                        )
                )
        );

        if (
            !plot.watered &&
            !hasWateringCan(userId)
        ) {
            container.addTextDisplayComponents(
                text(
                    "> ❌ Bạn chưa có **Bình tưới**. Hãy vào **Vshop** mục **Nông cụ** để mua."
                )
            );
        } else if (
            !plot.watered &&
            getWaterAmount(userId) <= 0
        ) {
            container.addTextDisplayComponents(
                text(
                    "> ❌ Bạn đã hết **Nước**. Hãy vào **Vshop** mục **Nông cụ** để mua thêm."
                )
            );
        }
    }

    container
        .addSeparatorComponents(
            separator()
        )
        .addActionRowComponents(
            backButton(userId)
        );

    return container;
}
// =====================================================
// ❌ ERROR PANEL
// =====================================================

function errorPanel(
    title,
    description,
    userId
) {
    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.error
            )

            .addTextDisplayComponents(
                text(
                    `# ❌ ${title}`
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                text(description)
            );

    if (userId) {
        container
            .addSeparatorComponents(
                separator()
            )
            .addActionRowComponents(
                backButton(userId)
            );
    }

    return container;
}

// =====================================================
// 🌱 SHOW PLOT
// =====================================================

async function showPlot(
    interaction,
    userId,
    plotId
) {
    const farm =
        getFarm(userId);

    const plot =
        getPlot(
            farm,
            plotId
        );

    if (
        !plot ||
        !plot.unlocked
    ) {
        return interaction.reply({
            content:
                "`❌` Ô đất không tồn tại hoặc chưa mở.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    // ================================================
    // 🟫 EMPTY
    // ================================================

    if (!plot.seed) {
        return interaction.update({
            components: [
                emptyPlotPanel(
                    userId,
                    plot
                )
            ],
            flags:
                MessageFlags.IsComponentsV2
        });
    }

    // ================================================
    // 🌱 PLANTED
    // ================================================

    const seed =
        Item.get(plot.seed);

    if (!seed) {
        return interaction.update({
            components: [
                errorPanel(
                    "Không tìm thấy hạt giống",
                    "> Dữ liệu cây trồng trong farm không còn tồn tại.",
                    userId
                )
            ],
            flags:
                MessageFlags.IsComponentsV2
        });
    }

    const now =
        Date.now();

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    const ready =
        now >= readyAt;

    const cropId =
        seed.cropId ||
        seed.seedType ||
        String(seed.id)
            .replace(
                /_seed$/,
                ""
            );

    const crop =
        Item.get(cropId);

    return interaction.update({
        components: [
            plantedPlotPanel(
                userId,
                plot,
                seed,
                crop,
                ready,
                now,
                readyAt
            )
        ],
        flags:
            MessageFlags.IsComponentsV2
    });
}

// =====================================================
// 🎲 RANDOM
// =====================================================

function randomInt(
    min,
    max
) {
    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}

// =====================================================
// 📊 CẬP NHẬT THỐNG KÊ
// =====================================================

function updateHarvestStats(
    userId,
    amount
) {
    const user =
        ensureUser(userId);

    const stats = {
        ...(user.stats || {})
    };

    stats.farm =
        Number(stats.farm || 0) +
        Number(amount || 0);

    User.update(
        userId,
        {
            stats
        }
    );
}

// =====================================================
// 🌾 HARVEST INTERNAL
// =====================================================

function harvestPlot(
    userId,
    farm,
    plot
) {
    if (
        !plot ||
        !plot.unlocked ||
        !plot.seed
    ) {
        return null;
    }

    const now =
        Date.now();

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    if (now < readyAt) {
        return null;
    }

    const seed =
        Item.get(plot.seed);

    if (!seed) {
        return null;
    }

    const cropId =
        seed.cropId ||
        seed.seedType ||
        String(seed.id)
            .replace(
                /_seed$/,
                ""
            );

    const crop =
        Item.get(cropId);

    if (!crop) {
        return null;
    }

    const min =
        Math.max(
            1,
            Number(
                seed.minHarvest || 1
            )
        );

    const max =
        Math.max(
            min,
            Number(
                seed.maxHarvest || min
            )
        );

    const amount =
        randomInt(
            min,
            max
        );

    addItem(
        userId,
        crop.id,
        amount
    );

    // ================================================
    // 🌱 TỶ LỆ RA HẠT GIỐNG
    //
    // Mỗi lần thu hoạch có 30% cơ hội
    // nhận thêm 1 hạt giống cùng loại.
    // ================================================

    const bonusSeed =
        Math.random() < 0.3;

    if (bonusSeed) {
        addItem(
            userId,
            seed.id,
            1
        );
    }

    plot.tilled = false;
    plot.seed = null;
    plot.plantedAt = null;
    plot.readyAt = null;
    plot.watered = false;

    return {
        crop,
        seed,
        amount,
        bonusSeed
    };
}

// =====================================================
// 🌾 SINGLE HARVEST
// =====================================================

async function harvest(
    interaction,
    userId,
    plotId
) {
    const farm =
        getFarm(userId);

    const plot =
        getPlot(
            farm,
            plotId
        );

    if (
        !plot ||
        !plot.unlocked
    ) {
        return interaction.reply({
            content:
                "`❌` Ô đất không tồn tại.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (!plot.seed) {
        return interaction.reply({
            content:
                "`🟫` Ô đất này đang trống.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    const now =
        Date.now();

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    if (now < readyAt) {
        return interaction.reply({
            content:
                `\`⏳\` Cây chưa trưởng thành.\n> Còn **${formatTime(
                    readyAt - now
                )}**.`,
            flags:
                MessageFlags.Ephemeral
        });
    }

    const result =
        harvestPlot(
            userId,
            farm,
            plot
        );

    if (!result) {
        return interaction.reply({
            content:
                "`❌` Không thể thu hoạch cây này.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    User.updateFarm(
        userId,
        farm
    );

    updateHarvestStats(
        userId,
        result.amount
    );

    if (
        Quest &&
        typeof Quest.addProgress ===
            "function"
    ) {
        Quest.addProgress(
            userId,
            "farm",
            result.amount
        );
    }

    const sellPrice =
        Number(
            result.crop.sellPrice ||
            0
        );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.success
            )

            .addTextDisplayComponents(
                text(
                    "# 🌾 Thu hoạch thành công!"
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                text(
                    [
                        "### 🎒 Nông sản nhận được",
                        `> ${result.crop.emoji || "🌾"} **${result.crop.name} ×${result.amount}** · ${ratingStars(result.crop.rating)}`,
                        "",
                        "### 💰 Giá bán",
                        `> **${sellPrice.toLocaleString(
                            "vi-VN"
                        )} Mora / cái**`,
                        "",
                        "### 🌱 Hạt giống đã dùng",
                        `> ${result.seed.emoji || "🌱"} **${result.seed.name} ×1**`,
                        "",
                        ...(
                            result.bonusSeed
                                ? [
                                    "🎁 **May mắn!** Bạn nhận thêm **1 hạt giống** cùng loại.",
                                    ""
                                ]
                                : []
                        ),
                        "🎒 Nông sản đã được thêm vào inventory.",
                        "🟤 Ô đất cần được cày lại trước khi trồng vụ mới."
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(userId)
            );

    return interaction.update({
        components: [
            container
        ],
        flags:
            MessageFlags.IsComponentsV2
    });
}
// =====================================================
// 🌱 PLANT SEED
// =====================================================

async function plantSeed(
    interaction,
    userId,
    plotId,
    seedId
) {
    try {
        const farm =
            getFarm(userId);

        const plot =
            getPlot(
                farm,
                plotId
            );

        // ==========================================
        // 🪴 CHECK PLOT
        // ==========================================

        if (
            !plot ||
            !plot.unlocked
        ) {
            return interaction.reply({
                content:
                    "`❌` Ô đất chưa được mở.",
                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ==========================================
        // 🌱 CHECK PLOT EMPTY
        // ==========================================

        if (plot.seed) {
            return interaction.reply({
                content:
                    "`🌱` Ô đất này đang có cây.",
                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ==========================================
        // 🟤 CHECK TILLED
        // ==========================================

        if (!plot.tilled) {
            return interaction.reply({
                content:
                    "`🟤` Ô đất này chưa được cày. Hãy cày đất trước khi trồng cây.",
                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ==========================================
        // 🌱 GET ITEM
        // ==========================================

        const seed =
            Item.get(seedId);

        if (!seed) {
            console.log(
                "[farm] Invalid seed:",
                {
                    seedId,
                    reason:
                        "Item not found"
                }
            );

            return interaction.reply({
                content:
                    "`❌` Hạt giống không tồn tại.",
                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ==========================================
        // 🌱 VALIDATE SEED
        //
        // Chỉ item category: "seed" mới trồng được.
        // ==========================================

        const isSeed =
            isSeedItem(seed);

        if (!isSeed) {
            console.log(
                "[farm] Invalid seed:",
                {
                    seedId,
                    seed,
                    reason:
                        "Not a farming seed"
                }
            );

            return interaction.reply({
                content:
                    "`❌` Item này không phải hạt giống.",
                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ==========================================
        // 🎒 INVENTORY
        // ==========================================

        const inventory =
            getInventory(userId);

        const amount =
            getAmount(
                inventory[seed.id]
            );

        if (amount <= 0) {
            return interaction.reply({
                content:
                    `\`❌\` Bạn không có **${seed.name}** trong túi đồ.`,
                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ==========================================
        // 🌱 GROW TIME
        // ==========================================

        const growTime =
            Math.max(
                1000,
                Number(
                    seed.growTime ||
                    30000
                )
            );

        const plantedAt =
            Date.now();

        const readyAt =
            plantedAt +
            growTime;

        // ==========================================
        // 🎒 REMOVE SEED
        //
        // Trừ inventory trước khi lưu farm.
        // ==========================================

        const removed =
            removeItem(
                userId,
                seed.id,
                1
            );

        if (!removed) {
            return interaction.reply({
                content:
                    "`❌` Không thể trừ hạt giống khỏi inventory.",
                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ==========================================
        // 🪴 SAVE PLOT
        // ==========================================

        plot.seed =
            seed.id;

        plot.plantedAt =
            plantedAt;

        plot.readyAt =
            readyAt;

        plot.watered =
            false;

        User.updateFarm(
            userId,
            farm
        );

        // ==========================================
        // 🌱 SUCCESS PANEL
        // ==========================================

        const container =
            new ContainerBuilder()
                .setAccentColor(
                    COLORS.success
                )

                .addTextDisplayComponents(
                    text(
                        [
                            "# 🌱 Trồng cây thành công!",
                            `> 🪴 Ô đất **#${plot.id}**`
                        ].join("\n")
                    )
                )

                .addSeparatorComponents(
                    separator()
                )

                .addTextDisplayComponents(
                    text(
                        [
                            "### 🌱 Hạt giống",
                            `> ${seed.emoji || "🌱"} **${seed.name} ×1**`,
                            "",
                            "### ⏳ Thời gian trưởng thành",
                            `> **${formatTime(growTime)}**`,
                            "",
                            "### 🕐 Hoàn thành",
                            `> <t:${Math.floor(
                                readyAt / 1000
                            )}:R>`,
                            "",
                            "🎒 Đã trừ 1 hạt giống khỏi inventory.",
                            "🍃 Hãy quay lại khi cây đã trưởng thành."
                        ].join("\n")
                    )
                )

                .addSeparatorComponents(
                    separator()
                )

                .addActionRowComponents(
                    backButton(userId)
                );

        return interaction.update({
            components: [
                container
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

    } catch (error) {

        console.error(
            "[farm plantSeed]",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {
            return interaction.followUp({
                content:
                    "`❌` Có lỗi xảy ra khi trồng cây.",
                flags:
                    MessageFlags.Ephemeral
            }).catch(
                () => {}
            );
        }

        return interaction.reply({
            content:
                "`❌` Có lỗi xảy ra khi trồng cây.",
            flags:
                MessageFlags.Ephemeral
        }).catch(
            () => {}
        );
    }
}

// =====================================================
// ⛏️ CÀY ĐẤT
// =====================================================

async function till(
    interaction,
    userId,
    plotId
) {
    const farm =
        getFarm(userId);

    const plot =
        getPlot(
            farm,
            plotId
        );

    if (
        !plot ||
        !plot.unlocked
    ) {
        return interaction.reply({
            content:
                "`❌` Ô đất chưa được mở.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (plot.tilled) {
        return interaction.reply({
            content:
                "`⛏️` Ô đất này đã được cày.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (!hasHoe(userId)) {
        return interaction.reply({
            content:
                "`❌` Bạn chưa có **Cuốc**.\n> 🛍️ Hãy vào **Vshop** mục **Nông cụ** để mua.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    plot.tilled = true;

    User.updateFarm(
        userId,
        farm
    );

    return showPlot(
        interaction,
        userId,
        plotId
    );
}

// =====================================================
// 💧 TƯỚI NƯỚC
// =====================================================

async function waterPlot(
    interaction,
    userId,
    plotId
) {
    const farm =
        getFarm(userId);

    const plot =
        getPlot(
            farm,
            plotId
        );

    if (
        !plot ||
        !plot.unlocked ||
        !plot.seed
    ) {
        return interaction.reply({
            content:
                "`❌` Ô đất không có cây để tưới.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (plot.watered) {
        return interaction.reply({
            content:
                "`💧` Ô đất này đã được tưới rồi.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    const now =
        Date.now();

    const readyAt =
        Number(plot.readyAt || 0);

    if (now >= readyAt) {
        return interaction.reply({
            content:
                "`🌾` Cây đã trưởng thành, không cần tưới nữa.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (!hasWateringCan(userId)) {
        return interaction.reply({
            content:
                "`❌` Bạn chưa có **Bình tưới**.\n> 🛍️ Hãy vào **Vshop** mục **Nông cụ** để mua.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (getWaterAmount(userId) <= 0) {
        return interaction.reply({
            content:
                "`❌` Bạn đã hết **Nước**.\n> 🛍️ Hãy vào **Vshop** mục **Nông cụ** để mua thêm.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    removeItem(
        userId,
        "water",
        1
    );

    // Tưới nước rút ngắn 25% thời gian còn lại.
    const remaining =
        readyAt - now;

    plot.readyAt =
        readyAt -
        Math.floor(
            remaining * 0.25
        );

    plot.watered = true;

    User.updateFarm(
        userId,
        farm
    );

    return showPlot(
        interaction,
        userId,
        plotId
    );
}

// =====================================================
// ⚡ THU HOẠCH TẤT CẢ
// =====================================================

async function quickHarvest(
    interaction,
    userId
) {
    const farm =
        getFarm(userId);

    const now =
        Date.now();

    const results = [];

    for (const plot of farm.plots) {
        if (
            !plot.unlocked ||
            !plot.seed
        ) {
            continue;
        }

        if (
            now <
            Number(plot.readyAt || 0)
        ) {
            continue;
        }

        const result =
            harvestPlot(
                userId,
                farm,
                plot
            );

        if (result) {
            results.push(result);
        }
    }

    if (!results.length) {
        return interaction.reply({
            content:
                "`🌱` Hiện chưa có cây nào sẵn sàng thu hoạch.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    User.updateFarm(
        userId,
        farm
    );

    const totalAmount =
        results.reduce(
            (sum, r) => sum + r.amount,
            0
        );

    updateHarvestStats(
        userId,
        totalAmount
    );

    if (
        Quest &&
        typeof Quest.addProgress ===
            "function"
    ) {
        Quest.addProgress(
            userId,
            "farm",
            totalAmount
        );
    }

    const bonusSeedCount =
        results.filter(
            r => r.bonusSeed
        ).length;

    const summary = new Map();

    for (const result of results) {
        const key = result.crop.id;

        const entry =
            summary.get(key) || {
                crop: result.crop,
                amount: 0
            };

        entry.amount += result.amount;

        summary.set(key, entry);
    }

    const lines =
        Array.from(summary.values())
            .map(entry =>
                `> ${entry.crop.emoji || "🌾"} **${entry.crop.name} ×${entry.amount}** · ${ratingStars(entry.crop.rating)}`
            );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.success
            )

            .addTextDisplayComponents(
                text(
                    [
                        "# ⚡ Thu hoạch tất cả thành công!",
                        `> 🪴 Đã thu hoạch **${results.length}** ô đất`
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                text(
                    [
                        "### 🎒 Nông sản nhận được",
                        lines.join("\n"),
                        "",
                        bonusSeedCount
                            ? `🎁 **May mắn!** Nhận thêm **${bonusSeedCount}** hạt giống.`
                            : "",
                        "🟤 Các ô đất cần được cày lại trước khi trồng vụ mới."
                    ]
                        .filter(line => line !== "")
                        .join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(userId)
            );

    return interaction.update({
        components: [
            container
        ],
        flags:
            MessageFlags.IsComponentsV2
    });
}

// ==========================================
// 🚜 FARM COMMAND
// ==========================================

async function farmCommand(message) {
    try {
        const userId =
            message.author.id;

        ensureUser(userId);

        const farm =
            getFarm(userId);

        if (
            !farm ||
            !Array.isArray(farm.plots) ||
            !farm.plots.length
        ) {
            return message.reply({
                content:
                    "`❌` Trang trại chưa có ô đất."
            });
        }

        const msg =
            await message.reply({
                components: [
                    farmPanel(
                        userId,
                        message.author
                    )
                ],
                flags:
                    MessageFlags.IsComponentsV2
            });

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
                            "`❌` Đây không phải trang trại của bạn.",
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                try {
                    const id =
                        interaction.customId;

                    // ==================================
                    // 🌱 CHỌN Ô ĐẤT
                    // ==================================

                    if (
                        id ===
                        `farm_plot_${userId}`
                    ) {
                        const plotId =
                            interaction.values?.[0];

                        if (!plotId) {
                            return interaction.reply({
                                content:
                                    "`❌` Không xác định được ô đất.",
                                flags:
                                    MessageFlags.Ephemeral
                            });
                        }

                        return showPlot(
                            interaction,
                            userId,
                            plotId
                        );
                    }

                    // ==================================
                    // 🌱 CHỌN HẠT GIỐNG
                    // ==================================

                    if (
                        id.startsWith(
                            `farm_seed_${userId}_`
                        )
                    ) {
                        const prefix =
                            `farm_seed_${userId}_`;

                        const plotId =
                            id.slice(
                                prefix.length
                            );

                        const seedId =
                            interaction.values?.[0];

                        if (!plotId) {
                            return interaction.reply({
                                content:
                                    "`❌` Không xác định được ô đất.",
                                flags:
                                    MessageFlags.Ephemeral
                            });
                        }

                        if (!seedId) {
                            return interaction.reply({
                                content:
                                    "`❌` Bạn chưa chọn hạt giống.",
                                flags:
                                    MessageFlags.Ephemeral
                            });
                        }

                        return plantSeed(
                            interaction,
                            userId,
                            plotId,
                            seedId
                        );
                    }

                    // ==================================
                    // ⛏️ CÀY ĐẤT
                    // ==================================

                    if (
                        id.startsWith(
                            `farm_till_${userId}_`
                        )
                    ) {
                        const prefix =
                            `farm_till_${userId}_`;

                        const plotId =
                            id.slice(
                                prefix.length
                            );

                        return till(
                            interaction,
                            userId,
                            plotId
                        );
                    }

                    // ==================================
                    // 💧 TƯỚI NƯỚC
                    // ==================================

                    if (
                        id.startsWith(
                            `farm_water_${userId}_`
                        )
                    ) {
                        const prefix =
                            `farm_water_${userId}_`;

                        const plotId =
                            id.slice(
                                prefix.length
                            );

                        return waterPlot(
                            interaction,
                            userId,
                            plotId
                        );
                    }

                    // ==================================
                    // 🌾 THU HOẠCH 1 Ô
                    // ==================================

                    if (
                        id.startsWith(
                            `farm_harvest_${userId}_`
                        )
                    ) {
                        const prefix =
                            `farm_harvest_${userId}_`;

                        const plotId =
                            id.slice(
                                prefix.length
                            );

                        return harvest(
                            interaction,
                            userId,
                            plotId
                        );
                    }

                    // ==================================
                    // ⚡ THU HOẠCH NHANH
                    // ==================================

                    if (
                        id ===
                        `farm_quick_harvest_${userId}`
                    ) {
                        return quickHarvest(
                            interaction,
                            userId
                        );
                    }

                    // ==================================
                    // 🏠 VỀ TRANG TRẠI
                    // ==================================

                    if (
                        id ===
                        `farm_home_${userId}`
                    ) {
                        return interaction.update({
                            components: [
                                farmPanel(
                                    userId,
                                    interaction.user
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
                        `farm_refresh_${userId}`
                    ) {
                        return interaction.update({
                            components: [
                                farmPanel(
                                    userId,
                                    interaction.user
                                )
                            ],
                            flags:
                                MessageFlags.IsComponentsV2
                        });
                    }

                    // ==================================
                    // ❌ ĐÓNG
                    // ==================================

                    if (
                        id ===
                        `farm_close_${userId}`
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
                                                "# 🍃 Trang trại đã đóng",
                                                "",
                                                "> ☁️ Hẹn gặp lại tại Windrise!",
                                                "",
                                                "🌱 Chúc bạn có một mùa vụ thật bội thu."
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
                        "[farm interaction]",
                        error
                    );

                    if (
                        interaction.replied ||
                        interaction.deferred
                    ) {
                        return interaction
                            .followUp({
                                content:
                                    "`❌` Có lỗi xảy ra khi xử lý trang trại.",
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
                                "`❌` Có lỗi xảy ra khi xử lý trang trại.",
                            flags:
                                MessageFlags.Ephemeral
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
            "[farm]",
            error
        );

        return message
            .reply({
                content:
                    "`❌` Không thể mở trang trại."
            })
            .catch(
                () => {}
            );
    }
}

// ==========================================
// 📦 EXPORT
// ==========================================

module.exports = {
    name: "farm",

    aliases: [
        "f",
        "vfarm"
    ],

    description:
        "Quản lý trang trại của bạn.",

    usage:
        "Vfarm",

    category:
        "games",

    async execute(message) {
        return farmCommand(
            message
        );
    }
};
