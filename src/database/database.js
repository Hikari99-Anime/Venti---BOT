
const fs = require("fs");
const path = require("path");

const DATA_DIR =
    path.join(process.cwd(), "data");

const DATA_FILE =
    path.join(DATA_DIR, "users.json");

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
        return JSON.parse(
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            )
        );
    } catch (error) {
        console.error(
            "[Database] Load error:",
            error
        );

        return {};
    }
}

// ==========================================
// 💾 SAVE
// ==========================================

function save(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

// ==========================================
// 👤 CREATE USER
// ==========================================

function createUser(userId) {

    const data =
        load();

    if (!data[userId]) {

        data[userId] = {

            id:
                userId,

            // ==================================
            // 💰 ECONOMY
            // ==================================

            balance:
                1000,

            bank:
                0,

            bankData: {

                lastInterest:
                    0,

                totalInterest:
                    0
            },

            // ==================================
            // ⭐ XP
            // ==================================

            xp:
                0,

            level:
                1,

            // ==================================
            // 🎁 DAILY
            // ==================================

            dailyStreak:
                0,

            lastDaily:
                0,

            lastWork:
                0,

            lastBeg:
                0,

            // ==================================
            // 🎒 INVENTORY
            // ==================================

            inventory:
                {},

            // ==================================
            // 🔧 TOOLS
            // ==================================

            tools: {

                fishingRod: {
                    level:
                        1,

                    durability:
                        50
                },

                hoe: {
                    level:
                        1,

                    durability:
                        50
                }
            },

            // ==================================
            // 🌾 FARM
            // ==================================

            farm: {

                plots: [

                    {
                        id:
                            1,

                        unlocked:
                            true,

                        seed:
                            null,

                        plantedAt:
                            null,

                        readyAt:
                            null
                    }
                ]
            },

            // ==================================
            // 📊 STATS
            // ==================================

            stats: {

                games:
                    0,

                wins:
                    0,

                losses:
                    0,

                work:
                    0,

                fish:
                    0,

                farm:
                    0,

                quest:
                    0
            },

            // ==================================
            // 📜 QUESTS
            // ==================================

            quests: {

                date:
                    "",

                daily:
                    []
            },

            // ==================================
            // 🏆 ACHIEVEMENTS
            // ==================================

            achievements:
                {},

            // ==================================
            // ⏰ CREATED
            // ==================================

            createdAt:
                Date.now()
        };

        save(data);
    }

    return data[userId];
}

// ==========================================
// 👤 GET USER
// ==========================================

function getUser(userId) {

    const data =
        load();

    return (
        data[userId] ||
        null
    );
}

// ==========================================
// 👤 GET OR CREATE
// ==========================================

function getOrCreate(userId) {

    return (
        getUser(userId) ||
        createUser(userId)
    );
}

// ==========================================
// ✏️ UPDATE USER
// ==========================================

function updateUser(
    userId,
    updates
) {

    const data =
        load();

    if (!data[userId]) {

        createUser(
            userId
        );

        return updateUser(
            userId,
            updates
        );
    }

    data[userId] = {
        ...data[userId],
        ...updates
    };

    save(data);

    return data[userId];
}

// ==========================================
// 💰 BALANCE
// ==========================================

function addBalance(
    userId,
    amount
) {

    const user =
        getOrCreate(
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isSafeInteger(
            amount
        ) ||
        amount <= 0
    ) {
        return false;
    }

    user.balance =
        Number(
            user.balance || 0
        ) + amount;

    updateUser(
        userId,
        {
            balance:
                user.balance
        }
    );

    return user.balance;
}

// ==========================================
// 💸 REMOVE BALANCE
// ==========================================

function removeBalance(
    userId,
    amount
) {

    const user =
        getOrCreate(
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isSafeInteger(
            amount
        ) ||
        amount <= 0
    ) {
        return false;
    }

    const balance =
        Number(
            user.balance || 0
        );

    if (
        balance < amount
    ) {
        return false;
    }

    user.balance =
        balance - amount;

    updateUser(
        userId,
        {
            balance:
                user.balance
        }
    );

    return true;
}

// ==========================================
// 🏦 BANK
// ==========================================

function addBank(
    userId,
    amount
) {

    const user =
        getOrCreate(
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isSafeInteger(
            amount
        ) ||
        amount <= 0
    ) {
        return false;
    }

    user.bank =
        Number(
            user.bank || 0
        ) + amount;

    updateUser(
        userId,
        {
            bank:
                user.bank
        }
    );

    return user.bank;
}

// ==========================================
// 🏦 REMOVE BANK
// ==========================================

function removeBank(
    userId,
    amount
) {

    const user =
        getOrCreate(
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isSafeInteger(
            amount
        ) ||
        amount <= 0
    ) {
        return false;
    }

    const bank =
        Number(
            user.bank || 0
        );

    if (
        bank < amount
    ) {
        return false;
    }

    user.bank =
        bank - amount;

    updateUser(
        userId,
        {
            bank:
                user.bank
        }
    );

    return true;
}

// ==========================================
// 📈 BANK INTEREST
// ==========================================

// 1% mỗi ngày
const BANK_INTEREST_RATE =
    0.01;

// 24 giờ
const BANK_INTEREST_COOLDOWN =
    24 * 60 * 60 * 1000;

// ==========================================
// 📈 CALCULATE INTEREST
// ==========================================

function calculateBankInterest(
    userId
) {

    const user =
        getOrCreate(
            userId
        );

    // Đảm bảo bankData tồn tại
    if (!user.bankData) {

        user.bankData = {

            lastInterest:
                0,

            totalInterest:
                0
        };

        updateUser(
            userId,
            {
                bankData:
                    user.bankData
            }
        );
    }

    const bank =
        Number(
            user.bank || 0
        );

    const lastInterest =
        Number(
            user.bankData.lastInterest ||
            0
        );

    const now =
        Date.now();

    const nextInterestAt =
        lastInterest > 0
            ? lastInterest +
              BANK_INTEREST_COOLDOWN
            : now;

    const canClaim =
        bank > 0 &&
        (
            lastInterest === 0 ||
            now >=
                nextInterestAt
        );

    const amount =
        Math.floor(
            bank *
            BANK_INTEREST_RATE
        );

    return {

        canClaim,

        amount,

        bank,

        rate:
            BANK_INTEREST_RATE,

        lastInterest,

        nextInterestAt
    };
}

// ==========================================
// 💵 CLAIM INTEREST
// ==========================================

function claimBankInterest(
    userId
) {

    const user =
        getOrCreate(
            userId
        );

    if (!user.bankData) {

        user.bankData = {

            lastInterest:
                0,

            totalInterest:
                0
        };
    }

    const bank =
        Number(
            user.bank || 0
        );

    // Bank trống
    if (
        bank <= 0
    ) {
        return {

            success:
                false,

            reason:
                "empty"
        };
    }

    const now =
        Date.now();

    const lastInterest =
        Number(
            user.bankData.lastInterest ||
            0
        );

    const nextInterestAt =
        lastInterest > 0
            ? lastInterest +
              BANK_INTEREST_COOLDOWN
            : 0;

    // Chưa đủ 24 giờ
    if (
        lastInterest > 0 &&
        now < nextInterestAt
    ) {
        return {

            success:
                false,

            reason:
                "cooldown",

            nextInterestAt
        };
    }

    // Tính 1%
    const interest =
        Math.floor(
            bank *
            BANK_INTEREST_RATE
        );

    // Nếu tiền quá ít
    if (
        interest < 1
    ) {
        return {

            success:
                false,

            reason:
                "too_small"
        };
    }

    // ==================================
    // 💵 CỘNG LÃI VÀO BANK
    // ==================================

    user.bank =
        bank + interest;

    user.bankData.lastInterest =
        now;

    user.bankData.totalInterest =
        Number(
            user.bankData.totalInterest ||
            0
        ) + interest;

    updateUser(
        userId,
        {

            bank:
                user.bank,

            bankData:
                user.bankData
        }
    );

    return {

        success:
            true,

        amount:
            interest,

        bank:
            user.bank,

        totalInterest:
            user.bankData.totalInterest,

        nextInterestAt:
            now +
            BANK_INTEREST_COOLDOWN
    };
}

// ==========================================
// ⭐ XP
// ==========================================

function addXP(
    userId,
    amount
) {

    const user =
        getOrCreate(
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isSafeInteger(
            amount
        ) ||
        amount <= 0
    ) {
        return {

            xp:
                user.xp,

            level:
                user.level
        };
    }

    user.xp =
        Number(
            user.xp || 0
        ) + amount;

    let level =
        Number(
            user.level || 1
        );

    while (
        user.xp >=
        level * 500
    ) {

        user.xp -=
            level * 500;

        level++;
    }

    updateUser(
        userId,
        {

            xp:
                user.xp,

            level
        }
    );

    return {

        xp:
            user.xp,

        level
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

    const user =
        getOrCreate(
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isSafeInteger(
            amount
        ) ||
        amount <= 0
    ) {
        return false;
    }

    if (
        !user.inventory
    ) {
        user.inventory = {};
    }

    if (
        !user.inventory[itemId]
    ) {
        user.inventory[itemId] =
            0;
    }

    user.inventory[itemId] +=
        amount;

    updateUser(
        userId,
        {
            inventory:
                user.inventory
        }
    );

    return user.inventory[
        itemId
    ];
}

// ==========================================
// 🎒 REMOVE ITEM
// ==========================================

function removeItem(
    userId,
    itemId,
    amount = 1
) {

    const user =
        getOrCreate(
            userId
        );

    amount =
        Number(amount);

    if (
        !user.inventory ||
        !user.inventory[itemId]
    ) {
        return false;
    }

    if (
        user.inventory[itemId] <
        amount
    ) {
        return false;
    }

    user.inventory[itemId] -=
        amount;

    if (
        user.inventory[itemId] <=
        0
    ) {
        delete user.inventory[
            itemId
        ];
    }

    updateUser(
        userId,
        {
            inventory:
                user.inventory
        }
    );

    return true;
}

// ==========================================
// 🔧 TOOLS
// ==========================================

function getTools(userId) {

    const user =
        getOrCreate(
            userId
        );

    if (!user.tools) {

        user.tools = {

            fishingRod: {
                level:
                    1,

                durability:
                    50
            },

            hoe: {
                level:
                    1,

                durability:
                    50
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

// ==========================================
// 🔧 GET TOOL
// ==========================================

function getTool(
    userId,
    toolId
) {

    const tools =
        getTools(
            userId
        );

    return (
        tools[toolId] ||
        null
    );
}

// ==========================================
// 🔧 SET TOOL
// ==========================================

function setTool(
    userId,
    toolId,
    toolData
) {

    const tools =
        getTools(
            userId
        );

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

// ==========================================
// 🔧 UPGRADE TOOL
// ==========================================

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

    tool.level++;

    tool.durability =
        50 +
        (
            tool.level - 1
        ) * 25;

    setTool(
        userId,
        toolId,
        tool
    );

    return tool;
}

// ==========================================
// 🔧 USE TOOL
// ==========================================

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

    if (
        tool.durability <= 0
    ) {
        return false;
    }

    tool.durability--;

    setTool(
        userId,
        toolId,
        tool
    );

    return tool;
}

// ==========================================
// 🌾 FARM
// ==========================================

function getFarm(userId) {

    const user =
        getOrCreate(userId);

    if (!user.farm) {

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
                farm: user.farm
            }
        );
    }

    if (!Array.isArray(user.farm.plots)) {

        user.farm.plots = [
            {
                id: 1,
                unlocked: true,
                seed: null,
                plantedAt: null,
                readyAt: null
            }
        ];

        updateUser(
            userId,
            {
                farm: user.farm
            }
        );
    }

    return user.farm;
}

// ==========================================
// 🌱 UPDATE FARM
// ==========================================

function updateFarm(
    userId,
    farm
) {

    if (
        !farm ||
        typeof farm !== "object"
    ) {
        return false;
    }

    updateUser(
        userId,
        {
            farm
        }
    );

    return farm;
}


// ==========================================
// ⏰ COOLDOWN SYSTEM
// ==========================================

function checkCooldown(
    userId,
    type,
    cooldown
) {

    const user =
        getOrCreate(userId);

    const now =
        Date.now();

    let last = 0;

    // ======================================
    // 📌 LẤY THỜI GIAN CUỐI
    // ======================================

    if (type === "daily") {
        last =
            Number(
                user.lastDaily || 0
            );
    }

    else if (type === "work") {
        last =
            Number(
                user.lastWork || 0
            );
    }

    else if (type === "beg") {
        last =
            Number(
                user.lastBeg || 0
            );
    }

    else {
        return {
            ready: true,
            remaining: 0,
            last: 0,
            next: 0
        };
    }

    const next =
        last + Number(cooldown || 0);

    const remaining =
        Math.max(
            0,
            next - now
        );

    return {
        ready:
            remaining <= 0,

        remaining,

        last,

        next
    };
}

// ==========================================
// ⏰ SET COOLDOWN
// ==========================================

function setCooldown(
    userId,
    type
) {

    const now =
        Date.now();

    const updates = {};

    if (type === "daily") {
        updates.lastDaily = now;
    }

    else if (type === "work") {
        updates.lastWork = now;
    }

    else if (type === "beg") {
        updates.lastBeg = now;
    }

    else {
        return false;
    }

    updateUser(
        userId,
        updates
    );

    return now;
}

// ==========================================
// ⏰ GET LAST COOLDOWN
// ==========================================

function getCooldown(
    userId,
    type
) {

    const user =
        getOrCreate(userId);

    if (type === "daily") {
        return Number(
            user.lastDaily || 0
        );
    }

    if (type === "work") {
        return Number(
            user.lastWork || 0
        );
    }

    if (type === "beg") {
        return Number(
            user.lastBeg || 0
        );
    }

    return 0;
}


// ==========================================
// 📦 EXPORT
// ==========================================

module.exports = {

    // DATABASE
    load,
    save,

    // USER
    getUser,
    createUser,
    getOrCreate,
    updateUser,

    // MONEY
    addBalance,
    removeBalance,

    // BANK
    addBank,
    removeBank,

    // BANK INTEREST
    calculateBankInterest,
    claimBankInterest,

    // XP
    addXP,

    // ITEMS
    addItem,
    removeItem,

    // TOOLS
    getTools,
    getTool,
    setTool,
    upgradeTool,
    useTool,

    // FARM 
    getFarm, 
    updateFarm,

    // COOLDOWN 
    checkCooldown, 
    setCooldown, 
    getCooldown,
};

