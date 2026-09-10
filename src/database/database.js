
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
// 🎟️ LOTTERY DEFAULT
// ==========================================

const LOTTERY_DEFAULT = {

    // ======================================
    // 🌍 GLOBAL LOTTERY
    // ======================================

    enabled:
        false,

    round:
        1,

    price:
        1000,

    jackpot:
        10000,

    duration:
        5 * 60 * 1000,

    startedAt:
        0,

    endsAt:
        0,

    // ======================================
    // 🎫 TICKETS
    // ======================================

    tickets: {},

    // ======================================
    // 👤 USER TICKETS
    // ======================================

    userTickets: {},

    // ======================================
    // 📺 SETUP CHANNELS
    // ======================================

    channels: {},

    // ======================================
    // 🏆 LAST RESULT
    // ======================================

    lastResult:
        null
};

// ==========================================
// 🎟️ GET LOTTERY
// ==========================================

function getLottery(data = null) {

    const db =
        data || load();

    if (
        !db._lottery ||
        typeof db._lottery !== "object"
    ) {

        db._lottery = {
            ...LOTTERY_DEFAULT
        };

        save(db);
    }

    // ======================================
    // 🛡️ MIGRATION
    // ======================================

    db._lottery = {

        ...LOTTERY_DEFAULT,

        ...db._lottery,

        tickets:
            db._lottery.tickets &&
            typeof db._lottery.tickets === "object"
                ? db._lottery.tickets
                : {},

        userTickets:
            db._lottery.userTickets &&
            typeof db._lottery.userTickets === "object"
                ? db._lottery.userTickets
                : {},

        channels:
            db._lottery.channels &&
            typeof db._lottery.channels === "object"
                ? db._lottery.channels
                : {}
    };

    return db._lottery;
}

// ==========================================
// 🎟️ SAVE LOTTERY
// ==========================================

function saveLottery(lottery) {

    const data =
        load();

    data._lottery = lottery;

    save(data);

    return lottery;
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
// 💰 ADD BALANCE
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
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        return false;
    }

    const balance =
        Number(
            user.balance || 0
        );

    const newBalance =
        balance + amount;

    updateUser(
        userId,
        {
            balance:
                newBalance
        }
    );

    return newBalance;
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
        !Number.isSafeInteger(amount) ||
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

    const newBalance =
        balance - amount;

    updateUser(
        userId,
        {
            balance:
                newBalance
        }
    );

    return true;
}

// ==========================================
// 🎟️ BUY LOTTERY TICKETS
// ==========================================
//
// Dùng cho cả random và chọn số.
//
// quantity tối đa 5.
// Mỗi user tối đa 5 vé / kỳ.
// Số vé global không được trùng.
//
// ==========================================

function buyTickets(
    userId,
    quantity,
    pricePerTicket,
    numbers = []
) {

    const user =
        getOrCreate(
            userId
        );

    const data =
        load();

    const lottery =
        getLottery(data);

    quantity =
        Number(quantity);

    pricePerTicket =
        Number(pricePerTicket);

    // ======================================
    // 🔢 QUANTITY
    // ======================================

    if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1
    ) {

        return {

            success:
                false,

            reason:
                "invalid_quantity"
        };
    }

    if (quantity > 5) {

        return {

            success:
                false,

            reason:
                "max_tickets",

            max:
                5
        };
    }

    // ======================================
    // 🎟️ USER MAX 5 / ROUND
    // ======================================

    const currentUserTickets =
        Number(
            lottery.userTickets[userId]?.length || 0
        );

    if (
        currentUserTickets + quantity > 5
    ) {

        return {

            success:
                false,

            reason:
                "user_max_tickets",

            max:
                5,

            current:
                currentUserTickets
        };
    }

    // ======================================
    // 💰 PRICE
    // ======================================

    if (
        !Number.isSafeInteger(pricePerTicket) ||
        pricePerTicket <= 0
    ) {

        return {

            success:
                false,

            reason:
                "invalid_price"
        };
    }

    // ======================================
    // 💵 TOTAL
    // ======================================

    const total =
        quantity *
        pricePerTicket;

    const balance =
        Number(
            user.balance || 0
        );

    if (
        balance < total
    ) {

        return {

            success:
                false,

            reason:
                "insufficient_balance",

            balance,

            required:
                total,

            missing:
                total - balance
        };
    }

    // ======================================
    // 🔢 VALIDATE NUMBERS
    // ======================================

    if (
        !Array.isArray(numbers) ||
        numbers.length !== quantity
    ) {

        return {

            success:
                false,

            reason:
                "invalid_numbers"
        };
    }

    const normalized =
        numbers.map(
            number =>
                String(number)
                    .trim()
                    .padStart(4, "0")
        );

    // ======================================
    // 🚫 DUPLICATE IN PURCHASE
    // ======================================

    if (
        new Set(normalized).size !==
        normalized.length
    ) {

        return {

            success:
                false,

            reason:
                "duplicate_numbers"
        };
    }

    // ======================================
    // 🚫 GLOBAL DUPLICATE
    // ======================================

    for (
        const number of normalized
    ) {

        if (
            lottery.tickets[number]
        ) {

            return {

                success:
                    false,

                reason:
                    "number_taken",

                number
            };
        }
    }

    // ======================================
    // 💸 REMOVE MONEY
    // ======================================

    const newBalance =
        balance - total;

    user.balance =
        newBalance;

    // ======================================
    // 🎟️ SAVE TICKETS
    // ======================================

    if (
        !lottery.userTickets[userId]
    ) {

        lottery.userTickets[userId] =
            [];
    }

    for (
        const number of normalized
    ) {

        lottery.tickets[number] = {

            userId,

            number,

            round:
                lottery.round,

            createdAt:
                Date.now()
        };

        lottery.userTickets[userId].push(
            number
        );
    }

    // ======================================
    // 💾 SAVE EVERYTHING
    // ======================================

    data[userId] =
        user;

    data._lottery =
        lottery;

    save(data);

    return {

        success:
            true,

        userId,

        quantity,

        numbers:
            normalized,

        pricePerTicket,

        total,

        balance:
            newBalance
    };
}

// ==========================================
// 🎲 GENERATE RANDOM UNIQUE TICKETS
// ==========================================

function generateRandomTickets(
    quantity
) {

    const data =
        load();

    const lottery =
        getLottery(data);

    quantity =
        Number(quantity);

    if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 5
    ) {
        return [];
    }

    const result = [];

    let attempts = 0;

    while (
        result.length < quantity &&
        attempts < 100000
    ) {

        attempts++;

        const number =
            String(
                Math.floor(
                    Math.random() * 10000
                )
            ).padStart(
                4,
                "0"
            );

        if (
            lottery.tickets[number] ||
            result.includes(number)
        ) {
            continue;
        }

        result.push(number);
    }

    return result;
}

// ==========================================
// 🎟️ GET USER LOTTERY TICKETS
// ==========================================

function getUserLotteryTickets(
    userId
) {

    const data =
        load();

    const lottery =
        getLottery(data);

    return [
        ...(lottery.userTickets[userId] || [])
    ];
}

// ==========================================
// 🎟️ GET ALL LOTTERY TICKETS
// ==========================================

function getLotteryTickets() {

    const data =
        load();

    const lottery =
        getLottery(data);

    return {
        ...lottery.tickets
    };
}

// ==========================================
// 🎟️ SETUP CHANNEL
// ==========================================

function setupLotteryChannel(
    guildId,
    channelId,
    messageId = null
) {

    const data =
        load();

    const lottery =
        getLottery(data);

    lottery.channels[guildId] = {

        channelId,

        messageId,

        updatedAt:
            Date.now()
    };

    data._lottery =
        lottery;

    save(data);

    return lottery.channels[guildId];
}

// ==========================================
// ❌ REMOVE SETUP CHANNEL
// ==========================================

function removeLotteryChannel(
    guildId
) {

    const data =
        load();

    const lottery =
        getLottery(data);

    delete lottery.channels[guildId];

    data._lottery =
        lottery;

    save(data);

    return true;
}

// ==========================================
// 📺 GET SETUP CHANNELS
// ==========================================

function getLotteryChannels() {

    const data =
        load();

    const lottery =
        getLottery(data);

    return {
        ...lottery.channels
    };
}

// ==========================================
// 🎟️ START NEW ROUND
// ==========================================

function startLotteryRound(
    options = {}
) {

    const data =
        load();

    const oldLottery =
        getLottery(data);

    const price =
        Number(
            options.price ??
            oldLottery.price ??
            100
        );

    const duration =
        Number(
            options.duration ??
            oldLottery.duration ??
            5 * 60 * 1000
        );

    const jackpot =
        Number(
            options.jackpot ??
            oldLottery.jackpot ??
            1000
        );

    const now =
        Date.now();

    const lottery = {

        ...LOTTERY_DEFAULT,

        enabled:
            true,

        round:
            Number(
                oldLottery.round || 0
            ) + 1,

        price,

        duration,

        jackpot,

        startedAt:
            now,

        endsAt:
            now + duration,

        tickets: {},

        userTickets: {},

        channels:
            oldLottery.channels || {},

        lastResult:
            oldLottery.lastResult || null
    };

    data._lottery =
        lottery;

    save(data);

    return lottery;
}

// ==========================================
// ⏱️ GET LOTTERY STATE
// ==========================================

function getLotteryState() {

    const data =
        load();

    const lottery =
        getLottery(data);

    return lottery;
}

// ==========================================
// 🏆 DRAW LOTTERY
// ==========================================

function drawLottery() {

    const data =
        load();

    const lottery =
        getLottery(data);

    if (
        !lottery.enabled
    ) {

        return {

            success:
                false,

            reason:
                "not_started"
        };
    }

    const now =
        Date.now();

    if (
        lottery.endsAt > now
    ) {

        return {

            success:
                false,

            reason:
                "not_finished",

            remaining:
                lottery.endsAt - now
        };
    }

    const numbers =
        Object.keys(
            lottery.tickets
        );

    // ======================================
    // 🎯 NO TICKET
    // ======================================

    if (
        numbers.length === 0
    ) {

        const jackpot =
            Number(
                lottery.jackpot || 0
            );

        const nextJackpot =
            jackpot;

        lottery.lastResult = {

            round:
                lottery.round,

            winningNumber:
                null,

            winnerId:
                null,

            prize:
                0,

            jackpot:

                nextJackpot,

            totalTickets:
                0,

            drawnAt:
                now
        };

        lottery.enabled =
            false;

        lottery.startedAt =
            0;

        lottery.endsAt =
            0;

        data._lottery =
            lottery;

        save(data);

        return {

            success:
                true,

            winner:
                false,

            winningNumber:
                null,

            winnerId:
                null,

            prize:
                0,

            jackpot:
                nextJackpot,

            totalTickets:
                0,

            round:
                lottery.round
        };
    }

    // ======================================
    // 🎯 RANDOM WINNING NUMBER
    // ======================================

    const winningNumber =
        numbers[
            Math.floor(
                Math.random() *
                numbers.length
            )
        ];

    const winningTicket =
        lottery.tickets[
            winningNumber
        ];

    const winnerId =
        winningTicket.userId;

    // ======================================
    // 💰 JACKPOT
    // ======================================

    const prize =
        Number(
            lottery.jackpot || 0
        ) +
        (
            numbers.length *
            Number(
                lottery.price || 0
            )
        );

    // ======================================
    // 💵 PAY WINNER
    // ======================================

    const winner =
        data[winnerId] ||
        createUser(winnerId);

    winner.balance =
        Number(
            winner.balance || 0
        ) + prize;

    // ======================================
    // 📊 STATS
    // ======================================

    if (!winner.stats) {
        winner.stats = {};
    }

    winner.stats.wins =
        Number(
            winner.stats.wins || 0
        ) + 1;

    winner.stats.games =
        Number(
            winner.stats.games || 0
        ) + 1;

    data[winnerId] =
        winner;

    // ======================================
    // 🏆 RESULT
    // ======================================

    lottery.lastResult = {

        round:
            lottery.round,

        winningNumber,

        winnerId,

        prize,

        jackpot:
            prize,

        totalTickets:
            numbers.length,

        drawnAt:
            now
    };

    // ======================================
    // 🔄 RESET ROUND
    // ======================================

    lottery.enabled =
        false;

    lottery.startedAt =
        0;

    lottery.endsAt =
        0;

    // ======================================
    // 💰 NEXT JACKPOT
    // ======================================

    lottery.jackpot =
        1000;

    data._lottery =
        lottery;

    save(data);

    return {

        success:
            true,

        winner:
            true,

        winningNumber,

        winnerId,

        prize,

        jackpot:
            prize,

        totalTickets:
            numbers.length,

        round:
            lottery.round
    };
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
        !Number.isSafeInteger(amount) ||
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
        !Number.isSafeInteger(amount) ||
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

const BANK_INTEREST_RATE =
    0.01;

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
            user.bankData.lastInterest || 0
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
            now >= nextInterestAt
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
            user.bankData.lastInterest || 0
        );

    const nextInterestAt =
        lastInterest > 0
            ? lastInterest +
              BANK_INTEREST_COOLDOWN
            : 0;

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

    const interest =
        Math.floor(
            bank *
            BANK_INTEREST_RATE
        );

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

    user.bank =
        bank + interest;

    user.bankData.lastInterest =
        now;

    user.bankData.totalInterest =
        Number(
            user.bankData.totalInterest || 0
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
        !Number.isSafeInteger(amount) ||
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
// 🎒 ADD ITEM
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
        !Number.isSafeInteger(amount) ||
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

    return user.inventory[itemId];
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
// 🔧 GET TOOLS
// ==========================================

function getTools(
    userId
) {

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
// 🌾 GET FARM
// ==========================================

function getFarm(
    userId
) {

    const user =
        getOrCreate(
            userId
        );

    if (!user.farm) {

        user.farm = {

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

        user.farm.plots = [

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
        ];

        updateUser(
            userId,
            {
                farm:
                    user.farm
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
        getOrCreate(
            userId
        );

    const now =
        Date.now();

    let last = 0;

    if (
        type === "daily"
    ) {

        last =
            Number(
                user.lastDaily || 0
            );

    } else if (
        type === "work"
    ) {

        last =
            Number(
                user.lastWork || 0
            );

    } else if (
        type === "beg"
    ) {

        last =
            Number(
                user.lastBeg || 0
            );

    } else {

        return {

            ready:
                true,

            remaining:
                0,

            last:
                0,

            next:
                0
        };
    }

    const next =
        last +
        Number(
            cooldown || 0
        );

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

    if (
        type === "daily"
    ) {

        updates.lastDaily =
            now;

    } else if (
        type === "work"
    ) {

        updates.lastWork =
            now;

    } else if (
        type === "beg"
    ) {

        updates.lastBeg =
            now;

    } else {

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
        getOrCreate(
            userId
        );

    if (
        type === "daily"
    ) {

        return Number(
            user.lastDaily || 0
        );
    }

    if (
        type === "work"
    ) {

        return Number(
            user.lastWork || 0
        );
    }

    if (
        type === "beg"
    ) {

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

    // 🎟️ LOTTERY
    buyTickets,
    generateRandomTickets,
    getUserLotteryTickets,
    getLotteryTickets,
    getLottery,
    saveLottery,
    setupLotteryChannel,
    removeLotteryChannel,
    getLotteryChannels,
    startLotteryRound,
    getLotteryState,
    drawLottery,

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
    getCooldown
};

