require("dotenv").config();

module.exports = {
    token: process.env.TOKEN,
    prefix: process.env.PREFIX || "V",
    ownerId: process.env.OWNER_ID,

    bot: {
        name: "Venti",
        emoji: "🍃",
        currency: "Mora"
    },

    colors: {
        primary: "#9BD7FF",
        secondary: "#B8E7FF",
        success: "#A8E6CF",
        warning: "#FFD6A5",
        error: "#FFB7C5",
        dark: "#6FA8C9"
    }
};
