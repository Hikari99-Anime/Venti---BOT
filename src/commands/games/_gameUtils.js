
const User = require("../../database/models/User");

function getUser(userId) {
    return User.getOrCreate(userId);
}

function getAmount(args, index = 0) {
    const amount = Number.parseInt(
        args[index],
        10
    );

    if (!Number.isInteger(amount) || amount <= 0) {
        return null;
    }

    return amount;
}

function ensureStats(user) {
    if (!user.stats) {
        user.stats = {};
    }

    user.stats.games =
        Number(user.stats.games || 0);

    user.stats.wins =
        Number(user.stats.wins || 0);

    user.stats.losses =
        Number(user.stats.losses || 0);

    return user.stats;
}

function addGameResult(
    userId,
    won
) {
    const user = getUser(userId);

    const stats =
        ensureStats(user);

    stats.games += 1;

    if (won) {
        stats.wins += 1;
    } else {
        stats.losses += 1;
    }

    User.update(
        userId,
        {
            stats
        }
    );

    return stats;
}

function canAfford(
    user,
    amount
) {
    return Number(
        user.balance || 0
    ) >= amount;
}

function takeBet(
    userId,
    amount
) {
    User.removeBalance(
        userId,
        amount
    );
}

function giveReward(
    userId,
    amount
) {
    if (amount > 0) {
        User.addBalance(
            userId,
            amount
        );
    }
}

function formatMora(
    amount
) {
    return Number(
        amount || 0
    ).toLocaleString();
}

module.exports = {
    getUser,
    getAmount,
    ensureStats,
    addGameResult,
    canAfford,
    takeBet,
    giveReward,
    formatMora
};