
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

// ==========================================
// 📚 HELP DATA
// ==========================================

const CATEGORIES = {
    home: {
        color: "#8FD3B6",
        title: "🍃 Venti Help",

        description:
            "☁️ `🍃` **Xin chào, Traveler!**\n" +
            "・ Venti là bot **Economy • Games • Adventure**\n" +
            "・ Kiếm Mora, nâng Level và khám phá hành trình.\n\n" +

            "● `🚀` **Bắt đầu**\n" +
            "> `💰 Vdaily` ・ Nhận Daily Reward\n" +
            "> `💼 Vwork` ・ Làm việc kiếm Mora\n" +
            "> `🎣 Vfish` ・ Câu cá\n" +
            "> `🌾 Vfarm` ・ Làm nông\n" +
            "> `📜 Vquest` ・ Làm nhiệm vụ\n" +
            "> `👤 Vprofile` ・ Xem hồ sơ\n\n" +

            "● `🎮` **Minigames**\n" +
            "> `🎰 Vslots` ・ Slot Machine\n" +
            "> `🪙 Vcoinflip` ・ Coin Flip\n" +
            "> `🎲 Vdice` ・ Dice\n" +
            "> `🃏 Vblackjack` ・ Blackjack\n" +
            "> `🎯 Vtaixiu` ・ Tài Xỉu\n" +
            "> `💣 Vbomb` ・ Bomb Game\n\n" +

            "● `📖` **Khám phá**\n" +
            "> `💰 Economy` ・ Mora & giao dịch\n" +
            "> `🎮 Minigames` ・ Trò chơi\n" +
            "> `🌿 Adventure` ・ Fishing & Farming\n" +
            "> `🍃 Venti` ・ Profile & Inventory\n\n" +

            "☕ `🍃` **Chọn danh mục bên dưới để xem chi tiết.**",

        footer:
            "☁️ Venti ・ Help Center 🍃"
    },

    // ==========================================
    // 💰 ECONOMY
    // ==========================================

    economy: {
        color: "#F1C40F",
        title: "💰 Economy",

        description:
            "☁️ `💰` **Economy System**\n" +
            "・ Quản lý Mora và xây dựng tài sản.\n\n" +

            "● `💳` **Money**\n" +
            "> `💰 Vbalance` ・ Xem số dư\n" +
            "> `💸 Vpay @user <amount>` ・ Chuyển Mora\n" +
            "> `🏦 Vdeposit <amount>` ・ Gửi ngân hàng\n" +
            "> `🏦 Vwithdraw <amount>` ・ Rút ngân hàng\n\n" +

            "● `🎁` **Rewards**\n" +
            "> `📅 Vdaily` ・ Daily Reward\n" +
            "> `💼 Vwork` ・ Làm việc kiếm Mora\n\n" +

            "● `🛒` **Shop**\n" +
            "> `🛍️ Vshop` ・ Xem cửa hàng\n" +
            "> `🛒 Vbuy <item> [amount]` ・ Mua item\n" +
            "> `💸 Vsell` ・ Bán vật phẩm\n\n" +

            "● `📊` **Progress**\n" +
            "> `👤 Vprofile` ・ Hồ sơ\n" +
            "> `📈 Vstats` ・ Thống kê\n" +
            "> `🏆 Vleaderboard` ・ Bảng xếp hạng\n\n" +

            "🍃 `💰` **Earn ・ Save ・ Spend ・ Grow**",

        footer:
            "💰 Venti ・ Economy"
    },

    // ==========================================
    // 🎮 GAMES
    // ==========================================

    games: {
        color: "#9B59B6",
        title: "🎮 Minigames",

        description:
            "☁️ `🎮` **Minigame Center**\n" +
            "・ Dùng Mora để thử vận may của bạn.\n\n" +

            "● `🎰` **Casino**\n" +
            "> `🎰 Vslots <amount>` ・ Slot Machine\n" +
            "> `🪙 Vcoinflip <amount>` ・ Coin Flip\n" +
            "> `🎲 Vdice <amount>` ・ Dice\n" +
            "> `🃏 Vblackjack <amount>` ・ Blackjack\n\n" +

            "● `🎯` **Luck Games**\n" +
            "> `🎯 Vtaixiu <amount>` ・ Tài Xỉu\n" +
            "> `💣 Vbomb <amount>` ・ Bomb Game\n\n" +

            "● `📊` **Statistics**\n" +
            "> `📈 Vstats` ・ Games / Wins / Losses\n" +
            "> `🏆 Vleaderboard` ・ Top người chơi\n\n" +

            "● `🍀` **Lưu ý**\n" +
            "> `💰` Mỗi game có phần thưởng khác nhau.\n" +
            "> `🎲` Hãy quản lý Mora hợp lý.\n\n" +

            "☘️ `🎮` **Good luck, Traveler!**",

        footer:
            "🎮 Venti ・ Minigames"
    },

    // ==========================================
    // 🌿 ADVENTURE
    // ==========================================

    adventure: {
        color: "#2ECC71",
        title: "🌿 Adventure",

        description:
            "☁️ `🌿` **Adventure System**\n" +
            "・ Thu thập, khám phá và phát triển nhân vật.\n\n" +

            "● `🎣` **Fishing**\n" +
            "> `🎣 Vfish` ・ Câu cá\n" +
            "> `🐟` Thu thập nhiều loại cá\n" +
            "> `🎒 Vinventory` ・ Xem cá & vật phẩm\n" +
            "> `💸 Vsell` ・ Bán cá lấy Mora\n\n" +

            "● `🌾` **Farming**\n" +
            "> `🌱 Vfarm` ・ Trồng & thu hoạch\n" +
            "> `🎒 Vinventory` ・ Xem nông sản\n" +
            "> `💸 Vsell` ・ Bán nông sản\n\n" +

            "● `📜` **Quest**\n" +
            "> `📜 Vquest` ・ Xem nhiệm vụ\n" +
            "> `🎯` Hoàn thành quest nhận thưởng\n" +
            "> `✨` Nhận Mora & XP\n\n" +

            "● `🏆` **Progress**\n" +
            "> `👤 Vprofile` ・ Level & XP\n" +
            "> `🏆 Vachievement` ・ Thành tích\n" +
            "> `📈 Vstats` ・ Thống kê\n\n" +

            "🍃 `🌿` **Explore ・ Collect ・ Grow**",

        footer:
            "🌿 Venti ・ Adventure"
    },

    // ==========================================
    // 🍃 VENTI
    // ==========================================

    venti: {
        color: "#3498DB",
        title: "🍃 Venti Tools",

        description:
            "☁️ `🍃` **Your Venti Tools**\n" +
            "・ Những lệnh giúp quản lý hành trình.\n\n" +

            "● `👤` **Profile**\n" +
            "> `👤 Vprofile` ・ Hồ sơ cá nhân\n" +
            "> `📈 Vstats` ・ Thống kê hành trình\n\n" +

            "● `🎒` **Inventory**\n" +
            "> `🎒 Vinventory` ・ Túi vật phẩm\n" +
            "> `💸 Vsell` ・ Bán vật phẩm\n" +
            "> `🛒 Vshop` ・ Cửa hàng\n" +
            "> `💰 Vbuy <item> [amount]` ・ Mua item\n\n" +

            "● `🏆` **Achievement**\n" +
            "> `🏆 Vachievement` ・ Thành tích\n" +
            "> `⭐` Theo dõi milestone\n\n" +

            "● `🏆` **Leaderboard**\n" +
            "> `🏆 Vleaderboard` ・ Bảng xếp hạng\n" +
            "> `💰` Top Mora\n" +
            "> `⭐` Top Level\n" +
            "> `🎣` Top Fishing\n" +
            "> `🌾` Top Farming\n" +
            "> `🔥` Top Daily\n" +
            "> `📜` Top Quest\n\n" +

            "☁️ `🍃` **Your journey ・ Your story**",

        footer:
            "🍃 Venti ・ Your Journey"
    },

    // ==========================================
    // 📖 INFO
    // ==========================================

    info: {
        color: "#95A5A6",
        title: "📖 About Venti",

        description:
            "☁️ `🍃` **About Venti**\n" +
            "・ Một bot Discord lấy cảm hứng từ Mondstadt.\n" +
            "・ Mang phong cách nhẹ nhàng của một Wandering Bard.\n\n" +

            "● `⚙️` **Systems**\n" +
            "> `💰` Economy\n" +
            "> `🎮` Minigames\n" +
            "> `🎣` Fishing\n" +
            "> `🌾` Farming\n" +
            "> `📜` Quest\n" +
            "> `🎒` Inventory\n" +
            "> `🏆` Achievement\n" +
            "> `⭐` Level & XP\n" +
            "> `📊` Leaderboard\n\n" +

            "● `⌨️` **Prefix**\n" +
            "> `V`\n\n" +

            "● `✨` **Examples**\n" +
            "> `Vdaily`\n" +
            "> `Vfish`\n" +
            "> `Vfarm`\n" +
            "> `Vquest`\n" +
            "> `Vprofile`\n" +
            "> `Vslots 100`\n\n" +

            "☕ `🍃` **Wandering Bard of Mondstadt**",

        footer:
            "☁️ Venti ・ Wandering Bard 🍃"
    }
};

// ==========================================
// 🏠 EMBED
// ==========================================

function createEmbed(category, message) {
    const data =
        CATEGORIES[category] ||
        CATEGORIES.home;

    return new EmbedBuilder()
        .setColor(data.color)

        .setAuthor({
            name:
                `${message.author.globalName || message.author.username} ・ Venti`,
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
            text: data.footer
        })

        .setTimestamp();
}

// ==========================================
// 📋 MENU
// ==========================================

function createMenu(selected = "home") {
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
                        label: "Trang chủ",
                        description:
                            "Tổng quan Venti",
                        value: "home",
                        emoji: "🏠",
                        default:
                            selected === "home"
                    },

                    {
                        label: "Economy",
                        description:
                            "Mora ・ Daily ・ Work ・ Shop",
                        value: "economy",
                        emoji: "💰",
                        default:
                            selected === "economy"
                    },

                    {
                        label: "Minigames",
                        description:
                            "Slots ・ Dice ・ Games",
                        value: "games",
                        emoji: "🎮",
                        default:
                            selected === "games"
                    },

                    {
                        label: "Adventure",
                        description:
                            "Fishing ・ Farming ・ Quest",
                        value: "adventure",
                        emoji: "🌿",
                        default:
                            selected === "adventure"
                    },

                    {
                        label: "Venti",
                        description:
                            "Profile ・ Inventory ・ Tools",
                        value: "venti",
                        emoji: "🍃",
                        default:
                            selected === "venti"
                    },

                    {
                        label: "Thông tin",
                        description:
                            "Thông tin về Venti",
                        value: "info",
                        emoji: "📖",
                        default:
                            selected === "info"
                    }
                )
        );
}

// ==========================================
// 🚀 COMMAND
// ==========================================

module.exports = {
    name: "help",

    aliases: [
        "h",
        "commands",
        "vhelp"
    ],

    description:
        "Xem hướng dẫn sử dụng Venti.",

    async execute(message) {
        const userId =
            message.author.id;

        const msg =
            await message.reply({
                embeds: [
                    createEmbed(
                        "home",
                        message
                    )
                ],

                components: [
                    createMenu("home")
                ]
            });

        const collector =
            msg.createMessageComponentCollector({
                time: 180000
            });

        collector.on(
            "collect",
            async interaction => {
                try {
                    if (
                        interaction.customId !==
                        "venti_help_menu"
                    ) {
                        return;
                    }

                    if (
                        interaction.user.id !==
                        userId
                    ) {
                        if (
                            interaction.replied ||
                            interaction.deferred
                        ) {
                            return;
                        }

                        return interaction.reply({
                            content:
                                "❌ Đây không phải Help Center của bạn.",
                            ephemeral: true
                        });
                    }

                    const category =
                        interaction.values?.[0];

                    if (
                        !category ||
                        !CATEGORIES[category]
                    ) {
                        if (
                            !interaction.replied &&
                            !interaction.deferred
                        ) {
                            return interaction.reply({
                                content:
                                    "❌ Danh mục không hợp lệ.",
                                ephemeral: true
                            });
                        }

                        return;
                    }

                    // ACK interaction trước
                    await interaction.deferUpdate();

                    await msg.edit({
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
                } catch (error) {
                    console.error(
                        "Help Interaction Error:",
                        error
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
    }
};

