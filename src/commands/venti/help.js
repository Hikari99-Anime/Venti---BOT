
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

// ==========================================
// 📚 HELP DATA
// ==========================================

const CATEGORIES = {

    // ==========================================
    // 🏠 HOME
    // ==========================================

    home: {
        title: "❄️ Trung Tâm Hướng Dẫn",

        description:
            "☁️ `❄️` **Một góc nhỏ của hành trình**\n" +
            "・ Columbina • Economy • Minigames • Adventure\n\n" +

            "- `🚀` **Bắt đầu**\n" +
            "> `💰 Vdaily`        ・ Nhận Daily Reward\n" +
            "> `💼 Vwork`         ・ Làm việc kiếm Mora\n" +
            "> `👤 Vprofile`      ・ Xem hồ sơ\n" +
            "> `📈 Vstats`        ・ Xem thống kê\n\n" +

            "- `💰` **Tài chính**\n" +
            "> `💰 Vbalance`      ・ Xem số dư\n" +
            "> `💸 Vpay @user <amount>` ・ Chuyển Mora\n" +
            "> `🏦 Vdeposit <amount>` ・ Gửi ngân hàng\n" +
            "> `🏦 Vwithdraw <amount>` ・ Rút ngân hàng\n" +
            "> `🛒 Vshop`         ・ Xem cửa hàng\n" +
            "> `💰 Vbuy <item> [amount]` ・ Mua vật phẩm\n" +
            "> `💸 Vsell`         ・ Bán vật phẩm\n\n" +

            "- `🎮` **Mini Game**\n" +
            "> `🎰 Vslots <amount>`       ・ Slot Machine\n" +
            "> `🪙 Vcoinflip <amount>`    ・ Coin Flip\n" +
            "> `🎲 Vdice <amount>`        ・ Dice\n" +
            "> `🃏 Vblackjack <amount>`   ・ Blackjack\n" +
            "> `🎯 Vtaixiu <amount>`      ・ Tài Xỉu\n" +
            "> `💣 Vbomb <amount>`        ・ Bomb Game\n" +
            "> `🔢 Vguess <amount> [attempts]` ・ Đoán số\n" +
            "> `✊ Vrps <amount>`         ・ Kéo Búa Bao\n\n" +

            "- `🌿` **Phiêu lưu**\n" +
            "> `🎣 Vfish`         ・ Câu cá\n" +
            "> `🌾 Vfarm`         ・ Trồng & thu hoạch\n" +
            "> `📜 Vquest`        ・ Làm nhiệm vụ\n" +
            "> `🎒 Vinventory`    ・ Xem vật phẩm\n" +
            "> `🏆 Vachievement`  ・ Thành tựu\n" +
            "> `🏆 Vleaderboard`  ・ Bảng xếp hạng\n\n" +

            "☕ `❄️` **Chúc bạn có một hành trình thật chill.**",

        footer:
            "☁️ Columbina • Help Center"
    },

    // ==========================================
    // 💰 ECONOMY
    // ==========================================

    economy: {
        title: "💰 Kinh Tế",

        description:
            "☁️ `💰` **Economy System**\n" +
            "・ Quản lý Mora và xây dựng tài sản.\n\n" +

            "- `💵` **Tài chính**\n" +
            "> `💰 Vbalance`             ・ Xem số dư\n" +
            "> `💸 Vpay @user <amount>`  ・ Chuyển Mora\n" +
            "> `🏦 Vdeposit <amount>`    ・ Gửi ngân hàng\n" +
            "> `🏦 Vwithdraw <amount>`   ・ Rút ngân hàng\n\n" +

            "- `🎁` **Phần thưởng**\n" +
            "> `📅 Vdaily`               ・ Daily Reward\n" +
            "> `💼 Vwork`                ・ Làm việc kiếm Mora\n\n" +

            "- `🛒` **Cửa hàng**\n" +
            "> `🛍️ Vshop`                ・ Xem cửa hàng\n" +
            "> `🛒 Vbuy <item> [amount]` ・ Mua vật phẩm\n" +
            "> `💸 Vsell`                ・ Bán vật phẩm\n\n" +

            "- `📊` **Tiến trình**\n" +
            "> `👤 Vprofile`             ・ Hồ sơ cá nhân\n" +
            "> `📈 Vstats`               ・ Thống kê hành trình\n" +
            "> `🏆 Vleaderboard`         ・ Bảng xếp hạng\n\n" +

            "☕ `💰` **Earn • Save • Spend • Grow**",

        footer:
            "☁️ Columbina • Economy"
    },

    // ==========================================
    // 🎮 GAMES
    // ==========================================

    games: {
        title: "🎮 Mini Game",

        description:
            "☁️ `🎮` **Mini Game Center**\n" +
            "・ Dùng Mora để thử vận may.\n\n" +

            "- `🎰` **Casino**\n" +
            "> `🎰 Vslots <amount>`       ・ Slot Machine\n" +
            "> `🪙 Vcoinflip <amount>`    ・ Coin Flip\n" +
            "> `🎲 Vdice <amount>`        ・ Dice\n" +
            "> `🃏 Vblackjack <amount>`   ・ Blackjack\n\n" +

            "- `🎯` **Luck Games**\n" +
            "> `🎯 Vtaixiu <amount>`      ・ Tài Xỉu\n" +
            "> `💣 Vbomb <amount>`        ・ Bomb Game\n" +
            "> `🔢 Vguess <amount> [attempts]` ・ Đoán số\n" +
            "> `✊ Vrps <amount>`         ・ Kéo Búa Bao\n\n" +

            "- `📊` **Thống kê**\n" +
            "> `📈 Vstats`               ・ Games / Wins / Losses\n" +
            "> `🏆 Vleaderboard`         ・ Top người chơi\n\n" +

            "- `🍀` **Lưu ý**\n" +
            "> `💰` Mỗi game có cơ chế thưởng riêng.\n" +
            "> `🎲` Kết quả game phụ thuộc vào may mắn.\n" +
            "> `⚠️` Hãy quản lý Mora hợp lý.\n\n" +

            "☘️ `🎮` **Good luck, Traveler!**",

        footer:
            "☁️ Columbina • Mini Game"
    },

    // ==========================================
    // 🌿 ADVENTURE
    // ==========================================

    adventure: {
        title: "🌿 Phiêu Lưu",

        description:
            "☁️ `🌿` **Adventure System**\n" +
            "・ Thu thập, khám phá và phát triển hành trình.\n\n" +

            "- `🎣` **Fishing**\n" +
            "> `🎣 Vfish`         ・ Câu cá\n" +
            "> `🐟` Thu thập nhiều loại cá\n" +
            "> `🎒 Vinventory`    ・ Xem vật phẩm\n" +
            "> `💸 Vsell`         ・ Bán cá lấy Mora\n\n" +

            "- `🌾` **Farming**\n" +
            "> `🌱 Vfarm`         ・ Trồng & thu hoạch\n" +
            "> `🎒 Vinventory`    ・ Xem nông sản\n" +
            "> `💸 Vsell`         ・ Bán nông sản\n\n" +

            "- `📜` **Quest**\n" +
            "> `📜 Vquest`        ・ Xem nhiệm vụ\n" +
            "> `🎯` Hoàn thành quest nhận thưởng\n" +
            "> `✨` Nhận Mora & XP\n\n" +

            "- `🏆` **Tiến trình**\n" +
            "> `👤 Vprofile`      ・ Level & XP\n" +
            "> `🏆 Vachievement`  ・ Thành tựu\n" +
            "> `📈 Vstats`        ・ Thống kê\n\n" +

            "☕ `🌿` **Explore • Collect • Grow**",

        footer:
            "☁️ Columbina • Adventure"
    },

    // ==========================================
    // 👤 PROFILE
    // ==========================================

    profile: {
        title: "👤 Hồ Sơ & Hành Trình",

        description:
            "☁️ `👤` **Your Journey**\n" +
            "・ Theo dõi toàn bộ hành trình của bạn.\n\n" +

            "- `👤` **Hồ sơ**\n" +
            "> `👤 Vprofile`      ・ Hồ sơ cá nhân\n" +
            "> `📈 Vstats`        ・ Thống kê hành trình\n\n" +

            "- `🎒` **Inventory**\n" +
            "> `🎒 Vinventory`    ・ Túi vật phẩm\n" +
            "> `💸 Vsell`         ・ Bán vật phẩm\n" +
            "> `🛒 Vshop`         ・ Cửa hàng\n" +
            "> `💰 Vbuy <item> [amount]` ・ Mua vật phẩm\n\n" +

            "- `🏆` **Thành tựu**\n" +
            "> `🏆 Vachievement`  ・ Thành tích\n\n" +

            "- `🏅` **Bảng xếp hạng**\n" +
            "> `🏆 Vleaderboard`  ・ Bảng xếp hạng\n" +
            "> `💰` Top Mora\n" +
            "> `⭐` Top Level\n" +
            "> `🎣` Top Fishing\n" +
            "> `🌾` Top Farming\n" +
            "> `🔥` Top Daily\n" +
            "> `📜` Top Quest\n\n" +

            "☕ `❄️` **Your journey • Your story**",

        footer:
            "☁️ Columbina • Your Journey"
    },

    // ==========================================
    // 📖 INFO
    // ==========================================

    info: {
        title: "📖 Thông Tin Columbina",

        description:
            "☁️ `❄️` **About Columbina**\n" +
            "・ Bot Discord kết hợp Economy, Minigames và Adventure.\n" +
            "・ Xây dựng hành trình của riêng bạn qua Mora, XP và thành tựu.\n\n" +

            "- `⚙️` **Hệ thống**\n" +
            "> `💰` Economy\n" +
            "> `🎮` Mini Game\n" +
            "> `🎣` Fishing\n" +
            "> `🌾` Farming\n" +
            "> `📜` Quest\n" +
            "> `🎒` Inventory\n" +
            "> `🏆` Achievement\n" +
            "> `⭐` Level & XP\n" +
            "> `📊` Leaderboard\n\n" +

            "- `⌨️` **Prefix**\n" +
            "> `V`\n\n" +

            "- `✨` **Ví dụ**\n" +
            "> `Vdaily`\n" +
            "> `Vfish`\n" +
            "> `Vfarm`\n" +
            "> `Vquest`\n" +
            "> `Vprofile`\n" +
            "> `Vstats`\n" +
            "> `Vslots 100`\n" +
            "> `Vblackjack 100`\n" +
            "> `Vtaixiu 100`\n\n" +

            "☕ `❄️` **Chúc bạn có một hành trình thật đáng nhớ.**",

        footer:
            "☁️ Columbina • Cozy Corner"
    }
};

// ==========================================
// 🎨 CREATE EMBED
// ==========================================

function createEmbed(
    category,
    message
) {
    const data =
        CATEGORIES[category] ||
        CATEGORIES.home;

    const name =
        message.author.globalName ||
        message.author.username;

    return new EmbedBuilder()

        // Đồng bộ màu với Vstats
        .setColor("#A8DCC0")

        // Đồng bộ Author với Vstats
        .setAuthor({
            name:
                `☁️ ${name} · Columbina`,
            iconURL:
                message.author.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        })

        .setTitle(
            data.title
        )

        .setDescription(
            data.description
        )

        // Đồng bộ thumbnail với Vstats
        .setThumbnail(
            message.author.displayAvatarURL({
                extension: "png",
                size: 256
            })
        )

        // Đồng bộ footer
        .setFooter({
            text:
                data.footer
        })

        // Đồng bộ timestamp
        .setTimestamp();
}

// ==========================================
// 📋 MENU
// ==========================================

function createMenu(
    selected = "home"
) {
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
                            "Mini Game",
                        description:
                            "Slots • Blackjack • Dice • Games",
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
                            "Hành trình",
                        description:
                            "Profile • Stats • Inventory",
                        value:
                            "profile",
                        emoji:
                            "👤",
                        default:
                            selected ===
                            "profile"
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
        "Xem hướng dẫn sử dụng Columbina.",

    async execute(
        message
    ) {

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

                try {

                    // ==================================
                    // 🔐 USER CHECK
                    // ==================================

                    if (
                        interaction.user.id !==
                        userId
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Đây không phải Help Center của bạn.",
                            ephemeral:
                                true
                        });
                    }

                    // ==================================
                    // 📋 MENU CHECK
                    // ==================================

                    if (
                        interaction.customId !==
                        "columbina_help_menu"
                    ) {
                        return;
                    }

                    const category =
                        interaction.values?.[0];

                    if (
                        !category ||
                        !CATEGORIES[category]
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Danh mục không hợp lệ.",
                            ephemeral:
                                true
                        });
                    }

                    // ==================================
                    // 🔄 UPDATE EMBED
                    // ==================================

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

                } catch (
                    error
                ) {

                    console.error(
                        "[Columbina Help] Interaction Error:",
                        error
                    );
                }
            }
        );

        // ==========================================
        // ⏰ COLLECTOR END
        // ==========================================

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

