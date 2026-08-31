const items = {
    // =====================================
    // 🌊 HẢI SẢN
    // =====================================

    small_fish: {
        id: "small_fish",
        name: "Small Fish",
        emoji: "🐟",
        category: "seafood",
        rarity: "Common",
        description: "Một chú cá nhỏ.",
        buyPrice: 80,
        sellPrice: 40
    },

    blue_fish: {
        id: "blue_fish",
        name: "Blue Fish",
        emoji: "🐠",
        category: "seafood",
        rarity: "Uncommon",
        description: "Một chú cá xanh khá hiếm.",
        buyPrice: 150,
        sellPrice: 75
    },

    golden_fish: {
        id: "golden_fish",
        name: "Golden Fish",
        emoji: "🐡",
        category: "seafood",
        rarity: "Rare",
        description: "Một chú cá vàng.",
        buyPrice: 350,
        sellPrice: 175
    },

    crystal_fish: {
        id: "crystal_fish",
        name: "Crystal Fish",
        emoji: "✨",
        category: "seafood",
        rarity: "Epic",
        description: "Cá mang sức mạnh tinh thể.",
        buyPrice: 800,
        sellPrice: 400
    },

    wind_fish: {
        id: "wind_fish",
        name: "Wind Fish",
        emoji: "🌪️",
        category: "seafood",
        rarity: "Legendary",
        description: "Cá huyền thoại của Windrise.",
        buyPrice: 2500,
        sellPrice: 1250
    },

    // =====================================
    // 🌾 NÔNG SẢN
    // =====================================

    apple: {
        id: "apple",
        name: "Apple",
        emoji: "🍎",
        category: "farming",
        rarity: "Common",
        description: "Một quả táo tươi.",
        buyPrice: 100,
        sellPrice: 50
    },

    sweet_flower: {
        id: "sweet_flower",
        name: "Sweet Flower",
        emoji: "🌸",
        category: "farming",
        rarity: "Common",
        description: "Một bông hoa thơm.",
        buyPrice: 160,
        sellPrice: 80
    },

    sunsettia: {
        id: "sunsettia",
        name: "Sunsettia",
        emoji: "🍊",
        category: "farming",
        rarity: "Uncommon",
        description: "Một loại quả mọng nước.",
        buyPrice: 240,
        sellPrice: 120
    },

    wheat: {
        id: "wheat",
        name: "Wheat",
        emoji: "🌾",
        category: "farming",
        rarity: "Common",
        description: "Lúa mì thu hoạch từ trang trại.",
        buyPrice: 0,
        sellPrice: 100
    },

    tomato: {
        id: "tomato",
        name: "Tomato",
        emoji: "🍅",
        category: "farming",
        rarity: "Uncommon",
        description: "Cà chua tươi.",
        buyPrice: 0,
        sellPrice: 220
    },

    pumpkin: {
        id: "pumpkin",
        name: "Pumpkin",
        emoji: "🎃",
        category: "farming",
        rarity: "Rare",
        description: "Bí ngô thu hoạch từ trang trại.",
        buyPrice: 0,
        sellPrice: 700
    },

    // =====================================
    // 🌱 HẠT GIỐNG
    // =====================================

    apple_seed: {
        id: "apple_seed",
        name: "Apple Seed",
        emoji: "🌱",
        category: "seed",
        seedType: "apple",
        rarity: "Common",
        description: "Hạt giống táo.",
        buyPrice: 100,
        sellPrice: 50,
        growTime: 30000,
        minHarvest: 2,
        maxHarvest: 4
    },

    wheat_seed: {
        id: "wheat_seed",
        name: "Wheat Seed",
        emoji: "🌱",
        category: "seed",
        seedType: "wheat",
        rarity: "Common",
        description: "Hạt giống lúa mì.",
        buyPrice: 150,
        sellPrice: 75,
        growTime: 45000,
        minHarvest: 3,
        maxHarvest: 5
    },

    tomato_seed: {
        id: "tomato_seed",
        name: "Tomato Seed",
        emoji: "🍅",
        category: "seed",
        seedType: "tomato",
        rarity: "Uncommon",
        description: "Hạt giống cà chua.",
        buyPrice: 300,
        sellPrice: 150,
        growTime: 60000,
        minHarvest: 2,
        maxHarvest: 4
    },

    pumpkin_seed: {
        id: "pumpkin_seed",
        name: "Pumpkin Seed",
        emoji: "🎃",
        category: "seed",
        seedType: "pumpkin",
        rarity: "Rare",
        description: "Hạt giống bí ngô.",
        buyPrice: 800,
        sellPrice: 400,
        growTime: 120000,
        minHarvest: 2,
        maxHarvest: 3
    },

    // =====================================
    // 🎣 CẦN CÂU
    // =====================================

    fishing_rod: {
        id: "fishing_rod",
        name: "Cần câu cơ bản",
        emoji: "🎣",
        category: "rod",
        rarity: "Common",
        description: "Cần câu cơ bản dành cho người mới.",
        buyPrice: 1000,
        sellPrice: 500,
        rodLevel: 1
    },

    iron_rod: {
        id: "iron_rod",
        name: "Cần câu sắt",
        emoji: "⚒️",
        category: "rod",
        rarity: "Uncommon",
        description: "Cần câu chắc chắn hơn.",
        buyPrice: 5000,
        sellPrice: 2500,
        rodLevel: 2
    },

    golden_rod: {
        id: "golden_rod",
        name: "Cần câu vàng",
        emoji: "✨",
        category: "rod",
        rarity: "Rare",
        description: "Cần câu quý hiếm.",
        buyPrice: 15000,
        sellPrice: 7500,
        rodLevel: 3
    },

    wind_rod: {
        id: "wind_rod",
        name: "Cần câu Phong Thần",
        emoji: "🌪️",
        category: "rod",
        rarity: "Legendary",
        description: "Cần câu huyền thoại mang sức mạnh của gió.",
        buyPrice: 50000,
        sellPrice: 25000,
        rodLevel: 4
    }
};

module.exports = items;
