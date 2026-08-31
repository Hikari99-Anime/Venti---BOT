const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "{}", "utf8");
}

function load() {
    try {
        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function getUser(userId) {
    const data = load();
    return data[userId] || null;
}

function createUser(userId) {
    const data = load();

    if (!data[userId]) {
        data[userId] = {
            id: userId,
            balance: 1000,
            bank: 0,
            xp: 0,
            level: 1,
            dailyStreak: 0,
            lastDaily: 0,
            lastWork: 0,
            lastBeg: 0,
            inventory: {},
            stats: {
                games: 0,
                wins: 0,
                losses: 0,
                work: 0,
                fish: 0
            },
            createdAt: Date.now()
        };

        save(data);
    }

    return data[userId];
}

function updateUser(userId, updates) {
    const data = load();

    if (!data[userId]) {
        createUser(userId);
        return updateUser(userId, updates);
    }

    data[userId] = {
        ...data[userId],
        ...updates
    };

    save(data);

    return data[userId];
}

function getOrCreate(userId) {
    return getUser(userId) || createUser(userId);
}

function addBalance(userId, amount) {
    const user = getOrCreate(userId);

    user.balance += amount;

    updateUser(userId, {
        balance: user.balance
    });

    return user.balance;
}

function removeBalance(userId, amount) {
    const user = getOrCreate(userId);

    if (user.balance < amount) {
        return false;
    }

    user.balance -= amount;

    updateUser(userId, {
        balance: user.balance
    });

    return true;
}

function addXP(userId, amount) {
    const user = getOrCreate(userId);

    user.xp += amount;

    let level = user.level;

    while (user.xp >= level * 500) {
        user.xp -= level * 500;
        level++;
    }

    updateUser(userId, {
        xp: user.xp,
        level
    });

    return {
        xp: user.xp,
        level
    };
}

function addItem(userId, itemId, amount = 1) {
    const user = getOrCreate(userId);

    if (!user.inventory[itemId]) {
        user.inventory[itemId] = 0;
    }

    user.inventory[itemId] += amount;

    updateUser(userId, {
        inventory: user.inventory
    });

    return user.inventory[itemId];
}

function removeItem(userId, itemId, amount = 1) {
    const user = getOrCreate(userId);

    if (!user.inventory[itemId]) {
        return false;
    }

    if (user.inventory[itemId] < amount) {
        return false;
    }

    user.inventory[itemId] -= amount;

    if (user.inventory[itemId] <= 0) {
        delete user.inventory[itemId];
    }

    updateUser(userId, {
        inventory: user.inventory
    });

    return true;
}

module.exports = {
    load,
    save,
    getUser,
    getOrCreate,
    createUser,
    updateUser,
    addBalance,
    removeBalance,
    addXP,
    addItem,
    removeItem
};
