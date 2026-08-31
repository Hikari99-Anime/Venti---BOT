const database = require("../database");
const ITEMS = require("./items");

function get(itemId) {
    return ITEMS[itemId] || null;
}

function getAll() {
    return Object.values(ITEMS);
}

function getUser(userId) {
    return database.getUser(userId);
}

function has(userId, itemId, amount = 1) {
    const user = getUser(userId);

    if (!user) {
        return false;
    }

    const inventory = user.inventory || {};

    return Number(
        inventory[itemId] || 0
    ) >= amount;
}

function add(userId, itemId, amount = 1) {
    const item = get(itemId);

    if (!item) {
        throw new Error(
            `Unknown item: ${itemId}`
        );
    }

    if (
        !Number.isInteger(amount) ||
        amount <= 0
    ) {
        throw new Error(
            "Invalid item amount."
        );
    }

    return database.addItem(
        userId,
        itemId,
        amount
    );
}

function remove(userId, itemId, amount = 1) {
    if (
        !has(
            userId,
            itemId,
            amount
        )
    ) {
        return false;
    }

    return database.removeItem(
        userId,
        itemId,
        amount
    );
}

function getInventory(userId) {
    const user = getUser(userId);

    if (!user) {
        return [];
    }

    const inventory =
        user.inventory || {};

    return Object.entries(inventory)
        .map(([itemId, amount]) => {
            const item = get(itemId);

            if (!item) {
                return null;
            }

            return {
                ...item,
                amount: Number(amount)
            };
        })
        .filter(Boolean);
}

module.exports = {
    ITEMS,
    get,
    getAll,
    has,
    add,
    remove,
    getInventory
};
