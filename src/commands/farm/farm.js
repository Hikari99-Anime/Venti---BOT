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
                seed: null,
                plantedAt: null,
                readyAt: null
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

                seed:
                    oldPlot.seed || null,

                plantedAt:
                    oldPlot.plantedAt || null,

                readyAt:
                    oldPlot.readyAt || null
            });
        } else {
            normalized.push({
                id: i,

                unlocked:
                    i <= DEFAULT_UNLOCKED_PLOTS,

                seed: null,
                plantedAt: null,
                readyAt: null
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
     * Hệ thống items hiện tại của bạn:
     *
     * apple
     * orange
     * wheat
     * carrot
     * ...
     *
     * đều dùng:
     *
     * category: "farming"
     *
     * Vì vậy farming được xem là seed.
     */

    return (
        item.category === "farming" ||
        item.category === "seed" ||
        item.type === "seed" ||
        item.itemType === "seed" ||
        String(item.id).endsWith("_seed") ||
        String(item.id).includes("_seed")
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
                        "# 🍃 Trang Trại Venti",
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
                        "> 🟫 **Đất trống**"
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            );

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

                return {
                    label:
                        String(
                            seed.name
                        ).slice(
                            0,
                            100
                        ),

                    description:
                        `Có ${amount} • Lớn trong ${formatTime(
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
                    ? `> ${crop.emoji || "🌾"} **${crop.name}**`
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
                        )
                )
        );
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
// 🌱 PLANT SEED
// =====================================================

async function plantSeed(
    interaction,
    userId,
    plotId,
    seedId
) {
    const farm =
        getFarm(userId);

    const plot =
        getPlot(
            farm,
            plotId
        );

    // ================================================
    // 🪴 CHECK PLOT
    // ================================================

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

    if (plot.seed) {
        return interaction.reply({
            content:
                "`🌱` Ô đất này đang có cây.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    // ================================================
    // 🌱 GET SEED
    // ================================================

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

    // ================================================
    // 🌱 VALIDATE SEED
    // ================================================

    /*
     * QUAN TRỌNG:
     *
     * Item của bạn đang dùng:
     *
     * category: "farming"
     *
     * Ví dụ:
     *
     * apple
     * orange
     * wheat
     * carrot
     *
     * Vì vậy category farming
     * được xem là seed.
     */

    const validSeed =
        isSeedItem(seed);

    if (!validSeed) {
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

    // ================================================
    // 🎒 CHECK INVENTORY
    // ================================================

    const inventory =
        getInventory(userId);

    const amount =
        getAmount(
            inventory[seed.id]
        );

    if (amount <= 0) {
        return interaction.reply({
            content:
                "`❌` Bạn không còn hạt giống này.",
            flags:
                MessageFlags.Ephemeral
        });
    }

    // ================================================
    // ➖ REMOVE SEED
    // ================================================

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

    // ================================================
    // ⏱️ GROW TIME
    // ================================================

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

    // ================================================
    // 🌱 SAVE FARM
    // ================================================

    plot.seed =
        seed.id;

    plot.plantedAt =
        plantedAt;

    plot.readyAt =
        readyAt;

    User.updateFarm(
        userId,
        farm
    );

    // ================================================
    // 📦 SUCCESS PANEL
    // ================================================

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
                        `> ${seed.emoji || "🌱"} **${seed.name}**`,
                        "",
                        "### ⏳ Thời gian trưởng thành",
                        `> **${formatTime(
                            growTime
                        )}**`,
                        "",
                        "### 🕐 Hoàn thành",
                        `> <t:${Math.floor(
                            readyAt / 1000
                        )}:R>`,
                        "",
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

    plot.seed = null;
    plot.plantedAt = null;
    plot.readyAt = null;

    return {
        crop,
        seed,
        amount
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
                        `> ${result.crop.emoji || "🌾"} **${result.crop.name} ×${result.amount}**`,
                        "",
                        "### 💰 Giá bán",
                        `> **${sellPrice.toLocaleString(
                            "vi-VN"
                        )} Mora / cái**`,
                        "",
                        "### 🌱 Hạt giống đã dùng",
                        `> ${result.seed.emoji || "🌱"} **${result.seed.name} ×1**`,
                        "",
                        "🎒 Nông sản đã được thêm vào inventory."
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
        // Hệ thống items hiện tại:
        // category: "farming"
        // chính là item có thể trồng.
        // ==========================================

        const isSeed =
            seed.category === "farming" ||
            seed.category === "seed" ||
            seed.type === "seed" ||
            seed.itemType === "seed" ||
            String(seed.id).endsWith("_seed") ||
            String(seed.id).includes("_seed");

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
