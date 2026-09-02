
const User =
    require("./User");

// ==========================================
// 📜 QUEST DATA
// ==========================================

const QUESTS = [
    {
        id: "fish",
        emoji: "🎣",
        name: "Ngư dân chăm chỉ",
        description:
            "Bắt 5 con cá.",
        target: 5,
        reward: 1000,
        xp: 100
    },

    {
        id: "farm",
        emoji: "🌾",
        name: "Nông dân cần cù",
        description:
            "Thu hoạch 10 nông sản.",
        target: 10,
        reward: 1200,
        xp: 120
    },

    {
        id: "sell",
        emoji: "💰",
        name: "Thương nhân",
        description:
            "Bán 10 item.",
        target: 10,
        reward: 900,
        xp: 100
    }
];

// ==========================================
// 📅 TODAY
// ==========================================

function getToday() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}

// ==========================================
// 📋 GET DAILY QUESTS
// ==========================================

function getDailyQuests(user) {
    const today =
        getToday();

    if (
        user.quests &&
        user.quests.date === today &&
        Array.isArray(
            user.quests.daily
        ) &&
        user.quests.daily.length
    ) {
        return user.quests.daily;
    }

    return QUESTS.map(
        quest => ({
            id: quest.id,
            progress: 0,
            claimed: false
        })
    );
}

// ==========================================
// 💾 SAVE
// ==========================================

function saveQuests(
    userId,
    quests
) {
    return User.update(
        userId,
        {
            quests: {
                date:
                    getToday(),

                daily:
                    quests
            }
        }
    );
}

// ==========================================
// 🔎 GET DEFINITION
// ==========================================

function getDefinition(
    questId
) {
    return QUESTS.find(
        quest =>
            quest.id === questId
    );
}

// ==========================================
// 📈 ADD PROGRESS
// ==========================================

function addProgress(
    userId,
    questId,
    amount = 1
) {
    if (
        !Number.isFinite(
            Number(amount)
        ) ||
        Number(amount) <= 0
    ) {
        return false;
    }

    const user =
        User.getOrCreate(
            userId
        );

    if (!user) {
        return false;
    }

    const quests =
        getDailyQuests(
            user
        );

    const quest =
        quests.find(
            q =>
                q.id === questId
        );

    const definition =
        getDefinition(
            questId
        );

    if (
        !quest ||
        !definition
    ) {
        return false;
    }

    // Quest đã nhận thì không tăng nữa
    if (quest.claimed) {
        return false;
    }

    const oldProgress =
        Number(
            quest.progress || 0
        );

    const newProgress =
        Math.min(
            definition.target,
            oldProgress +
                Number(amount)
        );

    quest.progress =
        newProgress;

    saveQuests(
        userId,
        quests
    );

    return {
        id: questId,
        oldProgress,
        progress: newProgress,
        target:
            definition.target,
        completed:
            newProgress >=
            definition.target
    };
}

// ==========================================
// 📈 ADD MULTIPLE QUEST PROGRESS
// ==========================================

function addProgressMultiple(
    userId,
    progress = {}
) {
    const user =
        User.getOrCreate(
            userId
        );

    if (!user) {
        return false;
    }

    const quests =
        getDailyQuests(
            user
        );

    let changed = false;

    for (
        const [questId, amount]
        of Object.entries(progress)
    ) {
        const quest =
            quests.find(
                q =>
                    q.id === questId
            );

        const definition =
            getDefinition(
                questId
            );

        if (
            !quest ||
            !definition ||
            quest.claimed
        ) {
            continue;
        }

        const value =
            Number(amount);

        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {
            continue;
        }

        quest.progress =
            Math.min(
                definition.target,
                Number(
                    quest.progress || 0
                ) + value
            );

        changed = true;
    }

    if (changed) {
        saveQuests(
            userId,
            quests
        );
    }

    return changed;
}

// ==========================================
// 🎁 CLAIM
// ==========================================

function claim(
    userId,
    questId
) {
    const user =
        User.getOrCreate(
            userId
        );

    if (!user) {
        return {
            success: false,
            reason: "USER_NOT_FOUND"
        };
    }

    const quests =
        getDailyQuests(
            user
        );

    const quest =
        quests.find(
            q =>
                q.id === questId
        );

    const definition =
        getDefinition(
            questId
        );

    if (
        !quest ||
        !definition
    ) {
        return {
            success: false,
            reason: "QUEST_NOT_FOUND"
        };
    }

    if (quest.claimed) {
        return {
            success: false,
            reason: "ALREADY_CLAIMED"
        };
    }

    if (
        Number(
            quest.progress || 0
        ) <
        definition.target
    ) {
        return {
            success: false,
            reason: "NOT_COMPLETED",
            progress:
                Number(
                    quest.progress || 0
                ),
            target:
                definition.target
        };
    }

    quest.claimed =
        true;

    saveQuests(
        userId,
        quests
    );

    User.addBalance(
        userId,
        definition.reward
    );

    User.addXP(
        userId,
        definition.xp
    );

    return {
        success: true,
        reward:
            definition.reward,
        xp:
            definition.xp,
        quest:
            definition
    };
}

module.exports = {
    QUESTS,
    getToday,
    getDailyQuests,
    saveQuests,
    getDefinition,
    addProgress,
    addProgressMultiple,
    claim
};

