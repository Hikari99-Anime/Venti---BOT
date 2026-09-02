
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const database =
    require("../../database/database");
const Quest =
    require("../../database/models/Quest");
const Item =
    require("../../database/models/Item");

// ═══════════════════════════════════════
// `🍃` VENTI • FISHING
// ═══════════════════════════════════════

const COLORS = {
    common: 0x9ccfd8,
    uncommon: 0x8fd3c7,
    rare: 0xc9b1ff,
    epic: 0xd8a7ff,
    legendary: 0xffd166,
    error: 0xf2a7a7
};

// ═══════════════════════════════════════
// `🎣` FISH
// ═══════════════════════════════════════

const FISH = [
    {
        id: "small_fish",
        name: "Small Fish",
        emoji: "🐟",
        rarity: "Common",
        chance: 55,
        value: 80,
        xp: 5
    },

    {
        id: "blue_fish",
        name: "Blue Fish",
        emoji: "🐠",
        rarity: "Uncommon",
        chance: 25,
        value: 150,
        xp: 8
    },

    {
        id: "golden_fish",
        name: "Golden Fish",
        emoji: "🐡",
        rarity: "Rare",
        chance: 14,
        value: 350,
        xp: 15
    },

    {
        id: "crystal_fish",
        name: "Crystal Fish",
        emoji: "✨",
        rarity: "Epic",
        chance: 5,
        value: 800,
        xp: 30
    },

    {
        id: "wind_fish",
        name: "Wind Fish",
        emoji: "🌪️",
        rarity: "Legendary",
        chance: 1,
        value: 2500,
        xp: 75
    }
];

// ═══════════════════════════════════════
// `🎣` ROD BONUS
// ═══════════════════════════════════════

const ROD_BONUS = {
    1: {
        common: 1,
        uncommon: 1,
        rare: 1,
        epic: 1,
        legendary: 1
    },

    2: {
        common: 0.90,
        uncommon: 1.10,
        rare: 1.35,
        epic: 1.20,
        legendary: 1.10
    },

    3: {
        common: 0.75,
        uncommon: 1.05,
        rare: 1.55,
        epic: 1.50,
        legendary: 1.30
    },

    4: {
        common: 0.55,
        uncommon: 0.95,
        rare: 1.70,
        epic: 2.00,
        legendary: 2.50
    }
};

// ═══════════════════════════════════════
// `🛡️` ROD DURABILITY
// ═══════════════════════════════════════

const ROD_DURABILITY = {
    1: 20,
    2: 35,
    3: 55,
    4: 80
};

// ═══════════════════════════════════════
// `🎣` COMMAND
// ═══════════════════════════════════════

const command = {
    name: "fish",

    aliases: [
        "f",
        "fishing"
    ],

    description:
        "`🎣` Câu cá tại Windrise Lake.",

    usage: "Vfish",

    category: "games",

    async execute(message) {
        return fishCommand(message);
    }
};

// ═══════════════════════════════════════
// `👤` USER
// ═══════════════════════════════════════

function ensureUser(userId) {
    let user =
        database.getUser(userId);

    if (!user) {
        user =
            database.createUser(userId);
    }

    return user;
}

// ═══════════════════════════════════════
// `💾` UPDATE USER
// ═══════════════════════════════════════

function updateUser(
    userId,
    data
) {
    return database.updateUser(
        userId,
        data
    );
}

// ═══════════════════════════════════════
// `⭐` XP
// ═══════════════════════════════════════

function addXP(
    userId,
    amount
) {
    const user =
        ensureUser(userId);

    let xp =
        Number(user.xp || 0);

    let level =
        Number(user.level || 1);

    xp += amount;

    let leveledUp =
        false;

    while (
        xp >= level * 100
    ) {
        xp -= level * 100;
        level++;
        leveledUp = true;
    }

    updateUser(
        userId,
        {
            xp,
            level
        }
    );

    return {
        xp,
        level,
        leveledUp
    };
}

// ═══════════════════════════════════════
// `🎒` ADD ITEM
// ═══════════════════════════════════════

function addItem(
    userId,
    itemId,
    amount = 1
) {
    if (
        Item &&
        typeof Item.add ===
        "function"
    ) {
        return Item.add(
            userId,
            itemId,
            amount
        );
    }

    const user =
        ensureUser(userId);

    const inventory = {
        ...(user.inventory || {})
    };

    inventory[itemId] =
        Number(
            inventory[itemId] || 0
        ) + amount;

    updateUser(
        userId,
        {
            inventory
        }
    );

    return inventory[itemId];
}

// ═══════════════════════════════════════
// `🎣` GET ROD
// ═══════════════════════════════════════

function getRod(user) {

    const inventory =
        user.inventory || {};

    const rods =
        typeof Item.getAll ===
        "function"
            ? Item.getAll().filter(
                item =>
                    item.category ===
                    "rod"
            )
            : [];

    const ownedRods =
        rods
            .filter(rod => {

                const owned =
                    inventory[rod.id];

                if (
                    typeof owned ===
                    "number"
                ) {
                    return owned > 0;
                }

                if (
                    owned &&
                    typeof owned ===
                    "object"
                ) {
                    return Number(
                        owned.amount || 1
                    ) > 0;
                }

                return false;
            })
            .sort(
                (a, b) =>
                    Number(
                        b.rodLevel || 1
                    ) -
                    Number(
                        a.rodLevel || 1
                    )
            );

    if (
        !ownedRods.length
    ) {
        return null;
    }

    const rod =
        ownedRods[0];

    const owned =
        inventory[rod.id];

    const level =
        Number(
            rod.rodLevel || 1
        );

    const defaultDurability =
        ROD_DURABILITY[level] ||
        20;

    if (
        typeof owned ===
        "number"
    ) {
        return {
            item: rod,
            level,
            amount: owned,

            durability:
                defaultDurability,

            maxDurability:
                defaultDurability
        };
    }

    const maxDurability =
        Number(
            owned.maxDurability ||
            defaultDurability
        );

    return {
        item: rod,

        level,

        amount:
            Number(
                owned.amount || 1
            ),

        durability:
            Number(
                owned.durability ??
                maxDurability
            ),

        maxDurability
    };
}

// ═══════════════════════════════════════
// `🛡️` USE ROD
// ═══════════════════════════════════════

function useRod(
    userId,
    rodData
) {
    const user =
        ensureUser(userId);

    const inventory = {
        ...(user.inventory || {})
    };

    const rodId =
        rodData.item.id;

    const current =
        inventory[rodId];

    let durability =
        Number(
            rodData.durability || 0
        ) - 1;

    durability =
        Math.max(
            0,
            durability
        );

    // ─────────────────────────────
    // `💥` BROKEN
    // ─────────────────────────────

    if (
        durability <= 0
    ) {

        delete inventory[rodId];

        updateUser(
            userId,
            {
                inventory
            }
        );

        return {
            broken: true,
            durability: 0,

            maxDurability:
                rodData.maxDurability
        };
    }

    // ─────────────────────────────
    // `🛡️` SAVE DURABILITY
    // ─────────────────────────────

    if (
        typeof current ===
        "number"
    ) {

        inventory[rodId] = {
            amount: current,

            durability,

            maxDurability:
                rodData.maxDurability
        };

    } else {

        inventory[rodId] = {
            ...(current || {}),

            amount:
                Number(
                    current?.amount || 1
                ),

            durability,

            maxDurability:
                Number(
                    current?.maxDurability ||
                    rodData.maxDurability
                )
        };
    }

    updateUser(
        userId,
        {
            inventory
        }
    );

    return {
        broken: false,

        durability,

        maxDurability:
            rodData.maxDurability
    };
}

// ═══════════════════════════════════════
// `🎲` RANDOM FISH
// ═══════════════════════════════════════

function randomFish(
    rodLevel
) {

    const bonus =
        ROD_BONUS[rodLevel] ||
        ROD_BONUS[1];

    const weights =
        FISH.map(fish => {

            const rarity =
                fish.rarity.toLowerCase();

            return {
                fish,

                weight:
                    fish.chance *
                    Number(
                        bonus[rarity] || 1
                    )
            };
        });

    const total =
        weights.reduce(
            (sum, entry) =>
                sum + entry.weight,
            0
        );

    let roll =
        Math.random() *
        total;

    for (
        const entry of weights
    ) {

        roll -=
            entry.weight;

        if (
            roll <= 0
        ) {
            return entry.fish;
        }
    }

    return FISH[0];
}

// ═══════════════════════════════════════
// `🎨` RARITY COLOR
// ═══════════════════════════════════════

function getRarityColor(
    rarity
) {

    switch (rarity) {

        case "Legendary":
            return COLORS.legendary;

        case "Epic":
            return COLORS.epic;

        case "Rare":
            return COLORS.rare;

        case "Uncommon":
            return COLORS.uncommon;

        default:
            return COLORS.common;
    }
}

// ═══════════════════════════════════════
// `🔹` RARITY SYMBOL
// ═══════════════════════════════════════

function getRaritySymbol(
    rarity
) {

    switch (rarity) {

        case "Legendary":
            return "❖";

        case "Epic":
            return "✧";

        case "Rare":
            return "✦";

        case "Uncommon":
            return "◇";

        default:
            return "◆";
    }
}

// ═══════════════════════════════════════
// `📋` FISH EMBED
// ═══════════════════════════════════════

function createFishEmbed(
    message,
    fish,
    xpData,
    rodData,
    durabilityData
) {

    const discordUser =
        message.author;

    const raritySymbol =
        getRaritySymbol(
            fish.rarity
        );

    return new EmbedBuilder()

        .setColor(
            getRarityColor(
                fish.rarity
            )
        )

        .setAuthor({
            name:
                `🍃 ${discordUser.username} • Fishing`,

            iconURL:
                discordUser.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        })

        .setTitle(
            "`🎣` **✦ A Peaceful Catch ✦**"
        )

        .setDescription(
            [
                "`🌊` **Windrise Lake**",
                "",
                `> ${fish.emoji} **${fish.name}**`,
                `> \`${raritySymbol}\` Độ hiếm: **${fish.rarity}**`,
                "",
                `> \`💰\` Giá trị: **${fish.value.toLocaleString()} Venti**`,
                `> \`✨\` XP: **+${fish.xp}**`
            ].join("\n")
        )

        .addFields(
            {
                name:
                    "`🎣` Cần câu",

                value:
                    `> ${rodData.item.emoji || "🎣"} **${rodData.item.name}**`,

                inline: true
            },

            {
                name:
                    "`🛡️` Độ bền",

                value:
                    `> **${durabilityData.durability}/${durabilityData.maxDurability}**`,

                inline: true
            },

            {
                name:
                    "`⭐` Cấp độ",

                value:
                    `> **Lv. ${xpData.level}**`,

                inline: true
            }
        )

        .setFooter({
            text:
                durabilityData.broken
                    ? "💥 • Cần câu đã hỏng!"
                    : xpData.leveledUp
                        ? `🌟 • Level Up! Bạn đạt Level ${xpData.level}`
                        : "🍃 • Venti • May the wind guide your catch."
        })

        .setTimestamp();
}

// ═══════════════════════════════════════
// `❌` NO ROD
// ═══════════════════════════════════════

function createNoRodEmbed() {

    return new EmbedBuilder()

        .setColor(
            COLORS.error
        )

        .setTitle(
            "`🎣` **✦ Chưa Có Cần Câu ✦**"
        )

        .setDescription(
            [
                "`🌊` **Windrise Lake**",
                "",
                "> `❌` Bạn chưa sở hữu cần câu.",
                "",
                "> `🛒` Dùng **Vshop** để mua cần câu đầu tiên.",
                "> `🛡️` Cần tốt hơn có độ bền cao hơn.",
                "> `✨` Cần cấp cao tăng cơ hội bắt cá hiếm."
            ].join("\n")
        )

        .setFooter({
            text:
                "🍃 • Venti Fishing • May the wind guide you."
        });
}

// ═══════════════════════════════════════
// `🔘` BUTTONS
// ═══════════════════════════════════════

function createButtons(
    userId,
    disabled = false
) {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId(
                    `fish_again_${userId}`
                )

                .setLabel(
                    "Câu tiếp"
                )

                .setEmoji("🎣")

                .setStyle(
                    ButtonStyle.Primary
                )

                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    `fish_inventory_${userId}`
                )

                .setLabel(
                    "Túi đồ"
                )

                .setEmoji("🎒")

                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

// ═══════════════════════════════════════
// `🎣` MAIN
// ═══════════════════════════════════════

async function fishCommand(
    message
) {

    try {

        const userId =
            message.author.id;

        const user =
            ensureUser(userId);

        if (!user) {

            return message.reply({
                content:
                    "`🍃` Không thể tạo dữ liệu cho bạn."
            });
        }

        // ═══════════════════════════════
        // `🎣` CHECK ROD
        // ═══════════════════════════════

        const rodData =
            getRod(user);

        if (!rodData) {

            return message.reply({
                embeds: [
                    createNoRodEmbed()
                ]
            });
        }

        // ═══════════════════════════════
        // `🛡️` CHECK DURABILITY
        // ═══════════════════════════════

        if (
            rodData.durability <= 0
        ) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            COLORS.error
                        )

                        .setTitle(
                            "`💥` **✦ Cần Câu Đã Hỏng ✦**"
                        )

                        .setDescription(
                            [
                                `> \`🎣\` **${rodData.item.name}**`,
                                "",
                                "> `🛡️` Độ bền đã giảm xuống **0**.",
                                "",
                                "> `🛒` Mở **Vshop** để mua cần câu mới.",
                                "> `🍃` Cần mới sẽ bắt đầu với đầy độ bền."
                            ].join("\n")
                        )

                        .setFooter({
                            text:
                                "🍃 • May the wind guide your journey."
                        })
                ]
            });
        }

        // ═══════════════════════════════
        // `🎲` RANDOM FISH
        // ═══════════════════════════════

        const fish =
            randomFish(
                rodData.level
            );

        // ═══════════════════════════════
        // `🎒` ADD FISH
        // ═══════════════════════════════

        addItem(
            userId,
            fish.id,
            1
        );
        Quest.addProgress(
         userId,
        "fish",
        1
        );

        // ═══════════════════════════════
        // `🛡️` DURABILITY
        // ═══════════════════════════════

        const durabilityData =
            useRod(
                userId,
                rodData
            );

        // ═══════════════════════════════
        // `⭐` XP
        // ═══════════════════════════════

        const xpData =
            addXP(
                userId,
                fish.xp
            );

        // ═══════════════════════════════
        // `📊` STATS
        // ═══════════════════════════════

        const latestUser =
            ensureUser(userId);

        const stats = {
            ...(latestUser.stats || {})
        };

        stats.fish =
            Number(
                stats.fish || 0
            ) + 1;

        updateUser(
            userId,
            {
                stats
            }
        );

        // ═══════════════════════════════
        // `📋` EMBED
        // ═══════════════════════════════

        const embed =
            createFishEmbed(
                message,
                fish,
                xpData,
                rodData,
                durabilityData
            );

        return message.reply({

            embeds: [
                embed
            ],

            components: [
                createButtons(
                    userId,
                    durabilityData.broken
                )
            ]
        });

    } catch (error) {

        console.error(
            "[fish]",
            error
        );

        return message.reply({

            content:
                [
                    "`🍃` **Fishing Error**",
                    "",
                    "> `❌` Có lỗi xảy ra khi câu cá.",
                    "> `🔧` Hãy kiểm tra console để biết chi tiết."
                ].join("\n")

        }).catch(
            () => {}
        );
    }
}

module.exports = command;

