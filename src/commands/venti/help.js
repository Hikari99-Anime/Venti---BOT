const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const config =
    require("../../config");

const CATEGORIES = {
    home: {
        color: "#8FD3B6",
        title: "🍃 Venti Help Center",

        description:
            "Chào mừng đến với **Venti**.\n\n" +
            "Một bot **Economy • Adventure • Games** " +
            "nơi bạn có thể kiếm Mora, thu thập vật phẩm, " +
            "câu cá, làm nông và khám phá nhiều hoạt động khác.\n\n" +

            "✨ **Bắt đầu nhanh**\n" +
            "`Vdaily` → Nhận Mora\n" +
            "`Vfish` → Câu cá\n" +
            "`Vfarm` → Làm nông\n" +
            "`Vquest` → Nhiệm vụ\n\n" +

            "📖 Chọn danh mục bên dưới để xem toàn bộ lệnh.",

        footer:
            "Venti • Wandering Bard of Mondstadt"
    },

    economy: {
        color: "#F1C40F",
        title: "💰 Economy",

        description:
            "Quản lý Mora và xây dựng tài sản của bạn.\n\n" +

            "**💳 Wallet**\n" +
            "`Vbalance` — Xem số dư\n" +
            "`Vpay @user amount` — Chuyển Mora\n\n" +

            "**🎁 Rewards**\n" +
            "`Vdaily` — Phần thưởng mỗi ngày\n" +
            "`Vwork` — Làm việc kiếm Mora\n\n" +

            "**🛒 Trading**\n" +
            "`Vshop` — Mua vật phẩm\n" +
            "`Vsell` — Bán vật phẩm",

        footer:
            "💰 Economy • Earn • Save • Spend"
    },

    games: {
        color: "#9B59B6",
        title: "🎮 Minigames",

        description:
            "Thử vận may và kiếm thêm Mora.\n\n" +

            "`Vslots` — 🎰 Slot Machine\n" +
            "`Vcoinflip` — 🪙 Coin Flip\n" +
            "`Vdice` — 🎲 Dice\n" +
            "`Vblackjack` — 🃏 Blackjack\n\n" +

            "🍀 **Tip:** May mắn có thể thay đổi " +
            "số dư của bạn rất nhanh!",

        footer:
            "🎮 Games • Play responsibly"
    },

    adventure: {
        color: "#2ECC71",
        title: "🌿 Adventure",

        description:
            "Khám phá những hoạt động ngoài thành Mondstadt.\n\n" +

            "**🎣 Fishing**\n" +
            "`Vfish` — Câu cá và thu thập hải sản\n\n" +

            "**🌾 Farming**\n" +
            "`Vfarm` — Trồng và thu hoạch nông sản\n\n" +

            "**📜 Quest**\n" +
            "`Vquest` — Hoàn thành nhiệm vụ hằng ngày\n\n" +

            "✨ Hoạt động giúp bạn kiếm Mora, XP " +
            "và mở rộng bộ sưu tập.",

        footer:
            "🌿 Adventure • Explore Mondstadt"
    },

    venti: {
        color: "#3498DB",
        title: "🍃 Venti",

        description:
            "Các công cụ chính để quản lý hành trình của bạn.\n\n" +

            "`Vprofile` — 👤 Hồ sơ & tiến trình\n" +
            "`Vinventory` — 🎒 Túi vật phẩm\n" +
            "`Vshop` — 🛒 Cửa hàng\n" +
            "`Vsell` — 💸 Bán vật phẩm\n" +
            "`Vquest` — 📜 Nhiệm vụ\n\n" +

            "⭐ Theo dõi Level, XP, Mora, Daily Streak " +
            "và các hoạt động của bạn.",

        footer:
            "🍃 Venti • Your journey, your story"
    },

    info: {
        color: "#95A5A6",
        title: "📖 About Venti",

        description:
            "**🍃 Venti Bot**\n\n" +

            "Một bot Discord lấy cảm hứng từ " +
            "thế giới Mondstadt.\n\n" +

            "**Hệ thống chính**\n" +
            "💰 Economy\n" +
            "🎮 Minigames\n" +
            "🎣 Fishing\n" +
            "🌾 Farming\n" +
            "📜 Quest\n" +
            "🎒 Inventory\n" +
            "⭐ Level & XP\n\n" +

            "**Prefix**\n" +
            "`V`\n\n" +

            "Ví dụ: `Vdaily`, `Vfish`, `Vprofile`",

        footer:
            "🍃 Venti • Wandering Bard"
    }
};

// ==========================================
// 🏠 CREATE EMBED
// ==========================================

function createEmbed(
    category
) {
    const data =
        CATEGORIES[
            category
        ] ||
        CATEGORIES.home;

    return new EmbedBuilder()
        .setColor(
            data.color
        )
        .setTitle(
            data.title
        )
        .setDescription(
            data.description
        )
        .setFooter({
            text:
                data.footer
        })
        .setTimestamp();
}

// ==========================================
// 📋 SELECT MENU
// ==========================================

function createMenu(
    selected = "home"
) {
    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    "venti_help_menu"
                )
                .setPlaceholder(
                    "🍃 Chọn danh mục..."
                )
                .addOptions(
                    {
                        label:
                            "Trang chủ",
                        description:
                            "Tổng quan về Venti",
                        value:
                            "home",
                        emoji:
                            "🏠",
                        default:
                            selected ===
                            "home"
                    },

                    {
                        label:
                            "Economy",
                        description:
                            "Mora, Daily, Work & Shop",
                        value:
                            "economy",
                        emoji:
                            "💰",
                        default:
                            selected ===
                            "economy"
                    },

                    {
                        label:
                            "Minigames",
                        description:
                            "Slots, Dice, Coinflip & Blackjack",
                        value:
                            "games",
                        emoji:
                            "🎮",
                        default:
                            selected ===
                            "games"
                    },

                    {
                        label:
                            "Adventure",
                        description:
                            "Fishing, Farming & Quest",
                        value:
                            "adventure",
                        emoji:
                            "🌿",
                        default:
                            selected ===
                            "adventure"
                    },

                    {
                        label:
                            "Venti",
                        description:
                            "Profile, Inventory & Tools",
                        value:
                            "venti",
                        emoji:
                            "🍃",
                        default:
                            selected ===
                            "venti"
                    },

                    {
                        label:
                            "Thông tin",
                        description:
                            "Giới thiệu về Venti",
                        value:
                            "info",
                        emoji:
                            "📖",
                        default:
                            selected ===
                            "info"
                    }
                )
        );
}

// ==========================================
// 🚀 COMMAND
// ==========================================

module.exports = {
    name:
        "help",

    aliases: [
        "h",
        "commands",
        "vhelp"
    ],

    description:
        "Xem hướng dẫn sử dụng Venti.",

    async execute(
        message
    ) {
        const msg =
            await message.reply({
                embeds: [
                    createEmbed(
                        "home"
                    )
                ],
                components: [
                    createMenu(
                        "home"
                    )
                ]
            });

        const collector =
            msg.createMessageComponentCollector({
                time:
                    180000
            });

        collector.on(
            "collect",
            async interaction => {
                if (
                    interaction.customId !==
                    "venti_help_menu"
                ) {
                    return;
                }

                const category =
                    interaction
                        .values[0];

                await interaction.update({
                    embeds: [
                        createEmbed(
                            category
                        )
                    ],
                    components: [
                        createMenu(
                            category
                        )
                    ]
                });
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

