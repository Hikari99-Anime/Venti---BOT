const db = require("../database");

class User {
    static get(userId) {
        return db.getUser(userId);
    }

    static getOrCreate(userId) {
        return db.getOrCreate(userId);
    }

    static addBalance(userId, amount) {
        return db.addBalance(userId, amount);
    }

    static removeBalance(userId, amount) {
        return db.removeBalance(userId, amount);
    }

    static addXP(userId, amount) {
        return db.addXP(userId, amount);
    }

    static addItem(userId, itemId, amount = 1) {
        return db.addItem(userId, itemId, amount);
    }

    static removeItem(userId, itemId, amount = 1) {
        return db.removeItem(userId, itemId, amount);
    }

    static update(userId, data) {
        return db.updateUser(userId, data);
    }

    // =========================
    // 🌱 FARM
    // =========================

    static getFarm(userId) {
        const user = db.getOrCreate(userId);

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

            db.updateUser(userId, {
                farm: user.farm
            });
        }

        // Đảm bảo plots luôn tồn tại
        if (!Array.isArray(user.farm.plots)) {
            user.farm.plots = [];
        }

        return user.farm;
    }

    static updateFarm(userId, farm) {
        return db.updateUser(userId, {
            farm
        });
    }

    static unlockPlot(userId, plotId) {
        const farm = User.getFarm(userId);

        const plot = farm.plots.find(
            p => Number(p.id) === Number(plotId)
        );

        if (!plot) {
            farm.plots.push({
                id: Number(plotId),
                unlocked: true,
                seed: null,
                plantedAt: null,
                readyAt: null
            });
        } else {
            plot.unlocked = true;
        }

        User.updateFarm(userId, farm);

        return true;
    }
}

module.exports = User;
