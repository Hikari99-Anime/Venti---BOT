const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const database = require("../../database/database");
const Item = require("../../database/models/Item");

// ═══════════════════════════════════════
// VENTI • FISHING CONFIG
// ═══════════════════════════════════════

const COLORS = {
    primary: 0x9ccfd8,
    success: 0xa8d8a8,
    rare: 0xc9b1ff,
    legendary: 0xffd166,
    error: 0xf2a7a7
};

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
        emoji: "🌬️",
        rarity: "Legendary",
        chance: 1,
        value: 2500,
        xp: 75
    }
];

// ═══════════════════════════════════════
// COMMAND
// ═══════════════════════════════════════

const command = {
    name: "fish",
    aliases: [
        "f",
        "fishing"
    ],
    description:
        "🎣 Câu cá tại Windrise Lake.",
    usage: "Vfish",
    category: "games",

    async execute(message) {
        return fishCommand(message);
    }
};

// ═══════════════════════════════════════
// RANDOM FISH
// ═══════════════════════════════════════

function randomFish() {
    const roll =
        Math.random() * 100;

    let current = 0;

    for (const fish of FISH) {
        current += fish.chance;

        if (roll <= current) {
            return fish;
        }
    }

    return FISH[0];
}

// ═══════════════════════════════════════
// GET USER
// ═══════════════════════════════════════

function getUser(userId) {
    if (
        typeof database.getUser !==
        "function"
    ) {
        throw new Error(
            "database.getUser() không tồn tại."
        );
    }

    return database.getUser(
        userId
    );
}

// ═══════════════════════════════════════
// CREATE USER
// ═══════════════════════════════════════

function ensureUser(userId) {
    let user =
        getUser(userId);

    if (!user) {
        if (
            typeof database.createUser ===
            "function"
        ) {
            user =
                database.createUser(
                    userId
                );
        }
    }

    return user;
}

// ═══════════════════════════════════════
// UPDATE USER
// ═══════════════════════════════════════

function updateUser(
    userId,
    data
) {
    if (
        typeof database.updateUser ===
        "function"
    ) {
        return database.updateUser(
            userId,
            data
        );
    }

    const user =
        getUser(userId);

    if (!user) {
        throw new Error(
            "Không tìm thấy user."
        );
    }

    Object.assign(
        user,
        data
    );

    if (
        typeof database.saveUser ===
        "function"
    ) {
        return database.saveUser(
            user
        );
    }

    throw new Error(
        "Database cần có updateUser() hoặc saveUser()."
    );
}

// ═══════════════════════════════════════
// ADD XP
// ═══════════════════════════════════════

function addXP(
    userId,
    amount
) {
    const user =
        ensureUser(userId);

    if (!user) {
        throw new Error(
            "Không thể tạo user."
        );
    }

    const oldXP =
        Number(user.xp || 0);

    const oldLevel =
        Number(user.level || 1);

    const requiredXP =
        oldLevel * 100;

    let xp =
        oldXP + amount;

    let level =
        oldLevel;

    let leveledUp =
        false;

    while (
        xp >=
        level * 100
    ) {
        xp -=
            level * 100;

        level++;

        leveledUp =
            true;
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
// ADD FISH TO INVENTORY
// ═══════════════════════════════════════

function addFish(
    userId,
    fish
) {
    /*
     * Ưu tiên dùng Item.add()
     */

    if (
        Item &&
        typeof Item.add ===
        "function"
    ) {
        return Item.add(
            userId,
            fish.id,
            1
        );
    }

    /*
     * Fallback nếu Item.add()
     * chưa tồn tại.
     */

    const user =
        ensureUser(userId);

    if (!user) {
        throw new Error(
            "Không tìm thấy user."
        );
    }

    const inventory =
        {
            ...(user.inventory || {})
        };

    inventory[fish.id] =
        Number(
            inventory[fish.id] || 0
        ) + 1;

    updateUser(
        userId,
        {
            inventory
        }
    );

    return inventory[fish.id];
}

// ═══════════════════════════════════════
// RARITY COLOR
// ═══════════════════════════════════════

function getRarityColor(
    rarity
) {
    switch (rarity) {
        case "Legendary":
            return COLORS.legendary;

        case "Epic":
            return 0xd8a7ff;

        case "Rare":
            return COLORS.rare;

        case "Uncommon":
            return 0x8fd3c7;

        default:
            return COLORS.primary;
    }
}

// ═══════════════════════════════════════
// CREATE FISH EMBED
// ═══════════════════════════════════════

function createFishEmbed(
    message,
    fish,
    xpData
) {
    const discordUser =
        message.author;

    const embed =
        new EmbedBuilder()
            .setColor(
                getRarityColor(
                    fish.rarity
                )
            )
            .setAuthor({
                name:
                    `${discordUser.username} • Fishing`,
                iconURL:
                    discordUser.displayAvatarURL({
                        extension: "png",
                        size: 128
                    })
            })
            .setTitle(
                "🎣  A peaceful catch"
            )
            .setDescription(
                [
                    "🌊 **Windrise Lake**",
                    "",
                    `${fish.emoji} You caught **${fish.name}**!`,
                    `> Rarity: **${fish.rarity}**`,
                    "",
                    `💰 Value: **${fish.value.toLocaleString()} Venti**`,
                    `✨ XP: **+${fish.xp}**`
                ].join("\n")
            )
            .addFields(
                {
                    name: "🎒 Inventory",
                    value:
                        `Added **${fish.name} ×1**`,
                    inline: true
                },
                {
                    name: "⭐ Level",
                    value:
                        `Lv. **${xpData.level}**`,
                    inline: true
                }
            )
            .setFooter({
                text:
                    xpData.leveledUp
                        ? `🌟 Level Up! You reached level ${xpData.level}`
                        : `Venti • Fishing`
            })
            .setTimestamp();

    return embed;
}

// ═══════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════

function createButtons(
    userId
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `fish_again_${userId}`
                )
                .setLabel(
                    "Fish Again"
                )
                .setEmoji("🎣")
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    `fish_inventory_${userId}`
                )
                .setLabel(
                    "Inventory"
                )
                .setEmoji("🎒")
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
}

// ═══════════════════════════════════════
// FISH COMMAND
// ═══════════════════════════════════════

async function fishCommand(
    message
) {
    try {
        const userId =
            message.author.id;

        /*
         * Đảm bảo database user tồn tại.
         */

        const user =
            ensureUser(userId);

        if (!user) {
            return message.reply({
                content:
                    "🍃 Không thể tạo dữ liệu cho bạn."
            });
        }

        /*
         * Random fish.
         */

        const fish =
            randomFish();

        /*
         * Add fish.
         */

        addFish(
            userId,
            fish
        );

        /*
         * Add XP.
         */

        const xpData =
            addXP(
                userId,
                fish.xp
            );

        /*
         * Embed.
         */

        const embed =
            createFishEmbed(
                message,
                fish,
                xpData
            );

        /*
         * Buttons.
         */

        const buttons =
            createButtons(
                userId
            );

        return message.reply({
            embeds: [embed],
            components: [
                buttons
            ]
        });
    } catch (error) {
        console.error(
            "[fish]",
            error
        );

        return message.reply({
            content:
                "🍃 Có lỗi xảy ra khi câu cá. Kiểm tra console để biết chi tiết."
        }).catch(() => {});
    }
}

// ═══════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════

module.exports = command;
