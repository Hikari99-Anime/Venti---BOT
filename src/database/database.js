
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

// ==========================================
// 📂 INIT
// ==========================================

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
        DATA_FILE,
        "{}",
        "utf8"
    );
}

// ==========================================
// 📂 LOAD
// ==========================================

function load() {
    try {
        const raw = fs.readFileSync(
            DATA_FILE,
            "utf8"
        );

        return JSON.parse(raw || "{}");
    } catch (error) {
        console.error(
            "[database load]",
            error
        );

        return {};
    }
}

// ==========================================
// 💾 SAVE
// ==========================================

function save(data) {
    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                data,
                null,
                2
            ),
            "utf8"
        );

        return true;
    } catch (error) {
        console.error(
            "[database save]",
            error
        );

        return false;
    }
}

// ==========================================
// 👤 USER
// ==========================================

function getUser(userId) {
    const data = load();

    return data[userId] || null;
}

function createUser(userId) {
    const data = load();

    if (!data[userId]) {
        data[userId] = {
            id: userId,

            // 💰 Economy
            balance: 1000,
            bank: 0,

            // ⭐ Level
            xp: 0,
            level: 1,

            // ⏰ Cooldowns
            dailyStreak: 0,
            lastDaily: 0,
            lastWork: 0,
            lastBeg: 0,

            // 🎒 Inventory
            inventory: {},

            // 🔧 Tools
            tools: {
                fishingRod: {
                    level: 1,
                    durability: 50
                },

                hoe: {
                    level: 1,
                    durability: 50
                }
            },

            // 🌱 Farm
            farm: {
                plots: [
                    {
                        id: 1,
                        unlocked: true,
                        seed: null,
                        plantedAt: null,
                        readyAt: null
                    }
                ]
            },

            // 📊 Stats
            stats: {
                games: 0,
                wins: 0,
                losses: 0,
                work: 0,
                fish: 0,
                farm: 0,
                harvest: 0,
                quest: 0
            },

            // 📜 Quests
            quests: {
                date: "",
                daily: []
            },

            // 🏆 Achievements
            achievements: {},

            createdAt: Date.now()
        };

        save(data);
    }

    return data[userId];
}

function getOrCreate(userId) {
    return (
        getUser(userId) ||
        createUser(userId)
    );
}

// ==========================================
// ✏️ UPDATE
// ==========================================

function updateUser(
    userId,
    updates
) {
    const data = load();

    if (!data[userId]) {
        createUser(userId);
    }

    const freshData = load();

    freshData[userId] = {
        ...freshData[userId],
        ...updates
    };

    save(freshData);

    return freshData[userId];
}

// ==========================================
// 💰 BALANCE
// ==========================================

function addBalance(
    userId,
    amount
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

    const balance =
        Number(user.balance || 0) +
        amount;

    updateUser(
        userId,
        {
            balance
        }
    );

    return balance;
}

function removeBalance(
    userId,
    amount
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

    const balance =
        Number(user.balance || 0);

    if (balance < amount) {
        return false;
    }

    const newBalance =
        balance - amount;

    updateUser(
        userId,
        {
            balance: newBalance
        }
    );

    return true;
}

// ==========================================
// 🏦 BANK
// ==========================================

function getBank(userId) {
    const user =
        getOrCreate(userId);

    return Number(
        user.bank || 0
    );
}

function addBank(
    userId,
    amount
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

    const bank =
        Number(user.bank || 0) +
        amount;

    updateUser(
        userId,
        {
            bank
        }
    );

    return bank;
}

function removeBank(
    userId,
    amount
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

    const bank =
        Number(user.bank || 0);

    if (bank < amount) {
        return false;
    }

    const newBank =
        bank - amount;

    updateUser(
        userId,
        {
            bank: newBank
        }
    );

    return true;
}

// ==========================================
// 🔄 TRANSFER BALANCE → BANK
// ==========================================

function deposit(
    userId,
    amount
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

    const balance =
        Number(user.balance || 0);

    if (balance < amount) {
        return false;
    }

    updateUser(
        userId,
        {
            balance:
                balance - amount,

            bank:
                Number(user.bank || 0) +
                amount
        }
    );

    return true;
}

// ==========================================
// 🔄 BANK → BALANCE
// ==========================================

function withdraw(
    userId,
    amount
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

    const bank =
        Number(user.bank || 0);

    if (bank < amount) {
        return false;
    }

    updateUser(
        userId,
        {
            bank:
                bank - amount,

            balance:
                Number(user.balance || 0) +
                amount
        }
    );

    return true;
}

// ==========================================
// ⭐ XP
// ==========================================

function addXP(
    userId,
    amount
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return null;
    }

    const user =
        getOrCreate(userId);

    let xp =
        Number(user.xp || 0) +
        amount;

    let level =
        Number(user.level || 1);

    let leveledUp = false;

    while (
        xp >= level * 500
    ) {
        xp -=
            level * 500;

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

// ==========================================
// 🎒 ITEMS
// ==========================================

function addItem(
    userId,
    itemId,
    amount = 1
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

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

function removeItem(
    userId,
    itemId,
    amount = 1
) {
    amount = Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const user =
        getOrCreate(userId);

    const inventory = {
        ...(user.inventory || {})
    };

    const current =
        Number(
            inventory[itemId] || 0
        );

    if (current < amount) {
        return false;
    }

    const remaining =
        current - amount;

    if (remaining <= 0) {
        delete inventory[itemId];
    } else {
        inventory[itemId] =
            remaining;
    }

    updateUser(
        userId,
        {
            inventory
        }
    );

    return true;
}

// ==========================================
// 🔧 TOOLS
// ==========================================

function getTools(userId) {
    const user =
        getOrCreate(userId);

    if (!user.tools) {
        user.tools = {
            fishingRod: {
                level: 1,
                durability: 50
            },

            hoe: {
                level: 1,
                durability: 50
            }
        };

        updateUser(
            userId,
            {
                tools:
                    user.tools
            }
        );
    }

    return user.tools;
}

function getTool(
    userId,
    toolId
) {
    const tools =
        getTools(userId);

    return (
        tools[toolId] ||
        null
    );
}

function setTool(
    userId,
    toolId,
    toolData
) {
    const tools =
        getTools(userId);

    tools[toolId] = {
        ...(tools[toolId] || {}),
        ...toolData
    };

    updateUser(
        userId,
        {
            tools
        }
    );

    return tools[toolId];
}

function upgradeTool(
    userId,
    toolId
) {
    const tool =
        getTool(
            userId,
            toolId
        );

    if (!tool) {
        return false;
    }

    const level =
        Number(tool.level || 1) + 1;

    const durability =
        50 +
        (level - 1) * 25;

    return setTool(
        userId,
        toolId,
        {
            level,
            durability
        }
    );
}

function useTool(
    userId,
    toolId
) {
    const tool =
        getTool(
            userId,
            toolId
        );

    if (!tool) {
        return false;
    }

    const durability =
        Number(
            tool.durability || 0
        );

    if (durability <= 0) {
        return false;
    }

    return setTool(
        userId,
        toolId,
        {
            durability:
                durability - 1
        }
    );
}

// ==========================================
// 🌱 FARM
// ==========================================

function getFarm(userId) {
    const user =
        getOrCreate(userId);

    if (
        !user.farm ||
        typeof user.farm !== "object"
    ) {
        user.farm = {
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

        updateUser(
            userId,
            {
                farm:
                    user.farm
            }
        );
    }

    if (
        !Array.isArray(
            user.farm.plots
        )
    ) {
        user.farm.plots = [];
    }

    return user.farm;
}

function updateFarm(
    userId,
    farm
) {
    updateUser(
        userId,
        {
            farm
        }
    );

    return farm;
}

// ==========================================
// 📦 EXPORT
// ==========================================

module.exports = {
    load,
    save,

    getUser,
    createUser,
    getOrCreate,
    updateUser,

    addBalance,
    removeBalance,

    getBank,
    addBank,
    removeBank,

    deposit,
    withdraw,

    addXP,

    addItem,
    removeItem,

    getTools,
    getTool,
    setTool,
    upgradeTool,
    useTool,

    getFarm,
    updateFarm
};

