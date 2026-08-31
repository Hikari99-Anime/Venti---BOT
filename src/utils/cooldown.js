const cooldowns = new Map();

function key(userId, command) {
    return `${userId}:${command}`;
}

function check(userId, command, duration) {
    const id = key(userId, command);

    const expires = cooldowns.get(id);

    if (!expires) {
        return 0;
    }

    const remaining = expires - Date.now();

    if (remaining <= 0) {
        cooldowns.delete(id);
        return 0;
    }

    return remaining;
}

function set(userId, command, duration) {
    cooldowns.set(
        key(userId, command),
        Date.now() + duration
    );
}

module.exports = {
    check,
    set
};
