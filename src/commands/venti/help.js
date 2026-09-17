const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags
} = require("discord.js");

// ============================================================
// 📚 HELP DATA
// ============================================================

const CATEGORIES = {

    // ========================================================
    // 🏠 HOME
    // ========================================================

    home: {
        title: "❄️ Trung Tâm Hướng Dẫn",

        description:
            "☁️ `🍃` **Một góc nhỏ của hành trình**\n" +
            "・ Chọn một danh mục bên dưới để bắt đầu.\n\n" +

            "- `🚀` **Bắt đầu**\n" +
            "> `💰 Vdaily       : Nhận Daily Reward`\n" +
            "> `💼 Vwork        : Làm việc kiếm Mora`\n" +
            "> `👤 Vprofile     : Xem hồ sơ`\n" +
            "> `📈 Vstats       : Xem thống kê`\n\n" +

            "- `💰` **Tài chính**\n" +
            "> `💵 Vbalance     : Xem số dư`\n" +
            "> `💸 Vpay         : Chuyển Mora`\n" +
            "> `🏦 Vdeposit     : Gửi ngân hàng`\n" +
            "> `🏦 Vwithdraw    : Rút ngân hàng`\n\n" +

            "- `🎮` **Mini Game**\n" +
            "> `🎰 Vslots       : Slot Machine`\n" +
            "> `🃏 Vblackjack   : Blackjack`\n" +
            "> `🎲 Vdice        : Dice`\n" +
            "> `🎯 Vtaixiu      : Tài Xỉu`\n\n" +

            "- `🌿` **Phiêu lưu**\n" +
            "> `🎣 Vfish        : Câu cá`\n" +
            "> `🌾 Vfarm        : Trồng & thu hoạch`\n" +
            "> `📜 Vquest       : Nhiệm vụ`\n" +
            "> `🎒 Vinventory   : Túi đồ`\n\n" +

            "☕ `❄️` **Chọn danh mục bên dưới để xem thêm.**",

        footer:
            "☁️ Columbina • Help Center"
    },

    // ========================================================
    // 💰 ECONOMY
    // ========================================================

    economy: {
        title: "💰 Kinh Tế",

        description:
            "☁️ `🍃` **Quản lý Mora của bạn**\n\n" +

            "- `💰` **Tài chính**\n" +
            "> `💵 Vbalance     : Xem số dư`\n" +
            "> `💸 Vpay         : Chuyển Mora`\n" +
            "> `🏦 Vdeposit     : Gửi ngân hàng`\n" +
            "> `🏦 Vwithdraw    : Rút ngân hàng`\n\n" +

            "- `🎁` **Kiếm Mora**\n" +
            "> `📅 Vdaily       : Daily Reward`\n" +
            "> `💼 Vwork        : Làm việc`\n\n" +

            "- `🛒` **Cửa hàng**\n" +
            "> `🛍️ Vshop        : Xem cửa hàng`\n" +
            "> `🛒 Vbuy         : Mua vật phẩm`\n" +
            "> `💸 Vsell        : Bán vật phẩm`\n\n" +

            "☕ `💰` **Earn • Save • Spend**",

        footer:
            "☁️ Columbina • Economy"
    },

    // ========================================================
    // 🎮 GAMES
    // ========================================================

    games: {
        title: "🎮 Mini Game",

        description:
            "☁️ `🍃` **Thử vận may với Mora**\n\n" +

            "- `🎰` **Casino**\n" +
            "> `🎰 Vslots       : Slot Machine`\n" +
            "> `🃏 Vblackjack   : Blackjack`\n" +
            "> `🎲 Vdice        : Dice`\n" +
            "> `🪙 Vcoinflip    : Coin Flip`\n\n" +

            "- `🎯` **Luck Games**\n" +
            "> `🎯 Vtaixiu      : Tài Xỉu`\n" +
            "> `💣 Vbomb        : Bomb Game`\n" +
            "> `🔢 Vguess       : Đoán số`\n" +
            "> `✊ Vrps         : Kéo Búa Bao`\n\n" +

            "🍀 `🎮` **Chơi vui • Quản lý Mora hợp lý**",

        footer:
            "☁️ Columbina • Mini Game"
    },

    // ========================================================
    // 🌿 ADVENTURE
    // ========================================================

    adventure: {
        title: "🌿 Phiêu Lưu",

        description:
            "☁️ `🍃` **Explore • Collect • Grow**\n\n" +

            "- `🎣` **Fishing**\n" +
            "> `🎣 Vfish        : Câu cá`\n" +
            "> `🐟` Thu thập cá và bán lấy Mora\n\n" +

            "- `🌾` **Farming**\n" +
            "> `🌱 Vfarm        : Trồng & thu hoạch`\n" +
            "> `🌾` Thu thập nông sản\n\n" +

            "- `📜` **Quest**\n" +
            "> `📜 Vquest       : Xem nhiệm vụ`\n" +
            "> `✨` Hoàn thành để nhận Mora & XP\n\n" +

            "- `🎒` **Inventory**\n" +
            "> `🎒 Vinventory   : Xem vật phẩm`\n" +
            "> `💸 Vsell        : Bán vật phẩm`",

        footer:
            "☁️ Columbina • Adventure"
    },

    // ========================================================
    // 👤 PROFILE
    // ========================================================

    profile: {
        title: "👤 Hành Trình",

        description:
            "☁️ `🍃` **Theo dõi hành trình của bạn**\n\n" +

            "- `👤` **Hồ sơ**\n" +
            "> `👤 Vprofile     : Hồ sơ cá nhân`\n" +
            "> `📈 Vstats       : Thống kê`\n\n" +

            "- `⭐` **Tiến trình**\n" +
            "> `🏆 Vachievement : Thành tựu`\n" +
            "> `🏆 Vleaderboard : Bảng xếp hạng`\n\n" +

            "- `🎒` **Tài sản**\n" +
            "> `🎒 Vinventory   : Túi vật phẩm`\n" +
            "> `🛒 Vshop        : Cửa hàng`\n\n" +

            "☕ `❄️` **Your journey • Your story**",

        footer:
            "☁️ Columbina • Your Journey"
    },

    // ========================================================
    // 📖 INFO
    // ========================================================

    info: {
        title: "📖 Thông Tin",

        description:
            "☁️ `🍃` **Một góc nhỏ của Columbina**\n\n" +

            "- `⚙️` **Hệ thống**\n" +
            "> `💰` Economy\n" +
            "> `🎮` Mini Game\n" +
            "> `🎣` Fishing\n" +
            "> `🌾` Farming\n" +
            "> `📜` Quest\n" +
            "> `🎒` Inventory\n" +
            "> `🏆` Achievement\n\n" +

            "- `⌨️` **Prefix**\n" +
            "> `V`\n\n" +

            "- `✨` **Ví dụ**\n" +
            "> `Vdaily` ・ `Vfish` ・ `Vfarm`\n" +
            "> `Vquest` ・ `Vprofile` ・ `Vstats`\n\n" +

            "☕ `❄️` **Chúc bạn có một hành trình thật đáng nhớ.**",

        footer:
            "☁️ Columbina • Cozy Corner"
    }
};

// ============================================================
// 🧩 TEXT HELPER
// ============================================================

function text(content) {
    return new TextDisplayBuilder()
        .setContent(content);
}

// ============================================================
// ─ SEPARATOR
// ============================================================

function separator() {
    return new SeparatorBuilder();
}

// ============================================================
// 🎨 CREATE COMPONENT V2 CONTAINER
// ============================================================

function createContainer(category, message) {

    const data =
        CATEGORIES[category] ||
        CATEGORIES.home;

    const name =
        message.author.globalName ||
        message.author.username ||
        "Traveler";

    const container =
        new ContainerBuilder()
            .setAccentColor(0xA8DCC0);

    // ========================================================
    // HEADER
    // ========================================================

    container.addTextDisplayComponents(
        text(
            [
                `# ${data.title}`,
                "",
                `> ☁️ **${name} · Columbina**`
            ].join("\n")
        )
    );

    // ========================================================
    // SEPARATOR
    // ========================================================

    container.addSeparatorComponents(
        separator()
    );

    // ========================================================
    // CONTENT
    // ========================================================

    container.addTextDisplayComponents(
        text(
            data.description
        )
    );

    // ========================================================
    // SEPARATOR
    // ========================================================

    container.addSeparatorComponents(
        separator()
    );

    // ========================================================
    // FOOTER
    // ========================================================

    container.addTextDisplayComponents(
        text(
            `> ${data.footer}`
        )
    );

    return container;
}

// ============================================================
// 📋 SELECT MENU
// ============================================================

function createMenu(selected = "home") {

    return new ActionRowBuilder()
        .addComponents(

            new StringSelectMenuBuilder()

                .setCustomId(
                    "columbina_help_menu"
                )

                .setPlaceholder(
                    "❄️ Chọn danh mục..."
                )

                .addOptions(

                    {
                        label:
                            "Trang chủ",

                        description:
                            "Tổng quan hành trình",

                        value:
                            "home",

                        emoji:
                            "🏠",

                        default:
                            selected === "home"
                    },

                    {
                        label:
                            "Economy",

                        description:
                            "Mora • Daily • Work • Shop",

                        value:
                            "economy",

                        emoji:
                            "💰",

                        default:
                            selected === "economy"
                    },

                    {
                        label:
                            "Mini Game",

                        description:
                            "Slots • Blackjack • Dice",

                        value:
                            "games",

                        emoji:
                            "🎮",

                        default:
                            selected === "games"
                    },

                    {
                        label:
                            "Adventure",

                        description:
                            "Fishing • Farming • Quest",

                        value:
                            "adventure",

                        emoji:
                            "🌿",

                        default:
                            selected === "adventure"
                    },

                    {
                        label:
                            "Hành trình",

                        description:
                            "Profile • Stats • Inventory",

                        value:
                            "profile",

                        emoji:
                            "👤",

                        default:
                            selected === "profile"
                    },

                    {
                        label:
                            "Thông tin",

                        description:
                            "Thông tin Columbina",

                        value:
                            "info",

                        emoji:
                            "📖",

                        default:
                            selected === "info"
                    }
                )
        );
}

// ============================================================
// 🚀 COMMAND
// ============================================================

module.exports = {

    name:
        "help",

    aliases: [
        "h",
        "commands",
        "vhelp"
    ],

    description:
        "Xem hướng dẫn sử dụng Columbina.",

    async execute(message) {

        // ====================================================
        // 🔐 USER ID
        // ====================================================

        const userId =
            message.author.id;

        // ====================================================
        // 📦 SEND COMPONENTS V2
        // ====================================================

        const msg =
            await message.reply({

                components: [

                    createContainer(
                        "home",
                        message
                    ),

                    createMenu(
                        "home"
                    )
                ],

                flags:
                    MessageFlags.IsComponentsV2
            });

        // ====================================================
        // 🎛️ COLLECTOR
        // ====================================================

        const collector =
            msg.createMessageComponentCollector({

                time:
                    180000
            });

        // ====================================================
        // 📋 COLLECT
        // ====================================================

        collector.on(
            "collect",
            async interaction => {

                try {

                    // ========================================
                    // 🔐 USER CHECK
                    // ========================================

                    if (
                        interaction.user.id !==
                        userId
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Đây không phải Help Center của bạn.",

                            flags:
                                MessageFlags.Ephemeral
                        });
                    }

                    // ========================================
                    // 📋 MENU CHECK
                    // ========================================

                    if (
                        interaction.customId !==
                        "columbina_help_menu"
                    ) {

                        return;
                    }

                    // ========================================
                    // 📌 GET CATEGORY
                    // ========================================

                    const category =
                        interaction.values?.[0];

                    // ========================================
                    // ❌ INVALID CATEGORY
                    // ========================================

                    if (
                        !category ||
                        !CATEGORIES[category]
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Danh mục không hợp lệ.",

                            flags:
                                MessageFlags.Ephemeral
                        });
                    }

                    // ========================================
                    // 🔄 UPDATE COMPONENTS V2
                    // ========================================

                    await interaction.update({

                        components: [

                            createContainer(
                                category,
                                message
                            ),

                            createMenu(
                                category
                            )
                        ],

                        flags:
                            MessageFlags.IsComponentsV2
                    });

                } catch (error) {

                    console.error(
                        "[Columbina Help] Interaction Error:",
                        error
                    );

                    // ========================================
                    // ⚠️ ERROR RESPONSE
                    // ========================================

                    if (
                        !interaction.replied &&
                        !interaction.deferred
                    ) {

                        await interaction.reply({

                            content:
                                "❌ Có lỗi xảy ra khi cập nhật Help Center.",

                            flags:
                                MessageFlags.Ephemeral

                        }).catch(
                            () => {}
                        );
                    }
                }
            }
        );

        // ====================================================
        // ⏰ COLLECTOR END
        // ====================================================

        collector.on(
            "end",
            async () => {

                try {

                    // ========================================
                    // 🧹 REMOVE MENU
                    // ========================================

                    await msg.edit({

                        components: [

                            createContainer(
                                "home",
                                message
                            )
                        ]
                    });

                } catch {
                    // Message đã bị xóa hoặc không còn tồn tại
                }
            }
        );
    }
};
