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

// ==========================================
// 🍃 VENTI FARM
// ==========================================

const COLORS = {
    primary: 0xA8DCC0,
    success: 0xA8D8A8,
    warning: 0xFFD166,
    error: 0xF2A7A7
};

// ==========================================
// ⚙️ FARM CONFIG
// ==========================================

const MAX_PLOTS = 10;

// User mới mặc định có ô #1
const DEFAULT_UNLOCKED_PLOTS = 1;

// ==========================================
// 👤 USER
// ==========================================

function ensureUser(userId) {
    const user =
        User.getOrCreate(userId);

    if (!user) {
        throw new Error(
            "Không thể tạo user."
        );
    }

    return user;
}

// ==========================================
// 🌱 DEFAULT FARM
// ==========================================

function createDefaultFarm() {
    return {
        plots: Array.from(
            {
                length: MAX_PLOTS
            },
            (_, index) => ({
                id: index + 1,

                unlocked:
                    index <
                    DEFAULT_UNLOCKED_PLOTS,

                seed:
                    null,

                plantedAt:
                    null,

                readyAt:
                    null
            })
        )
    };
}

// ==========================================
// 🧹 NORMALIZE FARM
// ==========================================

function normalizeFarm(farm) {
    if (
        !farm ||
        typeof farm !== "object"
    ) {
        return createDefaultFarm();
    }

    if (
        !Array.isArray(
            farm.plots
        )
    ) {
        farm.plots = [];
    }

    farm.plots =
        farm.plots
            .filter(plot =>
                Number(plot.id) >= 1 &&
                Number(plot.id) <= MAX_PLOTS
            )
            .map(plot => ({
                id:
                    Number(plot.id),

                unlocked:
                    Boolean(
                        plot.unlocked
                    ),

                seed:
                    plot.seed || null,

                plantedAt:
                    plot.plantedAt || null,

                readyAt:
                    plot.readyAt || null
            }));

    // Đảm bảo đủ 10 slot
    for (
        let i = 1;
        i <= MAX_PLOTS;
        i++
    ) {
        const exists =
            farm.plots.find(
                plot =>
                    Number(plot.id) === i
            );

        if (!exists) {
            farm.plots.push({
                id: i,

                unlocked:
                    i <=
                    DEFAULT_UNLOCKED_PLOTS,

                seed:
                    null,

                plantedAt:
                    null,

                readyAt:
                    null
            });
        }
    }

    farm.plots.sort(
        (a, b) =>
            Number(a.id) -
            Number(b.id)
    );

    // Luôn mở ô #1
    const firstPlot =
        farm.plots.find(
            plot =>
                Number(plot.id) === 1
        );

    if (firstPlot) {
        firstPlot.unlocked = true;
    }

    return farm;
}

// ==========================================
// 🌾 GET FARM
// ==========================================

function getFarm(userId) {
    ensureUser(userId);

    let farm =
        User.getFarm(userId);

    if (!farm) {
        farm =
            createDefaultFarm();

        User.updateFarm(
            userId,
            farm
        );

        return farm;
    }

    const oldJSON =
        JSON.stringify(farm);

    farm =
        normalizeFarm(farm);

    const newJSON =
        JSON.stringify(farm);

    if (
        oldJSON !== newJSON
    ) {
        User.updateFarm(
            userId,
            farm
        );
    }

    return farm;
}

// ==========================================
// 🎒 INVENTORY
// ==========================================

function getInventory(userId) {
    const user =
        ensureUser(userId);

    return user.inventory || {};
}

// ==========================================
// 🔢 GET AMOUNT
// ==========================================

function getAmount(value) {
    if (
        typeof value === "number"
    ) {
        return value;
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

// ==========================================
// 🌱 GET SEEDS
// ==========================================

function getSeeds(userId) {
    const inventory =
        getInventory(userId);

    return Item.getAll().filter(
        item =>
            item.category === "seed" &&
            getAmount(
                inventory[item.id]
            ) > 0
    );
}

// ==========================================
// ➖ REMOVE ITEM
// ==========================================

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

    const currentAmount =
        getAmount(
            inventory[itemId]
        );

    if (
        currentAmount <
        amount
    ) {
        return false;
    }

    const newAmount =
        currentAmount -
        amount;

    if (
        newAmount <= 0
    ) {
        delete inventory[itemId];
    } else {
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

// ==========================================
// ➕ ADD ITEM
// ==========================================

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

// ==========================================
// 🔎 GET PLOT
// ==========================================

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

// ==========================================
// ⏱️ FORMAT TIME
// ==========================================

function formatTime(ms) {
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

// ==========================================
// 🌱 PLOT STATUS
// ==========================================

function getPlotStatus(plot) {
    if (
        !plot ||
        !plot.unlocked
    ) {
        return {
            emoji: "🔒",
            text: "Chưa mở"
        };
    }

    if (!plot.seed) {
        return {
            emoji: "🟫",
            text: "Đất trống"
        };
    }

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    if (
        readyAt &&
        Date.now() >= readyAt
    ) {
        return {
            emoji: "🌾",
            text: "Sẵn sàng thu hoạch"
        };
    }

    return {
        emoji: "🌱",
        text:
            `Đang lớn • còn ${formatTime(
                readyAt -
                Date.now()
            )}`
    };
}

// ==========================================
// 📊 FARM PROGRESS
// ==========================================

function createFarmProgress(
    unlocked
) {
    const barLength = 10;

    const percent =
        Math.min(
            100,
            Math.round(
                (unlocked /
                    MAX_PLOTS) *
                100
            )
        );

    const filled =
        Math.round(
            (percent / 100) *
            barLength
        );

    const bar =
        "🟩".repeat(filled) +
        "⬜".repeat(
            barLength -
            filled
        );

    return {
        bar,
        percent
    };
}

// ==========================================
// 🧩 COMPONENT V2 HELPERS
// ==========================================

function textDisplay(content) {
    return new TextDisplayBuilder()
        .setContent(
            content
        );
}

function separator() {
    return new SeparatorBuilder();
}

// ==========================================
// 🌾 PLOT GRID
// ==========================================

function createPlotGrid(farm) {
    const rows = [];

    for (
        let start = 1;
        start <= MAX_PLOTS;
        start += 5
    ) {
        const emojiRow = [];
        const numberRow = [];

        for (
            let i = start;
            i < start + 5 &&
            i <= MAX_PLOTS;
            i++
        ) {
            const plot =
                getPlot(
                    farm,
                    i
                );

            let emoji =
                "🔒";

            if (
                plot?.unlocked
            ) {
                if (!plot.seed) {
                    emoji =
                        "🟫";
                } else {
                    const readyAt =
                        Number(
                            plot.readyAt ||
                            0
                        );

                    if (
                        Date.now() >=
                        readyAt
                    ) {
                        emoji =
                            "🌾";
                    } else {
                        emoji =
                            "🌱";
                    }
                }
            }

            emojiRow.push(
                emoji
            );

            numberRow.push(
                `#${i}`
            );
        }

        rows.push(
            emojiRow.join(
                "　"
            )
        );

        rows.push(
            numberRow.join(
                "　"
            )
        );

        if (
            start + 5 <=
            MAX_PLOTS
        ) {
            rows.push("");
        }
    }

    return rows.join(
        "\n"
    );
}

// ==========================================
// 🏡 FARM HOME PANEL
// ==========================================

function farmPanel(
    userId,
    author
) {
    const farm =
        getFarm(userId);

    const unlocked =
        farm.plots.filter(
            plot =>
                plot.unlocked
        ).length;

    const locked =
        Math.max(
            0,
            MAX_PLOTS -
            unlocked
        );

    const readyCount =
        farm.plots.filter(
            plot =>
                plot.unlocked &&
                plot.seed &&
                Number(
                    plot.readyAt || 0
                ) <= Date.now()
        ).length;

    const growingCount =
        farm.plots.filter(
            plot =>
                plot.unlocked &&
                plot.seed &&
                Number(
                    plot.readyAt || 0
                ) > Date.now()
        ).length;

    const emptyCount =
        farm.plots.filter(
            plot =>
                plot.unlocked &&
                !plot.seed
        ).length;

    const progress =
        createFarmProgress(
            unlocked
        );

    const authorName =
        author?.globalName ||
        author?.username ||
        "Nông dân";

    const grid =
        createPlotGrid(
            farm
        );

    const menu =
        plotMenu(
            userId
        );

    const buttons =
        farmButtons(
            userId
        );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.primary
            )

            // ==========================
            // HEADER
            // ==========================

            .addTextDisplayComponents(
                textDisplay(
                    [
                        `# 🍃 Trang Trại Venti`,
                        `☁️ **${authorName}** · Windrise`
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            // ==========================
            // FARM GRID
            // ==========================

            .addTextDisplayComponents(
                textDisplay(
                    [
                        "### 🏡 Các ô đất",
                        "",
                        "```",
                        grid,
                        "```"
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            // ==========================
            // FARM STATUS
            // ==========================

            .addTextDisplayComponents(
                textDisplay(
                    [
                        "### 🌾 Tình trạng mùa vụ",
                        "",
                        `> 🌾 **Sẵn sàng:** ${readyCount} ô`,
                        `> 🌱 **Đang lớn:** ${growingCount} ô`,
                        `> 🟫 **Đất trống:** ${emptyCount} ô`,
                        `> 🔒 **Chưa mở:** ${locked} ô`,
                        "",
                        `> ${progress.bar} **${progress.percent}%**`
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            // ==========================
            // SELECT MENU
            // ==========================

            .addTextDisplayComponents(
                textDisplay(
                    "### 🌱 Quản lý ô đất"
                )
            )

            .addActionRowComponents(
                menu
            )

            .addSeparatorComponents(
                separator()
            )

            // ==========================
            // BUTTONS
            // ==========================

            .addActionRowComponents(
                buttons
            )

            .addSeparatorComponents(
                separator()
            )

            // ==========================
            // FOOTER
            // ==========================

            .addTextDisplayComponents(
                textDisplay(
                    "☕ `🍃` Trồng cây · Chờ lớn · Thu hoạch"
                )
            );

    return container;
}

// ==========================================
// 📋 PLOT MENU
// ==========================================

function plotMenu(userId) {
    const farm =
        getFarm(userId);

    const plots =
        farm.plots
            .filter(
                plot =>
                    plot.unlocked
            )
            .slice(
                0,
                MAX_PLOTS
            );

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `farm_plot_${userId}`
            )

            .setPlaceholder(
                "🌱 Chọn ô đất..."
            )

            .addOptions(
                plots.map(plot => {
                    const status =
                        getPlotStatus(
                            plot
                        );

                    return {
                        label:
                            `Ô đất #${plot.id}`,

                        description:
                            String(
                                status.text
                            ).slice(
                                0,
                                100
                            ),

                        value:
                            String(
                                plot.id
                            ),

                        emoji:
                            status.emoji
                    };
                })
            );

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

// ==========================================
// 🔘 FARM BUTTONS
// ==========================================

function farmButtons(
    userId
) {
    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `farm_quick_harvest_${userId}`
                )

                .setLabel(
                    "Thu hoạch nhanh"
                )

                .setEmoji(
                    "🌾"
                )

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

                .setEmoji(
                    "🔃"
                )

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

                .setEmoji(
                    "✖️"
                )

                .setStyle(
                    ButtonStyle.Danger
                )
        );
}

// ==========================================
// ◀️ BACK BUTTON
// ==========================================

function backButton(
    userId
) {
    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `farm_home_${userId}`
                )

                .setLabel(
                    "Về trang trại"
                )

                .setEmoji(
                    "🌱"
                )

                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

// ==========================================
// 🌱 EMPTY PLOT PANEL
// ==========================================

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
                textDisplay(
                    `# 🌱 Ô đất #${plot.id}`
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                textDisplay(
                    [
                        "### 🟫 Trạng thái",
                        "> 🟫 **Đất trống**",
                        "",
                        "### 🌱 Trồng cây",
                        "> Chọn hạt giống bạn muốn trồng."
                    ].join("\n")
                )
            );

    if (!seeds.length) {
        container
            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                textDisplay(
                    [
                        "### 🌱 Hạt giống",
                        "> ❌ Bạn không có hạt giống.",
                        "",
                        "> 🛍️ Vào **Vshop** để mua hạt giống."
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(
                    userId
                )
            );

        return container;
    }

    const inventory =
        getInventory(
            userId
        );

    const options =
        seeds.map(seed => {
            const amount =
                getAmount(
                    inventory[
                        seed.id
                    ]
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
                    `Có ${amount} • ${formatTime(
                        seed.growTime
                    )}`,

                value:
                    String(
                        seed.id
                    ),

                emoji:
                    seed.emoji ||
                    "🌱"
            };
        });

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `farm_seed_${userId}_${plot.id}`
            )

            .setPlaceholder(
                "🌱 Chọn hạt giống..."
            )

            .addOptions(
                options
            );

    container
        .addSeparatorComponents(
            separator()
        )

        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    menu
                )
        )

        .addSeparatorComponents(
            separator()
        )

        .addActionRowComponents(
            backButton(
                userId
            )
        );

    return container;
}

// ==========================================
// 🌾 PLANTED PLOT PANEL
// ==========================================

function plantedPlotPanel(
    userId,
    plot,
    seed,
    crop,
    ready,
    now,
    readyAt
) {
    const container =
        new ContainerBuilder()
            .setAccentColor(
                ready
                    ? COLORS.success
                    : COLORS.primary
            )

            .addTextDisplayComponents(
                textDisplay(
                    `# ${seed.emoji || "🌱"} ${seed.name}`
                )
            )

            .addSeparatorComponents(
                separator()
            );

    const statusText =
        ready
            ? [
                "### 🌾 Trạng thái",
                "> 🌾 **Cây đã lớn, có thể thu hoạch.**"
            ].join("\n")
            : [
                "### 🌱 Trạng thái",
                `> ⏳ **Còn ${formatTime(
                    readyAt - now
                )}**`
            ].join("\n");

    const rewardText =
        crop
            ? [
                "### 🌾 Nông sản",
                `> ${crop.emoji || "🌾"} **${crop.name}**`
            ].join("\n")
            : [
                "### 🌾 Nông sản",
                "> ❌ Không tìm thấy nông sản."
            ].join("\n");

    container
        .addTextDisplayComponents(
            textDisplay(
                [
                    statusText,
                    "",
                    rewardText
                ].join("\n")
            )
        )

        .addSeparatorComponents(
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

                        .setEmoji(
                            "🌾"
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `farm_quick_harvest_${userId}`
                        )

                        .setLabel(
                            "Thu hoạch nhanh"
                        )

                        .setEmoji(
                            "⚡"
                        )

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

                        .setEmoji(
                            "🔃"
                        )

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
            backButton(
                userId
            )
        );

    return container;
}

// ==========================================
// ❌ ERROR PANEL
// ==========================================

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
                textDisplay(
                    `# ❌ ${title}`
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                textDisplay(
                    description
                )
            );

    if (userId) {
        container
            .addSeparatorComponents(
                separator()
            )
            .addActionRowComponents(
                backButton(
                    userId
                )
            );
    }

    return container;
}

// ==========================================
// 🌱 SHOW PLOT
// ==========================================

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
                "`❌` Ô đất này chưa được mở.",
            ephemeral: true
        });
    }

    // ======================================
    // 🟫 EMPTY
    // ======================================

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

    // ======================================
    // 🌾 PLANTED
    // ======================================

    const seed =
        Item.get(
            plot.seed
        );

    const now =
        Date.now();

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    const ready =
        now >= readyAt;

    if (!seed) {
        return interaction.update({
            components: [
                errorPanel(
                    "Lỗi cây trồng",
                    "> Không tìm thấy dữ liệu hạt giống.",
                    userId
                )
            ],

            flags:
                MessageFlags.IsComponentsV2
        });
    }

    const cropId =
        seed.seedType ||
        String(seed.id)
            .replace(
                /_seed$/,
                ""
            );

    const crop =
        Item.get(
            cropId
        );

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

// ==========================================
// 🌱 PLANT
// ==========================================

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

    if (
        !plot ||
        !plot.unlocked
    ) {
        return interaction.reply({
            content:
                "`❌` Ô đất chưa được mở.",
            ephemeral: true
        });
    }

    if (plot.seed) {
        return interaction.reply({
            content:
                "`🌱` Ô đất này đang có cây.",
            ephemeral: true
        });
    }

    const seed =
        Item.get(
            seedId
        );

    if (
        !seed ||
        seed.category !== "seed"
    ) {
        return interaction.reply({
            content:
                "`❌` Hạt giống không tồn tại.",
            ephemeral: true
        });
    }

    const inventory =
        getInventory(
            userId
        );

    const amount =
        getAmount(
            inventory[
                seedId
            ]
        );

    if (
        amount <= 0
    ) {
        return interaction.reply({
            content:
                "`❌` Bạn không còn hạt giống này.",
            ephemeral: true
        });
    }

    const removed =
        removeItem(
            userId,
            seedId,
            1
        );

    if (!removed) {
        return interaction.reply({
            content:
                "`❌` Không thể trừ hạt giống.",
            ephemeral: true
        });
    }

    const growTime =
        Number(
            seed.growTime ||
            30000
        );

    const plantedAt =
        Date.now();

    const readyAt =
        plantedAt +
        growTime;

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

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.success
            )

            .addTextDisplayComponents(
                textDisplay(
                    "# 🌱 Trồng cây thành công"
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                textDisplay(
                    [
                        `### 🌱 Hạt giống`,
                        `> ${seed.emoji || "🌱"} **${seed.name}**`,
                        "",
                        `### ⏳ Thời gian lớn`,
                        `> **${formatTime(
                            growTime
                        )}**`,
                        "",
                        "☕ `🍃` Hãy quay lại sau khi cây trưởng thành."
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(
                    userId
                )
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
// 🌾 HARVEST ONE
// ==========================================

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

    if (
        now < readyAt
    ) {
        return null;
    }

    const seed =
        Item.get(
            plot.seed
        );

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
        Item.get(
            cropId
        );

    if (!crop) {
        return null;
    }

    const min =
        Number(
            seed.minHarvest ||
            1
        );

    const max =
        Number(
            seed.maxHarvest ||
            min
        );

    const amount =
        randomInt(
            min,
            Math.max(
                min,
                max
            )
        );

    addItem(
        userId,
        crop.id,
        amount
    );

    plot.seed =
        null;

    plot.plantedAt =
        null;

    plot.readyAt =
        null;

    return {
        crop,
        amount,
        seed
    };
}

// ==========================================
// 🌾 HARVEST ONE BUTTON
// ==========================================

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
            ephemeral: true
        });
    }

    if (!plot.seed) {
        return interaction.reply({
            content:
                "`🟫` Ô đất này chưa trồng cây.",
            ephemeral: true
        });
    }

    const now =
        Date.now();

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    if (
        now < readyAt
    ) {
        return interaction.reply({
            content:
                `\`⏳\` Cây chưa lớn.\n> Còn **${formatTime(
                    readyAt -
                    now
                )}**.`,

            ephemeral: true
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
            ephemeral: true
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

    Quest.addProgress(
        userId,
        "farm",
        result.amount
    );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.success
            )

            .addTextDisplayComponents(
                textDisplay(
                    "# 🌾 Thu hoạch thành công"
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                textDisplay(
                    [
                        "### 🌾 Nông sản nhận được",
                        `> ${result.crop.emoji || "🌾"} **${result.crop.name} ×${result.amount}**`,
                        "",
                        "### 💰 Giá bán mỗi cái",
                        `> **${Number(
                            result.crop.sellPrice ||
                            0
                        ).toLocaleString(
                            "vi-VN"
                        )} Mora**`,
                        "",
                        "### 🌱 Hạt đã dùng",
                        `> **${result.seed.id} ×1**`,
                        "",
                        "🎒 Nông sản đã được thêm vào inventory."
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(
                    userId
                )
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
// ⚡ QUICK HARVEST
// ==========================================

async function quickHarvest(
    interaction,
    userId
) {
    const farm =
        getFarm(userId);

    const readyPlots =
        farm.plots.filter(
            plot =>
                plot.unlocked &&
                plot.seed &&
                Number(
                    plot.readyAt || 0
                ) <= Date.now()
        );

    if (
        !readyPlots.length
    ) {
        return interaction.reply({
            content:
                "`🌱` Hiện chưa có cây nào sẵn sàng thu hoạch.",
            ephemeral: true
        });
    }

    const results = [];

    for (
        const plot of readyPlots
    ) {
        const result =
            harvestPlot(
                userId,
                farm,
                plot
            );

        if (result) {
            results.push(
                result
            );
        }
    }

    if (
        !results.length
    ) {
        return interaction.reply({
            content:
                "`❌` Không thể thu hoạch các cây hiện tại.",
            ephemeral: true
        });
    }

    User.updateFarm(
        userId,
        farm
    );

    let totalHarvest = 0;

    const summary = {};

    for (
        const result of results
    ) {
        totalHarvest +=
            result.amount;

        if (
            !summary[
                result.crop.id
            ]
        ) {
            summary[
                result.crop.id
            ] = {
                name:
                    result.crop.name,

                emoji:
                    result.crop.emoji ||
                    "🌾",

                amount:
                    0
            };
        }

        summary[
            result.crop.id
        ].amount +=
            result.amount;
    }

    updateHarvestStats(
        userId,
        totalHarvest
    );

    Quest.addProgress(
        userId,
        "farm",
        totalHarvest
    );

    const rewardLines =
        Object.values(
            summary
        ).map(
            item =>
                `> ${item.emoji} **${item.name} ×${item.amount}**`
        );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                COLORS.success
            )

            .addTextDisplayComponents(
                textDisplay(
                    "# ⚡ Thu hoạch nhanh"
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                textDisplay(
                    [
                        "### 🌾 Đã thu hoạch",
                        `> **${results.length}** ô đất`,
                        "",
                        "### 🎒 Nông sản nhận được",
                        rewardLines.join("\n"),
                        "",
                        "### 📊 Tổng số lượng",
                        `> **${totalHarvest}** nông sản`,
                        "",
                        "🍃 Tất cả nông sản đã được thêm vào inventory.",
                        "",
                        "☕ `🌱` Các ô đất đã sẵn sàng cho vụ mới."
                    ].join("\n")
                )
            )

            .addSeparatorComponents(
                separator()
            )

            .addActionRowComponents(
                backButton(
                    userId
                )
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
// 📊 HARVEST STATS
// ==========================================

function updateHarvestStats(
    userId,
    amount
) {
    const latest =
        User.getOrCreate(
            userId
        );

    const stats = {
        ...(latest.stats || {})
    };

    stats.harvest =
        Number(
            stats.harvest || 0
        ) +
        Number(
            amount || 0
        );

    User.update(
        userId,
        {
            stats
        }
    );
}

// ==========================================
// 🎲 RANDOM
// ==========================================

function randomInt(
    min,
    max
) {
    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}

// ==========================================
// 🚜 FARM COMMAND
// ==========================================

async function farmCommand(
    message
) {
    try {
        const userId =
            message.author.id;

        ensureUser(
            userId
        );

        const farm =
            getFarm(
                userId
            );

        if (
            !farm.plots.length
        ) {
            return message.reply({
                content:
                    "`❌` Trang trại chưa có ô đất."
            });
        }

        // ======================================
        // 🍃 SEND COMPONENT V2
        // ======================================

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
                time:
                    120000
            });

        collector.on(
            "collect",
            async interaction => {

                // ======================================
                // 🔐 USER CHECK
                // ======================================

                if (
                    interaction.user.id !==
                    userId
                ) {
                    return interaction.reply({
                        content:
                            "`❌` Đây không phải trang trại của bạn.",

                        ephemeral: true
                    });
                }

                try {
                    const id =
                        interaction.customId;

                    // ==================================
                    // 🌱 PLOT
                    // ==================================

                    if (
                        id ===
                        `farm_plot_${userId}`
                    ) {
                        return showPlot(
                            interaction,
                            userId,
                            interaction.values[0]
                        );
                    }

                    // ==================================
                    // 🌱 SEED
                    // ==================================

                    if (
                        id.startsWith(
                            `farm_seed_${userId}_`
                        )
                    ) {
                        const plotId =
                            id.split("_").pop();

                        const seedId =
                            interaction.values[0];

                        return plantSeed(
                            interaction,
                            userId,
                            plotId,
                            seedId
                        );
                    }

                    // ==================================
                    // 🌾 SINGLE HARVEST
                    // ==================================

                    if (
                        id.startsWith(
                            `farm_harvest_${userId}_`
                        )
                    ) {
                        const plotId =
                            id.split("_").pop();

                        return harvest(
                            interaction,
                            userId,
                            plotId
                        );
                    }

                    // ==================================
                    // ⚡ QUICK HARVEST
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
                    // 🏠 HOME
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
                    // 🔃 REFRESH
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
                    // ❌ CLOSE
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
                                        textDisplay(
                                            "# 🍃 Trang trại đã đóng"
                                        )
                                    )

                                    .addSeparatorComponents(
                                        separator()
                                    )

                                    .addTextDisplayComponents(
                                        textDisplay(
                                            "☁️ `🍃` Columbina đã đóng trang trại."
                                        )
                                    )
                            ],

                            flags:
                                MessageFlags.IsComponentsV2
                        });
                    }

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
                                    "`❌` Có lỗi xảy ra.",

                                ephemeral: true
                            })
                            .catch(
                                () => {}
                            );
                    }

                    return interaction
                        .reply({
                            content:
                                "`❌` Có lỗi xảy ra.",

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
    name:
        "farm",

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

    async execute(
        message
    ) {
        return farmCommand(
            message
        );
    }
};
