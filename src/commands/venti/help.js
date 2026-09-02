
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

// ==========================================
// 📚 HELP CATEGORIES
// ==========================================

const CATEGORIES = {
    home: {
        color: "#8FD3B6",
        title: "🍃 Venti Help Center",

        description:
            "୨୧ ─────────────── ୨୧\n" +
            "☁️ `🍃` **Chào mừng đến với Venti**\n" +
            "୨୧ ─────────────── ୨୧\n\n" +

            "Một bot **Economy • Adventure • Games** " +
            "để bạn kiếm Mora, nâng Level, câu cá, " +
            "làm nông và khám phá hành trình của riêng mình.\n\n" +

            "● `🚀` **Bắt đầu nhanh**\n" +
            "> `💰 Vdaily` — Nhận phần thưởng mỗi ngày\n" +
            "> `💼 Vwork` — Làm việc kiếm Mora\n" +
            "> `🎣 Vfish` — Câu cá\n" +
            "> `🌾 Vfarm` — Làm nông\n" +
            "> `📜 Vquest` — Làm nhiệm vụ\n" +
            "> `👤 Vprofile` — Xem hồ sơ\n\n" +

            "● `📖` **Khám phá thêm**\n" +
            "> `💰 Economy` — Mora & giao dịch\n" +
            "> `🎮 Minigames` — Các trò chơi\n" +
            "> `🌿 Adventure` — Fishing, Farming & Quest\n" +
            "> `👤 Venti` — Profile & Inventory\n" +
            "> `ℹ️ Thông tin` — Giới thiệu Venti\n\n" +

            "୨୧ ─────────────── ୨୧\n" +
            "☕ `🍃` **Chọn danh mục bên dưới để xem lệnh**",

        footer:
            "☁️ Venti • Help Center 🍃"
    },

    // ==========================================
    // 💰 ECONOMY
    // ==========================================

    economy: {
        color: "#F1C40F",
        title: "💰 Venti Economy",

        description:
            "୨୧ ─────────────── ୨୧\n" +
            "💰 `🍃` **Economy System**\n" +
            "୨୧ ─────────────── ୨୧\n\n" +

            "● `💵` **Ví & Tài sản**\n" +
            "> `💰 Vbalance` — Xem số dư Mora\n" +
            "> `💸 Vpay @user <amount>` — Chuyển Mora\n" +
            "> `🏦 Vdeposit <amount>` — Gửi Mora vào ngân hàng\n" +
            "> `🏦 Vwithdraw <amount>` — Rút Mora khỏi ngân hàng\n\n" +

            "● `🎁` **Rewards**\n" +
            "> `📅 Vdaily` — Nhận Daily Reward\n" +
            "> `💼 Vwork` — Làm việc kiếm Mora\n\n" +

            "● `🛒` **Trading**\n" +
            "> `🛍️ Vshop` — Xem cửa hàng\n" +
            "> `🛒 Vbuy <item> [amount]` — Mua vật phẩm\n" +
            "> `💸 Vsell` — Bán vật phẩm\n\n" +

            "● `⭐` **Progress**\n" +
            "> `👤 Vprofile` — Xem tài sản & Level\n" +
            "> `📊 Vstats` — Xem thống kê hành trình\n" +
            "> `🏆 Vleaderboard` — Xem bảng xếp hạng\n\n" +

            "୨୧ ─────────────── ୨୧\n" +
            "💰 `🍃` **Earn • Save • Spend • Grow**",

        footer:
            "💰 Venti Economy • Mora System"
    },

    // ==========================================
    // 🎮 GAMES
    // ==========================================

    games: {
        color: "#9B59B6",
        title: "🎮 Venti Minigames",

        description:
            "୨୧ ─────────────── ୨୧\n" +
            "🎮 `🍃` **Minigame Center**\n" +
            "୨୧ ─────────────── ୨୧\n\n" +

            "● `🎰` **Casino**\n" +
            "> `🎰 Vslots <amount>` — Slot Machine\n" +
            "> `🪙 Vcoinflip <amount>` — Coin Flip\n" +
            "> `🎲 Vdice <amount>` — Dice\n" +
            "> `🃏 Vblackjack <amount>` — Blackjack\n\n" +

            "● `🏆` **Game Stats**\n" +
            "> `📊 Vstats` — Xem Games / Wins / Losses\n" +
            "> `🏆 Vleaderboard` — Top người chơi\n\n" +

            "● `🍀` **Lưu ý**\n" +
            "> `💰` Phần thưởng và kết quả phụ thuộc vào từng game.\n" +
            "> `🎲` Hãy chơi có trách nhiệm và quản lý Mora của bạn.\n\n" +

            "୨୧ ─────────────── ୨୧\n" +
            "🍀 `🎮` **Good luck, Traveler!**",

        footer:
            "🎮 Venti Games • Good luck!"
    },

    // ==========================================
    // 🌿 ADVENTURE
    // ==========================================

    adventure: {
        color: "#2ECC71",
        title: "🌿 Venti Adventure",

        description:
            "୨୧ ─────────────── ୨୧\n" +
            "🌿 `🍃` **Adventure System**\n" +
            "୨୧ ─────────────── ୨୧\n\n" +

            "● `🎣` **Fishing**\n" +
            "> `🎣 Vfish` — Câu cá\n" +
            "> `🐟 Vfish` — Thu thập các loại cá\n" +
            "> `🎒 Vinventory` — Xem cá và vật phẩm đang có\n" +
            "> `💸 Vsell` — Bán cá lấy Mora\n\n" +

            "● `🌾` **Farming**\n" +
            "> `🌱 Vfarm` — Trồng và thu hoạch\n" +
            "> `🎒 Vinventory` — Xem nông sản\n" +
            "> `💸 Vsell` — Bán nông sản\n\n" +

            "● `📜` **Quest**\n" +
            "> `📜 Vquest` — Xem nhiệm vụ\n" +
            "> `🎯` Hoàn thành quest để nhận phần thưởng\n" +
            "> `✨` Quest giúp tăng tiến trình hành trình\n\n" +

            "● `⭐` **Progress**\n" +
            "> `⭐ Vprofile` — Level & XP\n" +
            "> `🏆 Vachievement` — Thành tích\n" +
            "> `📊 Vstats` — Thống kê\n\n" +

            "୨୧ ─────────────── ୨୧\n" +
            "🌿 `🍃` **Explore • Collect • Grow**",

        footer:
            "🌿 Venti Adventure • Explore Mondstadt"
    },

    // ==========================================
    // 🍃 VENTI
    // ==========================================

    venti: {
        color: "#3498DB",
        title: "🍃 Venti Tools",

        description:
            "୨୧ ─────────────── ୨୧\n" +
            "🍃 `☁️` **Your Venti Tools**\n" +
            "୨୧ ─────────────── ୨୧\n\n" +

            "● `👤` **Profile**\n" +
            "> `👤 Vprofile` — Hồ sơ cá nhân\n" +
            "> `📊 Vstats` — Thống kê hành trình\n\n" +

            "● `🎒` **Inventory**\n" +
            "> `🎒 Vinventory` — Xem toàn bộ vật phẩm\n" +
            "> `💸 Vsell` — Bán vật phẩm\n" +
            "> `🛒 Vshop` — Xem shop\n" +
            "> `💰 Vbuy <item> [amount]` — Mua item\n\n" +

            "● `🏆` **Achievements**\n" +
            "> `🏆 Vachievement` — Thành tích\n" +
            "> `⭐` Theo dõi các milestone đã đạt\n\n" +

            "● `📊` **Leaderboard**\n" +
            "> `🏆 Vleaderboard` — Bảng xếp hạng\n" +
            "> `💰` Top Mora\n" +
            "> `⭐` Top Level\n" +
            "> `🎣` Top Fishing\n" +
            "> `🌾` Top Farming\n" +
            "> `🔥` Top Daily\n" +
            "> `📜` Top Quest\n\n" +

            "୨୧ ─────────────── ୨୧\n" +
            "☁️ `🍃` **Your journey • Your story**",

        footer:
            "🍃 Venti • Your Journey"
    },

    // ==========================================
    // 📊 INFORMATION
    // ==========================================

    info: {
        color: "#95A5A6",
        title: "📖 About Venti",

        description:
            "୨୧ ─────────────── ୨୧\n" +
            "📖 `🍃` **About Venti**\n" +
            "୨୧ ─────────────── ୨୧\n\n" +

            "● `🍃` **Venti Bot**\n" +
            "> `☁️` Discord bot lấy cảm hứng từ Mondstadt.\n" +
            "> `🎵` Mang phong cách nhẹ nhàng của một Wandering Bard.\n\n" +

            "● `⚙️` **Hệ thống**\n" +
            "> `💰` Economy\n" +
            "> `🎮` Minigames\n" +
            "> `🎣` Fishing\n" +
            "> `🌾` Farming\n" +
            "> `📜` Quest\n" +
            "> `🎒` Inventory\n" +
            "> `🏆` Achievements\n" +
            "> `⭐` Level & XP\n" +
            "> `🏆` Leaderboard\n\n" +

            "● `⌨️` **Prefix**\n" +
            "> `V`\n\n" +

            "● `✨` **Ví dụ**\n" +
            "> `Vdaily`\n" +
            "> `Vfish`\n" +
            "> `Vfarm`\n" +
            "> `Vquest`\n" +
            "> `Vprofile`\n\n" +

            "୨୧ ─────────────── ୨୧\n" +
            "☕ `🍃` **Wandering Bard of Mondstadt**",

        footer:
            "☁️ Venti • Wandering Bard 🍃"
    }
};

// ==========================================
// 🏠 CREATE EMBED
// ==========================================

function createEmbed(
    category,
    message
) {
    const data =
        CATEGORIES[category] ||
        CATEGORIES.home;

    return new EmbedBuilder()
        .setColor(data.color)

        .setAuthor({
            name:
                `${message.author.globalName || message.author.username} · Venti`,
            iconURL:
                message.author.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        })

        .setTitle(data.title)

        .setDescription(
            data.description
        )

        .setThumbnail(
            message.author.displayAvatarURL({
                extension: "png",
                size: 256
            })
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

                .addOptions([
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
                            "Mora • Daily • Work • Shop",
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
                            "Slots • Dice • Coinflip • Blackjack",
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
                            "Fishing • Farming • Quest",
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
                            "Profile • Inventory • Tools",
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
                ])
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
                        "home",
                        message
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

                // Không cho người khác điều khiển
                if (
                    interaction.user.id !==
                    message.author.id
                ) {
                    return interaction.reply({
                        content:
                            "❌ Đây không phải Help Center của bạn.",
                        ephemeral:
                            true
                    });
                }

                const category =
                    interaction.values[0];

                if (
                    !CATEGORIES[
                        category
                    ]
                ) {
                    return interaction.reply({
                        content:
                            "❌ Danh mục không hợp lệ.",
                        ephemeral:
                            true
                    });
                }

                await interaction.update({
                    embeds: [
                        createEmbed(
                            category,
                            message
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

