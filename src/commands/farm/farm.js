const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
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
    primary: "#A8DCC0",
    success: "#A8D8A8",
    warning: "#FFD166",
    error: "#F2A7A7"
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

    // Chỉ giữ tối đa 10 ô
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

    // Nếu farm cũ chỉ có 1 ô,
    // vẫn đảm bảo ô #1 được mở.
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
// 📊 FARM PROGRESS BAR
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
// 🏡 FARM EMBED
// ==========================================

function farmEmbed(
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

    // ==========================================
    // 🟫 PLOT LIST
    // ==========================================

    const plotLines = [];

    for (
        let i = 1;
        i <= MAX_PLOTS;
        i++
    ) {
        const plot =
            getPlot(
                farm,
                i
            );

        if (
            !plot ||
            !plot.unlocked
        ) {
            plotLines.push(
                `> \`✖️ Ô #${i}       : Chưa mở\``
            );

            continue;
        }

        if (!plot.seed) {
            plotLines.push(
                `> \`🟫 Ô #${i}       : Đất trống\``
            );

            continue;
        }

        const seed =
            Item.get(
                plot.seed
            );

        const emoji =
            seed?.emoji ||
            "🌱";

        const name =
            seed?.name ||
            "Cây trồng";

        const readyAt =
            Number(
                plot.readyAt || 0
            );

        if (
            readyAt &&
            Date.now() >= readyAt
        ) {
            plotLines.push(
                `> \`${emoji} Ô #${i}       : ${name} • 🌾 Sẵn sàng\``
            );

            continue;
        }

        plotLines.push(
            `> \`${emoji} Ô #${i}       : ${name} • ⏳ ${formatTime(
                readyAt -
                Date.now()
            )}\``
        );
    }

    // ==========================================
    // 👤 AUTHOR
    // ==========================================

    const authorName =
        author?.globalName ||
        author?.username ||
        "Nông dân";

    const embed =
        new EmbedBuilder()
            .setColor(
                COLORS.primary
            )

            .setAuthor({
                name:
                    `☁️ ${authorName} · Venti`,

                ...(author
                    ? {
                        iconURL:
                            author.displayAvatarURL({
                                extension:
                                    "png",

                                size:
                                    128
                            })
                    }
                    : {})
            })

            .setTitle(
                "🍃 Trang Trại Venti"
            )

            .setDescription(
                [
                    "☁️ `🍃` **Một góc nhỏ của hành trình**",
                    "",

                    "- `🏡` **Các ô đất**",
                    ...plotLines,
                    "",

                    "- `🌾` **Tình trạng mùa vụ**",
                    `> \`🌾 Sẵn sàng   : ${readyCount} ô\``,
                    `> \`🌱 Đang lớn   : ${growingCount} ô\``,
                    `> \`🟫 Đất trống  : ${emptyCount} ô\``,
                    "",

                    "- `💡` **Hướng dẫn**",
                    "> Chọn ô đất bên dưới để trồng cây.",
                    "> Mua thêm ô đất tại **Vshop**.",
                    "",

                    "☕ `🍃` **Trồng cây · Chờ lớn · Thu hoạch**"
                ].join("\n")
            );

    if (author) {
        embed.setThumbnail(
            author.displayAvatarURL({
                extension:
                    "png",

                size:
                    256
            })
        );
    }

    embed
        .setFooter({
            text:
                "☁️ Venti Farm • Windrise 🍃"
        })

        .setTimestamp();

    return embed;
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
        const seeds =
            getSeeds(userId);

        const embed =
            new EmbedBuilder()
                .setColor(
                    COLORS.primary
                )

                .setTitle(
                    `🌱 Ô đất #${plot.id}`
                )

                .setDescription(
                    [
                        "- `🟫` **Trạng thái**",
                        "> `🟫 Đất trống`",
                        "",
                        "- `🌱` **Trồng cây**",
                        "> Chọn hạt giống bạn muốn trồng."
                    ].join("\n")
                );

        if (
            !seeds.length
        ) {
            embed.setDescription(
                [
                    "- `🟫` **Trạng thái**",
                    "> `🟫 Đất trống`",
                    "",
                    "- `🌱` **Hạt giống**",
                    "> `❌ Bạn không có hạt giống.`",
                    "",
                    "> `🛍️` Vào **Vshop** để mua hạt giống."
                ].join("\n")
            );

            return interaction.update({
                embeds: [
                    embed
                ],

                components: [
                    backButton(
                        userId
                    )
                ]
            });
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

        return interaction.update({
            embeds: [
                embed
            ],

            components: [
                new ActionRowBuilder()
                    .addComponents(
                        menu
                    ),

                backButton(
                    userId
                )
            ]
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
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        COLORS.error
                    )

                    .setTitle(
                        "❌ Lỗi cây trồng"
                    )

                    .setDescription(
                        "> Không tìm thấy dữ liệu hạt giống."
                    )
            ],

            components: [
                backButton(
                    userId
                )
            ]
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

    const description = [
        "- `🌱` **Trạng thái**",

        ready
            ? "> `🌾 Cây đã lớn, có thể thu hoạch.`"
            : `> \`⏳ Còn ${formatTime(
                readyAt -
                now
            )}\``,

        "",

        "- `🌾` **Thu hoạch**",

        crop
            ? `> \`${crop.emoji || "🌾"} ${crop.name}\``
            : "> `❌ Không tìm thấy nông sản.`"
    ];

    const embed =
        new EmbedBuilder()
            .setTitle(
                `${seed.emoji || "🌱"} ${seed.name}`
            )

            .setColor(
                ready
                    ? COLORS.success
                    : COLORS.primary
            )

            .setDescription(
                description.join("\n")
            );

    const components = [];

    if (
        ready
    ) {
        components.push(
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
        components.push(
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

    components.push(
        backButton(
            userId
        )
    );

    return interaction.update({
        embeds: [
            embed
        ],

        components
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

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    COLORS.success
                )

                .setTitle(
                    "🌱 Trồng cây thành công"
                )

                .setDescription(
                    [
                        "- `🌱` **Hạt giống**",
                        `> \`${seed.name}\``,

                        "",

                        "- `⏳` **Thời gian lớn**",
                        `> \`${formatTime(
                            growTime
                        )}\``,

                        "",

                        "☕ `🍃` Hãy quay lại sau khi cây trưởng thành."
                    ].join("\n")
                )
        ],

        components: [
            backButton(
                userId
            )
        ]
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

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    COLORS.success
                )

                .setTitle(
                    "🌾 Thu hoạch thành công"
                )

                .setDescription(
                    [
                        "- `🌾` **Nông sản nhận được**",
                        `> \`${result.crop.emoji || "🌾"} ${result.crop.name} ×${result.amount}\``,

                        "",

                        "- `💰` **Giá bán mỗi cái**",
                        `> \`${Number(
                            result.crop.sellPrice ||
                            0
                        ).toLocaleString(
                            "vi-VN"
                        )} Mora\``,

                        "",

                        "- `🌱` **Hạt đã dùng**",
                        `> \`${result.seed.id} ×1\``,

                        "",

                        "🎒 Nông sản đã được thêm vào inventory."
                    ].join("\n")
                )
        ],

        components: [
            backButton(
                userId
            )
        ]
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
                `> ${item.emoji} \`${item.name} ×${item.amount}\``
        );

    const embed =
        new EmbedBuilder()
            .setColor(
                COLORS.success
            )

            .setTitle(
                "⚡ Thu hoạch nhanh"
            )

            .setDescription(
                [
                    "- `🌾` **Đã thu hoạch**",
                    `> \`${results.length}\` ô đất`,

                    "",

                    "- `🎒` **Nông sản nhận được**",
                    rewardLines.join("\n"),

                    "",

                    "- `📊` **Tổng số lượng**",
                    `> \`${totalHarvest}\` nông sản`,

                    "",

                    "🍃 Tất cả nông sản đã được thêm vào inventory.",

                    "",

                    "☕ `🌱` Các ô đất đã sẵn sàng cho vụ mới."
                ].join("\n")
            )

            .setFooter({
                text:
                    "Venti Farm • Quick Harvest"
            })

            .setTimestamp();

    return interaction.update({
        embeds: [
            embed
        ],

        components: [
            backButton(
                userId
            )
        ]
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

        const msg =
            await message.reply({
                embeds: [
                    farmEmbed(
                        userId,
                        message.author
                    )
                ],

                components: [
                    plotMenu(
                        userId
                    ),

                    farmButtons(
                        userId
                    )
                ]
            });

        const collector =
            msg.createMessageComponentCollector({
                time:
                    120000
            });

        collector.on(
            "collect",
            async interaction => {

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

                    // ==========================
                    // 🌱 PLOT
                    // ==========================

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

                    // ==========================
                    // 🌱 SEED
                    // ==========================

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

                    // ==========================
                    // 🌾 SINGLE HARVEST
                    // ==========================

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

                    // ==========================
                    // ⚡ QUICK HARVEST
                    // ==========================

                    if (
                        id ===
                        `farm_quick_harvest_${userId}`
                    ) {
                        return quickHarvest(
                            interaction,
                            userId
                        );
                    }

                    // ==========================
                    // 🏠 HOME
                    // ==========================

                    if (
                        id ===
                        `farm_home_${userId}`
                    ) {
                        return interaction.update({
                            embeds: [
                                farmEmbed(
                                    userId,
                                    interaction.user
                                )
                            ],

                            components: [
                                plotMenu(
                                    userId
                                ),

                                farmButtons(
                                    userId
                                )
                            ]
                        });
                    }

                    // ==========================
                    // 🔃 REFRESH
                    // ==========================

                    if (
                        id ===
                        `farm_refresh_${userId}`
                    ) {
                        return interaction.update({
                            embeds: [
                                farmEmbed(
                                    userId,
                                    interaction.user
                                )
                            ],

                            components: [
                                plotMenu(
                                    userId
                                ),

                                farmButtons(
                                    userId
                                )
                            ]
                        });
                    }

                    // ==========================
                    // ❌ CLOSE
                    // ==========================

                    if (
                        id ===
                        `farm_close_${userId}`
                    ) {
                        collector.stop(
                            "closed"
                        );

                        return interaction.update({
                            content:
                                "`🍃` Columbina đã đóng trang trại.",

                            embeds: [],

                            components: []
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
