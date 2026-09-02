
const User = require("../database/models/User");

// ==========================================
// ⏰ CHECK COOLDOWN
// ==========================================

function checkCooldown(
    userId,
    type,
    cooldown
) {

    const user =
        User.getOrCreate(userId);

    const now =
        Date.now();

    let last = 0;

    // ======================================
    // 📌 LẤY TIMESTAMP
    // ======================================

    switch (type) {

        case "daily":
            last =
                Number(
                    user.lastDaily || 0
                );
            break;

        case "work":
            last =
                Number(
                    user.lastWork || 0
                );
            break;

        case "beg":
            last =
                Number(
                    user.lastBeg || 0
                );
            break;

        default:
            last = 0;
            break;
    }

    const next =
        last + Number(cooldown || 0);

    const remaining =
        Math.max(
            0,
            next - now
        );

    return {

        active:
            remaining > 0,

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

    const user =
        User.getOrCreate(userId);

    const updates = {};

    switch (type) {

        case "daily":
            updates.lastDaily = now;
            break;

        case "work":
            updates.lastWork = now;
            break;

        case "beg":
            updates.lastBeg = now;
            break;

        default:
            return false;
    }

    User.update(
        userId,
        updates
    );

    return now;
}

// ==========================================
// ⏰ FORMAT REMAINING
// ==========================================

function formatRemaining(
    milliseconds
) {

    let remaining =
        Math.max(
            0,
            Number(milliseconds || 0)
        );

    const totalSeconds =
        Math.ceil(
            remaining / 1000
        );

    if (totalSeconds <= 0) {
        return "0 giây";
    }

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    const parts = [];

    if (hours > 0) {
        parts.push(
            `${hours} giờ`
        );
    }

    if (minutes > 0) {
        parts.push(
            `${minutes} phút`
        );
    }

    if (
        seconds > 0 &&
        hours === 0
    ) {
        parts.push(
            `${seconds} giây`
        );
    }

    return parts.join(" ");
}

// ==========================================
// ⏰ IS READY
// ==========================================

function isReady(
    userId,
    type,
    cooldown
) {

    return !checkCooldown(
        userId,
        type,
        cooldown
    ).active;
}

// ==========================================
// 📦 EXPORT
// ==========================================

module.exports = {

    checkCooldown,
    setCooldown,
    formatRemaining,
    isReady
};

