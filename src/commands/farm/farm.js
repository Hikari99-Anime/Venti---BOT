const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const User = require("../../database/models/User");
const Item = require("../../database/models/Item");

module.exports = {
    name: "farm",
    aliases: ["vfarm"],
    description: "Xem và quản lý trang trại.",

    async execute(message) {
        const userId = message.author.id;

        User.getOrCreate(userId);

        let selectedPlot = null;

        const msg = await message.reply(
            createFarmMessage(userId)
        );

        const collector =
            msg.createMessageComponentCollector({
                time: 180000
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
                            "❌ Đây không phải trang trại của bạn.",
                        ephemeral: true
                    });
                }

                try {
                    // =========================
                    // CHỌN Ô ĐẤT
                    // =========================

                    if (
                        interaction.customId ===
                        `farm_plot_${userId}`
                    ) {
                        selectedPlot =
                            Number(
                                interaction.values[0]
                            );

                        return showPlot(
                            interaction,
                            userId,
                            selectedPlot
                        );
                    }

                    // =========================
                    // CHỌN HẠT GIỐNG
                    // =========================

                    if (
                        interaction.customId ===
                        `farm_seed_${userId}`
                    ) {
                        const seedId =
                            interaction.values[0];

                        return plantSeed(
                            interaction,
                            userId,
                            selectedPlot,
                            seedId
                        );
                    }

                    // =========================
                    // THU HOẠCH
                    // =========================

                    if (
                        interaction.customId ===
                        `farm_harvest_${userId}`
                    ) {
                        return harvest(
                            interaction,
                            userId,
                            selectedPlot
                        );
                    }

                    // =========================
                    // TƯỚI NƯỚC
                    // =========================

                    if (
                        interaction.customId ===
                        `farm_water_${userId}`
                    ) {
                        return interaction.reply({
                            content:
                                "💧 Đã tưới nước cho cây!\n🌱 Cây sẽ tiếp tục phát triển.",
                            ephemeral: true
                        });
                    }

                    // =========================
                    // QUAY LẠI
                    // =========================

                    if (
                        interaction.customId ===
                        `farm_home_${userId}`
                    ) {
                        return interaction.update(
                            createFarmMessage(
                                userId
                            )
                        );
                    }

                    // =========================
                    // TRANG CHỦ
                    // =========================

                    if (
                        interaction.customId ===
                        `farm_refresh_${userId}`
                    ) {
                        return interaction.update(
                            createFarmMessage(
                                userId
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        "Vfarm error:",
                        error
                    );

                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Có lỗi xảy ra.",
                            ephemeral: true
                        });
                    }
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
    }
};

// ==========================================
// 🏡 FARM HOME
// ==========================================

function createFarmMessage(userId) {
    const farm =
        User.getFarm(userId);

    const plots =
        Array.isArray(farm.plots)
            ? farm.plots
            : [];

    const unlocked =
        plots.filter(
            plot =>
                plot.unlocked
        );

    let description =
        "Quản lý trang trại của bạn.\n\n";

    description +=
        `🟫 Ô đất: **${unlocked.length}**\n`;

    description +=
        `🔓 Đã mở: **${unlocked.length}**\n\n`;

    for (
        const plot of unlocked
    ) {
        description +=
            getPlotStatus(plot) +
            "\n";
    }

    const embed =
        new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
                "🏡 Trang trại của bạn"
            )
            .setDescription(
                description
            )
            .setFooter({
                text:
                    "Chọn một ô đất để quản lý."
            });

    return {
        embeds: [embed],
        components: [
            createPlotMenu(
                unlocked,
                userId
            ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `farm_refresh_${userId}`
                        )
                        .setLabel(
                            "Làm mới"
                        )
                        .setEmoji(
                            "🔄"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ]
    };
}

// ==========================================
// 🟫 PLOT MENU
// ==========================================

function createPlotMenu(
    plots,
    userId
) {
    const options =
        plots
            .slice(0, 25)
            .map(plot => ({
                label:
                    `Ô đất #${plot.id}`,

                description:
                    getPlotShortStatus(
                        plot
                    ),

                value:
                    String(plot.id),

                emoji:
                    plot.seed
                        ? "🌱"
                        : "🟫"
            }));

    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    `farm_plot_${userId}`
                )
                .setPlaceholder(
                    "🟫 Chọn ô đất..."
                )
                .addOptions(
                    options
                )
        );
}

// ==========================================
// 🟫 SHOW PLOT
// ==========================================

async function showPlot(
    interaction,
    userId,
    plotId
) {
    const farm =
        User.getFarm(userId);

    const plot =
        farm.plots.find(
            p =>
                Number(p.id) ===
                Number(plotId)
        );

    if (
        !plot ||
        !plot.unlocked
    ) {
        return interaction.reply({
            content:
                "❌ Ô đất này chưa được mở.",
            ephemeral: true
        });
    }

    // =========================
    // Ô ĐẤT TRỐNG
    // =========================

    if (!plot.seed) {
        return showEmptyPlot(
            interaction,
            userId,
            plotId
        );
    }

    const seed =
        Item.get(plot.seed);

    if (!seed) {
        plot.seed = null;

        User.updateFarm(
            userId,
            farm
        );

        return showEmptyPlot(
            interaction,
            userId,
            plotId
        );
    }

    const now =
        Date.now();

    const readyAt =
        Number(
            plot.readyAt || 0
        );

    // =========================
    // ĐÃ LỚN
    // =========================

    if (
        now >= readyAt
    ) {
        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        "#FFD166"
                    )
                    .setTitle(
                        `🌾 Ô đất #${plotId}`
                    )
                    .setDescription(
                        `${seed.emoji} **${seed.name}**\n\n` +
                        "🌾 **Đã sẵn sàng thu hoạch!**"
                    )
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `farm_harvest_${userId}`
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
                                `farm_home_${userId}`
                            )
                            .setLabel(
                                "Trang trại"
                            )
                            .setEmoji(
                                "🏡"
                            )
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    )
            ]
        });
    }

    // =========================
    // ĐANG LỚN
    // =========================

    const remaining =
        readyAt - now;

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    "#57F287"
                )
                .setTitle(
                    `🌱 Ô đất #${plotId}`
                )
                .setDescription(
                    `${seed.emoji} **${seed.name}**\n\n` +
                    `⏳ Còn khoảng **${formatTime(
                        remaining
                    )}**\n\n` +
                    "🌱 Cây đang phát triển..."
                )
        ],
        components: [
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
                            "🔄"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `farm_water_${userId}`
                        )
                        .setLabel(
                            "Tưới nước"
                        )
                        .setEmoji(
                            "💧"
                        )
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `farm_home_${userId}`
                        )
                        .setLabel(
                            "Trang trại"
                        )
                        .setEmoji(
                            "🏡"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ]
    });
}

// ==========================================
// 🟫 EMPTY PLOT
// ==========================================

async function showEmptyPlot(
    interaction,
    userId,
    plotId
) {
    const seeds =
        Item.getAll().filter(
            item =>
                item.category ===
                "seed"
        );

    if (!seeds.length) {
        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        "#ED4245"
                    )
                    .setTitle(
                        `🟫 Ô đất #${plotId}`
                    )
                    .setDescription(
                        "❌ Bạn chưa có hạt giống nào."
                    )
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `farm_home_${userId}`
                            )
                            .setLabel(
                                "Trang trại"
                            )
                            .setEmoji(
                                "🏡"
                            )
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    )
            ]
        });
    }

    const user =
        User.getOrCreate(
            userId
        );

    const inventory =
        user.inventory || {};

    const available =
        seeds.filter(
            seed =>
                Number(
                    inventory[
                        seed.id
                    ] || 0
                ) > 0
        );

    if (!available.length) {
        return interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        "#ED4245"
                    )
                    .setTitle(
                        `🟫 Ô đất #${plotId}`
                    )
                    .setDescription(
                        "🎒 Bạn không có hạt giống.\n\n" +
                        "Vào `Vshop` → 🌱 Hạt giống để mua."
                    )
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `farm_home_${userId}`
                            )
                            .setLabel(
                                "Trang trại"
                            )
                            .setEmoji(
                                "🏡"
                            )
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    )
            ]
        });
    }

    const options =
        available
            .slice(0, 25)
            .map(seed => ({
                label:
                    seed.name,

                description:
                    `Có ${inventory[
                        seed.id
                    ]} | Lớn trong ${formatTime(
                        seed.growTime
                    )}`,

                value:
                    seed.id,

                emoji:
                    seed.emoji
            }));

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    "#57F287"
                )
                .setTitle(
                    `🟫 Ô đất #${plotId}`
                )
                .setDescription(
                    "🌱 Ô đất đang trống.\n\n" +
                    "Chọn hạt giống để trồng."
                )
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(
                            `farm_seed_${userId}`
                        )
                        .setPlaceholder(
                            "🌱 Chọn hạt giống..."
                        )
                        .addOptions(
                            options
                        )
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `farm_home_${userId}`
                        )
                        .setLabel(
                            "Trang trại"
                        )
                        .setEmoji(
                            "🏡"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ]
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
    if (!plotId) {
        return interaction.reply({
            content:
                "❌ Chưa chọn ô đất.",
            ephemeral: true
        });
    }

    const farm =
        User.getFarm(userId);

    const plot =
        farm.plots.find(
            p =>
                Number(p.id) ===
                Number(plotId)
        );

    if (
        !plot ||
        !plot.unlocked
    ) {
        return interaction.reply({
            content:
                "❌ Ô đất không tồn tại.",
            ephemeral: true
        });
    }

    if (plot.seed) {
        return interaction.reply({
            content:
                "❌ Ô đất này đang có cây.",
            ephemeral: true
        });
    }

    const seed =
        Item.get(seedId);

    if (
        !seed ||
        seed.category !==
            "seed"
    ) {
        return interaction.reply({
            content:
                "❌ Hạt giống không tồn tại.",
            ephemeral: true
        });
    }

    const user =
        User.getOrCreate(
            userId
        );

    const amount =
        Number(
            user.inventory?.[
                seedId
            ] || 0
        );

    if (amount <= 0) {
        return interaction.reply({
            content:
                "❌ Bạn không có hạt giống này.",
            ephemeral: true
        });
    }

    const plantedAt =
        Date.now();

    const readyAt =
        plantedAt +
        Number(
            seed.growTime ||
            30000
        );

    User.removeItem(
        userId,
        seedId,
        1
    );

    plot.seed =
        seedId;

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
                    "#57F287"
                )
                .setTitle(
                    "🌱 Trồng thành công!"
                )
                .setDescription(
                    `${seed.emoji} **${seed.name}** đã được trồng tại **ô #${plotId}**.\n\n` +
                    `⏳ Thời gian lớn: **${formatTime(
                        seed.growTime
                    )}**`
                )
        ],
        components: [
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
                            "🔄"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `farm_home_${userId}`
                        )
                        .setLabel(
                            "Trang trại"
                        )
                        .setEmoji(
                            "🏡"
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                )
        ]
    });
}

// ==========================================
// 🌾 HARVEST
// ==========================================

async function harvest(
    interaction,
    userId,
    plotId
) {
    if (!plotId) {
        return interaction.reply({
            content:
                "❌ Chưa chọn ô đất.",
            ephemeral: true
        });
    }

    const farm =
        User.getFarm(userId);

    const plot =
        farm.plots.find(
            p =>
                Number(p.id) ===
                Number(plotId)
        );

    if (
        !plot ||
        !plot.seed
    ) {
        return interaction.reply({
            content:
                "❌ Ô đất này không có cây.",
            ephemeral: true
        });
    }

    const seed =
        Item.get(plot.seed);

    if (!seed) {
        return interaction.reply({
            content:
                "❌ Dữ liệu cây không hợp lệ.",
            ephemeral: true
        });
    }

    if (
        Date.now() <
        Number(plot.readyAt || 0)
    ) {
        return interaction.reply({
            content:
                `⏳ Cây chưa lớn! Còn ${formatTime(
                    Number(plot.readyAt) -
                    Date.now()
                )}.`,
            ephemeral: true
        });
    }

    const amount =
        randomAmount(
            seed.minHarvest || 1,
            seed.maxHarvest || 1
        );

    const cropId =
        seed.seedType;

    const crop =
        Item.get(cropId);

    if (!crop) {
        return interaction.reply({
            content:
                `❌ Không tìm thấy nông sản \`${cropId}\`.`,
            ephemeral: true
        });
    }

    User.addItem(
        userId,
        cropId,
        amount
    );

    // Reset ô đất
    plot.seed =
        null;

    plot.plantedAt =
        null;

    plot.readyAt =
        null;

    User.updateFarm(
        userId,
        farm
    );

    return interaction.update({
        embeds: [
            new EmbedBuilder()
                .setColor(
                    "#FFD166"
                )
                .setTitle(
                    "🌾 Thu hoạch thành công!"
                )
                .setDescription(
                    `${crop.emoji} **${crop.name} ×${amount}**\n\n` +
                    "🎒 Nông sản đã được thêm vào inventory."
                )
                .addFields({
                    name:
                        "🟫 Ô đất",
                    value:
                        `#${plotId}`,
                    inline: true
                })
        ],
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `farm_home_${userId}`
                        )
                        .setLabel(
                            "Trang trại"
                        )
                        .setEmoji(
                            "🏡"
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                )
        ]
    });
}

// ==========================================
// 📊 STATUS
// ==========================================

function getPlotStatus(plot) {
    if (!plot.unlocked) {
        return `🔒 Ô #${plot.id} — Chưa mở`;
    }

    if (!plot.seed) {
        return `🟫 Ô #${plot.id} — Trống`;
    }

    const seed =
        Item.get(plot.seed);

    if (!seed) {
        return `🟫 Ô #${plot.id} — Trống`;
    }

    if (
        Date.now() >=
        Number(plot.readyAt || 0)
    ) {
        return `🌾 Ô #${plot.id} — **${seed.name} — Sẵn sàng!**`;
    }

    return (
        `🌱 Ô #${plot.id} — ${seed.name} — ` +
        `⏳ ${formatTime(
            Number(plot.readyAt) -
            Date.now()
        )}`
    );
}

function getPlotShortStatus(plot) {
    if (!plot.seed) {
        return "Ô đất đang trống";
    }

    const seed =
        Item.get(plot.seed);

    if (!seed) {
        return "Ô đất trống";
    }

    if (
        Date.now() >=
        Number(plot.readyAt || 0)
    ) {
        return "🌾 Sẵn sàng thu hoạch";
    }

    return `🌱 ${seed.name}`;
}

// ==========================================
// 🎲 RANDOM AMOUNT
// ==========================================

function randomAmount(
    min,
    max
) {
    min = Number(min);
    max = Number(max);

    return Math.floor(
        Math.random() *
            (max - min + 1)
    ) + min;
}

// ==========================================
// ⏳ FORMAT TIME
// ==========================================

function formatTime(ms) {
    ms = Math.max(
        0,
        Number(ms || 0)
    );

    const seconds =
        Math.ceil(
            ms / 1000
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

