
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
    primary: "#9ccfd8",
    success: "#a8d8a8",
    warning: "#ffd166",
    error: "#f2a7a7"
};

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
        plots: [
            {
                id: 1,
                unlocked: true,
                seed: null,
                plantedAt: null,
                readyAt: null
            }
        ]
    };
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
    }

    if (
        !Array.isArray(
            farm.plots
        )
    ) {
        farm.plots = [];
    }

    if (!farm.plots.length) {
        farm.plots.push({
            id: 1,
            unlocked: true,
            seed: null,
            plantedAt: null,
            readyAt: null
        });

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
// 🌱 SEEDS
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
        currentAmount < amount
    ) {
        return false;
    }

    const newAmount =
        currentAmount - amount;

    if (newAmount <= 0) {
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

    if (seconds < 60) {
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
    if (!plot.unlocked) {
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
// 🏡 FARM EMBED
// ==========================================

function farmEmbed(userId) {
    const farm =
        getFarm(userId);

    const lines = [];

    for (
        const plot of farm.plots
    ) {
        const status =
            getPlotStatus(plot);

        let name =
            `Ô đất #${plot.id}`;

        if (plot.seed) {
            const seed =
                Item.get(
                    plot.seed
                );

            if (seed) {
                name =
                    `${seed.emoji || "🌱"} ${seed.name}`;
            }
        }

        lines.push(
            `${status.emoji} **${name}**\n` +
            `> \`${status.text}\``
        );
    }

    const unlocked =
        farm.plots.filter(
            plot =>
                plot.unlocked
        ).length;

    const total =
        farm.plots.length;

    const readyCount =
        farm.plots.filter(
            plot =>
                plot.unlocked &&
                plot.seed &&
                Number(
                    plot.readyAt || 0
                ) <= Date.now()
        ).length;

    return new EmbedBuilder()
        .setColor(
            COLORS.primary
        )

        .setTitle(
            "`🌱` Venti Farm"
        )

        .setDescription(
            [
                "`🍃` **Trang trại của bạn**",
                "",
                lines.join("\n\n"),
                "",
                "- `🌾` **Ô đất**",
                `> \`${unlocked}/${total}\` ô đang mở`,
                "",
                "- `🌾` **Có thể thu hoạch**",
                `> \`${readyCount}\` ô`,
                "",
                "- `🌱` **Hướng dẫn**",
                "> Chọn ô đất để trồng cây.",
                "> Hạt giống có thể mua tại Vshop.",
                "",
                "୨୧ ─────────────── ୨୧",
                "`🍃` Trồng • Chờ • Thu hoạch"
            ].join("\n")
        )

        .setFooter({
            text:
                "Columbina Farm • Windrise"
        })

        .setTimestamp();
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
            .slice(0, 25);

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
                            status.text.slice(
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

function farmButtons(userId) {
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
                    "`🌱` Ô đất #" +
                    plot.id
                )
                .setDescription(
                    [
                        "`🟫` **Đất trống**",
                        "",
                        "> Chọn hạt giống bạn muốn trồng."
                    ].join("\n")
                );

        if (!seeds.length) {
            embed.setDescription(
                [
                    "`🟫` **Đất trống**",
                    "",
                    "`🌱` Bạn không có hạt giống.",
                    "",
                    "> `🛍️` Vào Vshop để mua hạt giống."
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
                        "`❌` Lỗi cây trồng"
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

    const embed =
        new EmbedBuilder()
            .setTitle(
                `\`${seed.emoji || "🌱"}\` ${seed.name}`
            )
            .setColor(
                ready
                    ? COLORS.success
                    : COLORS.primary
            )
            .setDescription(
                [
                    "`🌱` **Trạng thái**",

                    ready
                        ? "> `🌾` Cây đã lớn, có thể thu hoạch."
                        : `> \`⏳\` Còn **${formatTime(
                            readyAt -
                            now
                        )}**`,

                    "",

                    crop
                        ? "`🌾` **Thu hoạch**\n" +
                          `> \`${crop.name}\``
                        : ""
                ]
                    .filter(Boolean)
                    .join("\n")
            );

    const components = [];

    if (ready) {
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
        getInventory(userId);

    const amount =
        getAmount(
            inventory[
                seedId
            ]
        );

    if (amount <= 0) {
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
                    "`🌱` Trồng cây thành công"
                )
                .setDescription(
                    [
                        "`🌱` **Hạt giống**",
                        `> \`${seed.name}\``,
                        "",
                        "`⏳` **Thời gian lớn**",
                        `> \`${formatTime(
                            growTime
                        )}\``,
                        "",
                        "`🍃` Hãy quay lại sau khi cây trưởng thành."
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

    plot.seed = null;
    plot.plantedAt = null;
    plot.readyAt = null;

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

    if (now < readyAt) {
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
                    "`🌾` Thu hoạch thành công"
                )
                .setDescription(
                    [
                        "`🌾` **Nông sản nhận được**",
                        `> \`${result.crop.name} ×${result.amount}\``,
                        "",
                        "`💰` **Giá bán mỗi cái**",
                        `> \`${Number(
                            result.crop.sellPrice ||
                            0
                        ).toLocaleString(
                            "vi-VN"
                        )} Mora\``,
                        "",
                        "`🌱` **Hạt đã dùng**",
                        `> \`${result.seed.id} ×1\``,
                        "",
                        "`🎒` Nông sản đã được thêm vào inventory."
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

    if (!readyPlots.length) {
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
            results.push(result);
        }
    }

    if (!results.length) {
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
                amount: 0
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
                "`⚡` Thu hoạch nhanh"
            )
            .setDescription(
                [
                    "`🌾` **Đã thu hoạch**",
                    `> \`${results.length}\` ô đất`,
                    "",
                    "`🎒` **Nông sản nhận được**",
                    rewardLines.join("\n"),
                    "",
                    "`📊` **Tổng số lượng**",
                    `> \`${totalHarvest}\` nông sản`,
                    "",
                    "`🍃` Tất cả nông sản đã được thêm vào inventory.",
                    "",
                    "୨୧ ─────────────── ୨୧",
                    "`🌱` Các ô đất đã sẵn sàng để trồng vụ mới."
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
        ) + Number(amount || 0);

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
                        userId
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
                                    userId
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
                                    userId
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
                                "`🍃` Venti đã đóng trang trại.",
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

        return message.reply({
            content:
                "`❌` Không thể mở trang trại."
        }).catch(
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

