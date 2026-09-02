
const db =
    require("../database");

// ==========================================
// 👤 USER MODEL
// ==========================================

class User {

    // ======================================
    // 👤 USER
    // ======================================

    static get(userId) {
        return db.getUser(userId);
    }

    static getOrCreate(userId) {
        return db.getOrCreate(userId);
    }

    static update(
        userId,
        data
    ) {
        return db.updateUser(
            userId,
            data
        );
    }

    static updateUser(
        userId,
        data
    ) {
        return db.updateUser(
            userId,
            data
        );
    }

    // ======================================
    // 💰 BALANCE
    // ======================================

    static addBalance(
        userId,
        amount
    ) {
        return db.addBalance(
            userId,
            amount
        );
    }

    static removeBalance(
        userId,
        amount
    ) {
        return db.removeBalance(
            userId,
            amount
        );
    }

    // ======================================
    // 🏦 BANK
    // ======================================

    static getBank(
        userId
    ) {
        return db.getBank(
            userId
        );
    }

    static addBank(
        userId,
        amount
    ) {
        return db.addBank(
            userId,
            amount
        );
    }

    static removeBank(
        userId,
        amount
    ) {
        return db.removeBank(
            userId,
            amount
        );
    }

    static deposit(
        userId,
        amount
    ) {
        return db.deposit(
            userId,
            amount
        );
    }

    static withdraw(
        userId,
        amount
    ) {
        return db.withdraw(
            userId,
            amount
        );
    }

    // ======================================
    // ⭐ XP
    // ======================================

    static addXP(
        userId,
        amount
    ) {
        return db.addXP(
            userId,
            amount
        );
    }

    // ======================================
    // 🎒 ITEMS
    // ======================================

    static addItem(
        userId,
        itemId,
        amount = 1
    ) {
        return db.addItem(
            userId,
            itemId,
            amount
        );
    }

    static removeItem(
        userId,
        itemId,
        amount = 1
    ) {
        return db.removeItem(
            userId,
            itemId,
            amount
        );
    }

    // ======================================
    // 🔧 TOOLS
    // ======================================

    static getTools(
        userId
    ) {
        return db.getTools(
            userId
        );
    }

    static getTool(
        userId,
        toolId
    ) {
        return db.getTool(
            userId,
            toolId
        );
    }

    static setTool(
        userId,
        toolId,
        data
    ) {
        return db.setTool(
            userId,
            toolId,
            data
        );
    }

    static upgradeTool(
        userId,
        toolId
    ) {
        return db.upgradeTool(
            userId,
            toolId
        );
    }

    static useTool(
        userId,
        toolId
    ) {
        return db.useTool(
            userId,
            toolId
        );
    }

    // ======================================
    // 🌱 FARM
    // ======================================

    static getFarm(
        userId
    ) {
        return db.getFarm(
            userId
        );
    }

    static updateFarm(
        userId,
        farm
    ) {
        return db.updateFarm(
            userId,
            farm
        );
    }
}

module.exports = User;

