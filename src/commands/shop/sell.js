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
    name: "sell",
    aliases: ["sellitem"],
    description: "Bán item lấy Mora.",

    async execute(message, args) {
        const userId = message.author.id;

        // =========================
        // LẤY USER + INVENTORY
        // =========================
        const user = User.getOrCreate(userId);

        if (!user) {
            return message.reply(
                "❌ Không thể tải dữ liệu người dùng."
            );
        }

        const inventory = user.inventory || {};

        // =========================
        // LẤY ITEM
        // =========================
        const allItems = Item.getAll();

        const farmingItems = allItems.filter(
            item =>
                item.category === "farming" &&
                item.sellPrice &&
                Number(inventory[item.id] || 0) > 0
        );

        const seafoodItems = allItems.filter(
            item =>
                item.category === "seafood" &&
                item.sellPrice &&
                Number(inventory[item.id] || 0) > 0
        );

        // =========================
        // TẠO OPTION ITEM
        // =========================
        function createItemOptions(items) {
            return items
                .slice(0, 25)
                .map(item => {
                    const amount = Number(
                        inventory[item.id] || 0
                    );

                    return {
                        label: item.name,
                        description:
                            `Đang có: ${amount} • Bán: ${item.sellPrice.toLocaleString()} Mora`,
                        value: item.id,
                        emoji: item.emoji || "📦"
                    };
                });
        }

        // =========================
        // EMBED CHÍNH
        // =========================
        const embed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("💸 Venti Market")
            .setDescription(
                "Chọn loại vật phẩm bạn muốn bán:"
            )
            .addFields(
                {
                    name: "🌾 Nông sản",
                    value:
                        `${farmingItems.length} loại có thể bán`,
                    inline: true
                },
                {
                    name: "🌊 Hải sản",
                    value:
                        `${seafoodItems.length} loại có thể bán`,
                    inline: true
                }
            )
            .setFooter({
                text: "Chỉ hiển thị vật phẩm bạn đang có."
            });

        // =========================
        // CATEGORY SELECT
        // =========================
        const categorySelect =
            new StringSelectMenuBuilder()
                .setCustomId(
                    `sell_category_${userId}`
                )
                .setPlaceholder(
                    "🌾 Chọn loại vật phẩm..."
                )
                .addOptions([
                    {
                        label: "Nông sản",
                        description:
                            "Xem nông sản bạn đang có",
                        value: "farming",
                        emoji: "🌾"
                    },
                    {
                        label: "Hải sản",
                        description:
                            "Xem hải sản bạn đang có",
                        value: "seafood",
                        emoji: "🌊"
                    }
                ]);

        const categoryRow =
            new ActionRowBuilder()
                .addComponents(
                    categorySelect
                );

        const msg = await message.reply({
            embeds: [embed],
            components: [categoryRow]
        });

        // =========================
        // COLLECTOR
        // =========================
        const collector =
            msg.createMessageComponentCollector({
                time: 120000
            });

        let selectedCategory = null;
        let selectedItem = null;

        collector.on(
            "collect",
            async interaction => {
                if (
                    interaction.user.id !== userId
                ) {
                    return interaction.reply({
                        content:
                            "❌ Đây không phải menu của bạn.",
                        ephemeral: true
                    });
                }

                // =========================
                // CHỌN CATEGORY
                // =========================
                if (
                    interaction.customId ===
                    `sell_category_${userId}`
                ) {
                    selectedCategory =
                        interaction.values[0];

                    // Lấy inventory mới nhất
                    const currentUser =
                        User.get(userId);

                    const currentInventory =
                        currentUser?.inventory || {};

                    const allItems =
                        Item.getAll();

                    const items =
                        allItems.filter(
                            item =>
                                item.category ===
                                    selectedCategory &&
                                item.sellPrice &&
                                Number(
                                    currentInventory[
                                        item.id
                                    ] || 0
                                ) > 0
                        );

                    if (!items.length) {
                        return interaction.reply({
                            content:
                                selectedCategory ===
                                "farming"
                                    ? "🌾 Bạn chưa có nông sản nào để bán."
                                    : "🌊 Bạn chưa có hải sản nào để bán.",
                            ephemeral: true
                        });
                    }

                    const options =
                        items
                            .slice(0, 25)
                            .map(item => {
                                const amount =
                                    Number(
                                        currentInventory[
                                            item.id
                                        ] || 0
                                    );

                                return {
                                    label:
                                        item.name,
                                    description:
                                        `🎒 Có ${amount} • 💰 ${item.sellPrice.toLocaleString()} Mora`,
                                    value:
                                        item.id,
                                    emoji:
                                        item.emoji ||
                                        "📦"
                                };
                            });

                    const itemSelect =
                        new StringSelectMenuBuilder()
                            .setCustomId(
                                `sell_item_${userId}`
                            )
                            .setPlaceholder(
                                "📦 Chọn vật phẩm muốn bán..."
                            )
                            .addOptions(
                                options
                            );

                    const itemRow =
                        new ActionRowBuilder()
                            .addComponents(
                                itemSelect
                            );

                    const backButton =
                        new ButtonBuilder()
                            .setCustomId(
                                `sell_back_${userId}`
                            )
                            .setLabel("Quay lại")
                            .setEmoji("⬅️")
                            .setStyle(
                                ButtonStyle.Secondary
                            );

                    const buttonRow =
                        new ActionRowBuilder()
                            .addComponents(
                                backButton
                            );

                    const categoryName =
                        selectedCategory ===
                        "farming"
                            ? "🌾 Nông sản"
                            : "🌊 Hải sản";

                    const newEmbed =
                        new EmbedBuilder()
                            .setColor("#57F287")
                            .setTitle(
                                categoryName
                            )
                            .setDescription(
                                "Chọn vật phẩm muốn bán:"
                            )
                            .setFooter({
                                text:
                                    "Số lượng được cập nhật khi mở danh sách."
                            });

                    return interaction.update({
                        embeds: [newEmbed],
                        components: [
                            itemRow,
                            buttonRow
                        ]
                    });
                }

                // =========================
                // CHỌN ITEM
                // =========================
                if (
                    interaction.customId ===
                    `sell_item_${userId}`
                ) {
                    selectedItem =
                        interaction.values[0];

                    const item =
                        Item.get(selectedItem);

                    if (!item) {
                        return interaction.reply({
                            content:
                                "❌ Item không tồn tại.",
                            ephemeral: true
                        });
                    }

                    // Lấy inventory mới nhất
                    const currentUser =
                        User.get(userId);

                    const amount =
                        Number(
                            currentUser?.inventory?.[
                                selectedItem
                            ] || 0
                        );

                    if (amount <= 0) {
                        return interaction.reply({
                            content:
                                `🎒 Bạn không còn **${item.name}**.`,
                            ephemeral: true
                        });
                    }

                    const embed =
                        new EmbedBuilder()
                            .setColor("#FFD166")
                            .setTitle(
                                `${item.emoji || "📦"} ${item.name}`
                            )
                            .setDescription(
                                "Chọn số lượng muốn bán:"
                            )
                            .addFields(
                                {
                                    name:
                                        "🎒 Đang có",
                                    value:
                                        `${amount}`,
                                    inline: true
                                },
                                {
                                    name:
                                        "💰 Giá bán",
                                    value:
                                        `${item.sellPrice.toLocaleString()} Mora`,
                                    inline: true
                                },
                                {
                                    name:
                                        "💵 Bán tất cả",
                                    value:
                                        `${(
                                            item.sellPrice *
                                            amount
                                        ).toLocaleString()} Mora`,
                                    inline: true
                                }
                            );

                    const buttons =
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(
                                        `sell_one_${userId}`
                                    )
                                    .setLabel("Bán 1")
                                    .setEmoji("💰")
                                    .setStyle(
                                        ButtonStyle.Primary
                                    ),

                                new ButtonBuilder()
                                    .setCustomId(
                                        `sell_five_${userId}`
                                    )
                                    .setLabel("Bán 5")
                                    .setEmoji("💰")
                                    .setStyle(
                                        ButtonStyle.Success
                                    ),

                                new ButtonBuilder()
                                    .setCustomId(
                                        `sell_all_${userId}`
                                    )
                                    .setLabel(
                                        "Bán tất cả"
                                    )
                                    .setEmoji("💸")
                                    .setStyle(
                                        ButtonStyle.Danger
                                    ),

                                new ButtonBuilder()
                                    .setCustomId(
                                        `sell_back_item_${userId}`
                                    )
                                    .setLabel(
                                        "Quay lại"
                                    )
                                    .setEmoji("⬅️")
                                    .setStyle(
                                        ButtonStyle.Secondary
                                    )
                            );

                    return interaction.update({
                        embeds: [embed],
                        components: [buttons]
                    });
                }

                // =========================
                // QUAY LẠI CATEGORY
                // =========================
                if (
                    interaction.customId ===
                    `sell_back_${userId}`
                ) {
                    return showCategory(
                        interaction
                    );
                }

                // =========================
                // QUAY LẠI ITEM
                // =========================
                if (
                    interaction.customId ===
                    `sell_back_item_${userId}`
                ) {
                    return showItems(
                        interaction,
                        selectedCategory
                    );
                }

                // =========================
                // BÁN
                // =========================
                if (
                    interaction.customId.startsWith(
                        `sell_one_${userId}`
                    ) ||
                    interaction.customId.startsWith(
                        `sell_five_${userId}`
                    ) ||
                    interaction.customId.startsWith(
                        `sell_all_${userId}`
                    )
                ) {
                    const item =
                        Item.get(selectedItem);

                    if (!item) {
                        return interaction.reply({
                            content:
                                "❌ Item không tồn tại.",
                            ephemeral: true
                        });
                    }

                    // Lấy inventory mới nhất
                    const currentUser =
                        User.get(userId);

                    const currentAmount =
                        Number(
                            currentUser?.inventory?.[
                                selectedItem
                            ] || 0
                        );

                    if (currentAmount <= 0) {
                        return interaction.reply({
                            content:
                                `🎒 Bạn không còn **${item.name}**.`,
                            ephemeral: true
                        });
                    }

                    let sellAmount = 1;

                    if (
                        interaction.customId.startsWith(
                            `sell_five_${userId}`
                        )
                    ) {
                        sellAmount = 5;
                    }

                    if (
                        interaction.customId.startsWith(
                            `sell_all_${userId}`
                        )
                    ) {
                        sellAmount =
                            currentAmount;
                    }

                    if (
                        sellAmount >
                        currentAmount
                    ) {
                        return interaction.reply({
                            content:
                                `🎒 Bạn chỉ có **${currentAmount} ${item.name}**.`,
                            ephemeral: true
                        });
                    }

                    const total =
                        item.sellPrice *
                        sellAmount;

                    Item.remove(
                        userId,
                        selectedItem,
                        sellAmount
                    );

                    User.addBalance(
                        userId,
                        total
                    );

                    const remaining =
                        currentAmount -
                        sellAmount;

                    const successEmbed =
                        new EmbedBuilder()
                            .setColor("#57F287")
                            .setTitle(
                                "💸 Bán thành công!"
                            )
                            .setDescription(
                                `${item.emoji || "📦"} **${item.name}** ×${sellAmount}`
                            )
                            .addFields(
                                {
                                    name:
                                        "💰 Mora nhận được",
                                    value:
                                        `+${total.toLocaleString()} Mora`,
                                    inline: true
                                },
                                {
                                    name:
                                        "🎒 Còn lại",
                                    value:
                                        `${remaining}`,
                                    inline: true
                                }
                            )
                            .setFooter({
                                text:
                                    "Venti Market"
                            });

                    return interaction.update({
                        embeds: [
                            successEmbed
                        ],
                        components: []
                    });
                }
            }
        );

        // =========================
        // CATEGORY SCREEN
        // =========================
        async function showCategory(
            interaction
        ) {
            const select =
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `sell_category_${userId}`
                    )
                    .setPlaceholder(
                        "🌾 Chọn loại vật phẩm..."
                    )
                    .addOptions([
                        {
                            label:
                                "Nông sản",
                            description:
                                "Xem nông sản bạn đang có",
                            value:
                                "farming",
                            emoji:
                                "🌾"
                        },
                        {
                            label:
                                "Hải sản",
                            description:
                                "Xem hải sản bạn đang có",
                            value:
                                "seafood",
                            emoji:
                                "🌊"
                        }
                    ]);

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        select
                    );

            const currentUser =
                User.get(userId);

            const currentInventory =
                currentUser?.inventory || {};

            const allItems =
                Item.getAll();

            const farmingCount =
                allItems.filter(
                    item =>
                        item.category ===
                            "farming" &&
                        Number(
                            currentInventory[
                                item.id
                            ] || 0
                        ) > 0
                ).length;

            const seafoodCount =
                allItems.filter(
                    item =>
                        item.category ===
                            "seafood" &&
                        Number(
                            currentInventory[
                                item.id
                            ] || 0
                        ) > 0
                ).length;

            const embed =
                new EmbedBuilder()
                    .setColor("#57F287")
                    .setTitle(
                        "💸 Venti Market"
                    )
                    .setDescription(
                        "Chọn loại vật phẩm bạn muốn bán:"
                    )
                    .addFields(
                        {
                            name:
                                "🌾 Nông sản",
                            value:
                                `${farmingCount} loại`,
                            inline: true
                        },
                        {
                            name:
                                "🌊 Hải sản",
                            value:
                                `${seafoodCount} loại`,
                            inline: true
                        }
                    );

            return interaction.update({
                embeds: [embed],
                components: [row]
            });
        }

        // =========================
        // ITEM SCREEN
        // =========================
        async function showItems(
            interaction,
            category
        ) {
            const currentUser =
                User.get(userId);

            const currentInventory =
                currentUser?.inventory || {};

            const items =
                Item.getAll().filter(
                    item =>
                        item.category ===
                            category &&
                        item.sellPrice &&
                        Number(
                            currentInventory[
                                item.id
                            ] || 0
                        ) > 0
                );

            if (!items.length) {
                return interaction.reply({
                    content:
                        "🎒 Bạn không còn item nào trong danh mục này.",
                    ephemeral: true
                });
            }

            const options =
                items
                    .slice(0, 25)
                    .map(item => {
                        const amount =
                            Number(
                                currentInventory[
                                    item.id
                                ] || 0
                            );

                        return {
                            label:
                                item.name,
                            description:
                                `🎒 Có ${amount} • 💰 ${item.sellPrice.toLocaleString()} Mora`,
                            value:
                                item.id,
                            emoji:
                                item.emoji ||
                                "📦"
                        };
                    });

            const select =
                new StringSelectMenuBuilder()
                    .setCustomId(
                        `sell_item_${userId}`
                    )
                    .setPlaceholder(
                        "📦 Chọn vật phẩm muốn bán..."
                    )
                    .addOptions(
                        options
                    );

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        select
                    );

            const back =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `sell_back_${userId}`
                            )
                            .setLabel(
                                "Quay lại"
                            )
                            .setEmoji(
                                "⬅️"
                            )
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    );

            return interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            "#57F287"
                        )
                        .setTitle(
                            category ===
                                "farming"
                                ? "🌾 Nông sản"
                                : "🌊 Hải sản"
                        )
                        .setDescription(
                            "Chọn vật phẩm muốn bán:"
                        )
                ],
                components: [
                    row,
                    back
                ]
            });
        }

        // =========================
        // HẾT THỜI GIAN
        // =========================
        collector.on(
            "end",
            async () => {
                try {
                    await msg.edit({
                        components: []
                    });
                } catch (err) {}
            }
        );
    }
};
