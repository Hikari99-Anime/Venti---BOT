const items = {

    // ═══════════════════════════════════════
    // 🌾 NÔNG SẢN (thu hoạch được)
    // category: farming
    // ═══════════════════════════════════════

    apple: {
        id: "apple",
        name: "Táo",
        emoji: "🍎",
        category: "farming",
        sellPrice: 75,
        rating: 1
    },

    orange: {
        id: "orange",
        name: "Cam",
        emoji: "🍊",
        category: "farming",
        sellPrice: 113,
        rating: 2
    },

    wheat: {
        id: "wheat",
        name: "Lúa mì",
        emoji: "🌾",
        category: "farming",
        sellPrice: 100,
        rating: 2
    },

    tomato: {
        id: "tomato",
        name: "Cà chua",
        emoji: "🍅",
        category: "farming",
        sellPrice: 138,
        rating: 2
    },

    carrot: {
        id: "carrot",
        name: "Cà rốt",
        emoji: "🥕",
        category: "farming",
        sellPrice: 125,
        rating: 2
    },

    potato: {
        id: "potato",
        name: "Khoai tây",
        emoji: "🥔",
        category: "farming",
        sellPrice: 150,
        rating: 2
    },

    corn: {
        id: "corn",
        name: "Bắp",
        emoji: "🌽",
        category: "farming",
        sellPrice: 175,
        rating: 2
    },

    cabbage: {
        id: "cabbage",
        name: "Bắp cải",
        emoji: "🥬",
        category: "farming",
        sellPrice: 188,
        rating: 2
    },

    lettuce: {
        id: "lettuce",
        name: "Xà lách",
        emoji: "🥬",
        category: "farming",
        sellPrice: 200,
        rating: 3
    },

    strawberry: {
        id: "strawberry",
        name: "Dâu tây",
        emoji: "🍓",
        category: "farming",
        sellPrice: 282,
        rating: 3
    },

    blueberry: {
        id: "blueberry",
        name: "Việt quất",
        emoji: "🫐",
        category: "farming",
        sellPrice: 313,
        rating: 3
    },

    grape: {
        id: "grape",
        name: "Nho",
        emoji: "🍇",
        category: "farming",
        sellPrice: 344,
        rating: 3
    },

    peach: {
        id: "peach",
        name: "Đào",
        emoji: "🍑",
        category: "farming",
        sellPrice: 375,
        rating: 3
    },

    pear: {
        id: "pear",
        name: "Lê",
        emoji: "🍐",
        category: "farming",
        sellPrice: 388,
        rating: 3
    },

    lemon: {
        id: "lemon",
        name: "Chanh",
        emoji: "🍋",
        category: "farming",
        sellPrice: 425,
        rating: 4
    },

    watermelon: {
        id: "watermelon",
        name: "Dưa hấu",
        emoji: "🍉",
        category: "farming",
        sellPrice: 625,
        rating: 4
    },

    pineapple: {
        id: "pineapple",
        name: "Dứa",
        emoji: "🍍",
        category: "farming",
        sellPrice: 750,
        rating: 4
    },

    coconut: {
        id: "coconut",
        name: "Dừa",
        emoji: "🥥",
        category: "farming",
        sellPrice: 875,
        rating: 4
    },

    eggplant: {
        id: "eggplant",
        name: "Cà tím",
        emoji: "🍆",
        category: "farming",
        sellPrice: 938,
        rating: 4
    },

    chili: {
        id: "chili",
        name: "Ớt",
        emoji: "🌶️",
        category: "farming",
        sellPrice: 1000,
        rating: 5
    },

    golden_apple: {
        id: "golden_apple",
        name: "Táo vàng",
        emoji: "🍏",
        category: "farming",
        sellPrice: 2188,
        rating: 5
    },

    crystal_berry: {
        id: "crystal_berry",
        name: "Quả mọng pha lê",
        emoji: "💎",
        category: "farming",
        sellPrice: 3125,
        rating: 5
    },


    // ═══════════════════════════════════════
    // 🌱 HẠT GIỐNG (trồng ra nông sản)
    // category: seed
    // ═══════════════════════════════════════

    apple_seed: {
        id: "apple_seed",
        name: "Hạt giống Táo",
        emoji: "🌱",
        category: "seed",
        cropId: "apple",
        buyPrice: 50,
        growTime: 60000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Táo."
    },

    orange_seed: {
        id: "orange_seed",
        name: "Hạt giống Cam",
        emoji: "🌱",
        category: "seed",
        cropId: "orange",
        buyPrice: 70,
        growTime: 75000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Cam."
    },

    wheat_seed: {
        id: "wheat_seed",
        name: "Hạt giống Lúa mì",
        emoji: "🌱",
        category: "seed",
        cropId: "wheat",
        buyPrice: 60,
        growTime: 45000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Lúa mì."
    },

    tomato_seed: {
        id: "tomato_seed",
        name: "Hạt giống Cà chua",
        emoji: "🌱",
        category: "seed",
        cropId: "tomato",
        buyPrice: 90,
        growTime: 90000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Cà chua."
    },

    carrot_seed: {
        id: "carrot_seed",
        name: "Hạt giống Cà rốt",
        emoji: "🌱",
        category: "seed",
        cropId: "carrot",
        buyPrice: 80,
        growTime: 75000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Cà rốt."
    },

    potato_seed: {
        id: "potato_seed",
        name: "Hạt giống Khoai tây",
        emoji: "🌱",
        category: "seed",
        cropId: "potato",
        buyPrice: 100,
        growTime: 90000,
        minHarvest: 2,
        maxHarvest: 5,
        description: "Trồng ra Khoai tây."
    },

    corn_seed: {
        id: "corn_seed",
        name: "Hạt giống Bắp",
        emoji: "🌱",
        category: "seed",
        cropId: "corn",
        buyPrice: 110,
        growTime: 120000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Bắp."
    },

    cabbage_seed: {
        id: "cabbage_seed",
        name: "Hạt giống Bắp cải",
        emoji: "🌱",
        category: "seed",
        cropId: "cabbage",
        buyPrice: 120,
        growTime: 135000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Bắp cải."
    },

    lettuce_seed: {
        id: "lettuce_seed",
        name: "Hạt giống Xà lách",
        emoji: "🌱",
        category: "seed",
        cropId: "lettuce",
        buyPrice: 130,
        growTime: 150000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Xà lách."
    },

    strawberry_seed: {
        id: "strawberry_seed",
        name: "Hạt giống Dâu tây",
        emoji: "🌱",
        category: "seed",
        cropId: "strawberry",
        buyPrice: 180,
        growTime: 180000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Dâu tây."
    },

    blueberry_seed: {
        id: "blueberry_seed",
        name: "Hạt giống Việt quất",
        emoji: "🌱",
        category: "seed",
        cropId: "blueberry",
        buyPrice: 200,
        growTime: 195000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Việt quất."
    },

    grape_seed: {
        id: "grape_seed",
        name: "Hạt giống Nho",
        emoji: "🌱",
        category: "seed",
        cropId: "grape",
        buyPrice: 220,
        growTime: 210000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Nho."
    },

    peach_seed: {
        id: "peach_seed",
        name: "Hạt giống Đào",
        emoji: "🌱",
        category: "seed",
        cropId: "peach",
        buyPrice: 240,
        growTime: 225000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Đào."
    },

    pear_seed: {
        id: "pear_seed",
        name: "Hạt giống Lê",
        emoji: "🌱",
        category: "seed",
        cropId: "pear",
        buyPrice: 250,
        growTime: 240000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Lê."
    },

    lemon_seed: {
        id: "lemon_seed",
        name: "Hạt giống Chanh",
        emoji: "🌱",
        category: "seed",
        cropId: "lemon",
        buyPrice: 270,
        growTime: 270000,
        minHarvest: 2,
        maxHarvest: 4,
        description: "Trồng ra Chanh."
    },

    watermelon_seed: {
        id: "watermelon_seed",
        name: "Hạt giống Dưa hấu",
        emoji: "🌱",
        category: "seed",
        cropId: "watermelon",
        buyPrice: 400,
        growTime: 300000,
        minHarvest: 2,
        maxHarvest: 3,
        description: "Trồng ra Dưa hấu."
    },

    pineapple_seed: {
        id: "pineapple_seed",
        name: "Hạt giống Dứa",
        emoji: "🌱",
        category: "seed",
        cropId: "pineapple",
        buyPrice: 480,
        growTime: 330000,
        minHarvest: 2,
        maxHarvest: 3,
        description: "Trồng ra Dứa."
    },

    coconut_seed: {
        id: "coconut_seed",
        name: "Hạt giống Dừa",
        emoji: "🌱",
        category: "seed",
        cropId: "coconut",
        buyPrice: 560,
        growTime: 360000,
        minHarvest: 2,
        maxHarvest: 3,
        description: "Trồng ra Dừa."
    },

    eggplant_seed: {
        id: "eggplant_seed",
        name: "Hạt giống Cà tím",
        emoji: "🌱",
        category: "seed",
        cropId: "eggplant",
        buyPrice: 600,
        growTime: 390000,
        minHarvest: 2,
        maxHarvest: 3,
        description: "Trồng ra Cà tím."
    },

    chili_seed: {
        id: "chili_seed",
        name: "Hạt giống Ớt",
        emoji: "🌱",
        category: "seed",
        cropId: "chili",
        buyPrice: 640,
        growTime: 420000,
        minHarvest: 2,
        maxHarvest: 3,
        description: "Trồng ra Ớt."
    },

    golden_apple_seed: {
        id: "golden_apple_seed",
        name: "Hạt giống Táo vàng",
        emoji: "✨",
        category: "seed",
        cropId: "golden_apple",
        buyPrice: 1400,
        growTime: 480000,
        minHarvest: 2,
        maxHarvest: 3,
        description: "Trồng ra Táo vàng."
    },

    crystal_berry_seed: {
        id: "crystal_berry_seed",
        name: "Hạt giống Quả mọng pha lê",
        emoji: "💎",
        category: "seed",
        cropId: "crystal_berry",
        buyPrice: 2000,
        growTime: 540000,
        minHarvest: 2,
        maxHarvest: 3,
        description: "Trồng ra Quả mọng pha lê."
    },


    // ═══════════════════════════════════════
    // 🎣 CÁ
    // category: seafood
    // ═══════════════════════════════════════

    small_fish: {
        id: "small_fish",
        name: "Cá nhỏ",
        emoji: "🐟",
        category: "seafood",
        buyPrice: 80,
        sellPrice: 40
    },

    blue_fish: {
        id: "blue_fish",
        name: "Cá xanh",
        emoji: "🐠",
        category: "seafood",
        buyPrice: 150,
        sellPrice: 75
    },

    golden_fish: {
        id: "golden_fish",
        name: "Cá vàng",
        emoji: "🐡",
        category: "seafood",
        buyPrice: 350,
        sellPrice: 175
    },

    crystal_fish: {
        id: "crystal_fish",
        name: "Cá pha lê",
        emoji: "✨",
        category: "seafood",
        buyPrice: 800,
        sellPrice: 400
    },

    wind_fish: {
        id: "wind_fish",
        name: "Cá phong",
        emoji: "🌪️",
        category: "seafood",
        buyPrice: 2500,
        sellPrice: 1250
    },

    river_trout: {
        id: "river_trout",
        name: "Cá hồi sông",
        emoji: "🐟",
        category: "seafood",
        buyPrice: 100,
        sellPrice: 50
    },

    silver_fish: {
        id: "silver_fish",
        name: "Cá bạc",
        emoji: "🐟",
        category: "seafood",
        buyPrice: 120,
        sellPrice: 60
    },

    carp: {
        id: "carp",
        name: "Cá chép",
        emoji: "🐟",
        category: "seafood",
        buyPrice: 130,
        sellPrice: 65
    },

    koi: {
        id: "koi",
        name: "Cá Koi",
        emoji: "🎏",
        category: "seafood",
        buyPrice: 220,
        sellPrice: 110
    },

    rainbow_fish: {
        id: "rainbow_fish",
        name: "Cá cầu vồng",
        emoji: "🌈",
        category: "seafood",
        buyPrice: 280,
        sellPrice: 140
    },

    green_fish: {
        id: "green_fish",
        name: "Cá xanh lục",
        emoji: "🐟",
        category: "seafood",
        buyPrice: 110,
        sellPrice: 55
    },

    striped_fish: {
        id: "striped_fish",
        name: "Cá sọc",
        emoji: "🐠",
        category: "seafood",
        buyPrice: 300,
        sellPrice: 150
    },

    red_fish: {
        id: "red_fish",
        name: "Cá đỏ",
        emoji: "🐟",
        category: "seafood",
        buyPrice: 320,
        sellPrice: 160
    },

    pearl_fish: {
        id: "pearl_fish",
        name: "Cá ngọc trai",
        emoji: "🦪",
        category: "seafood",
        buyPrice: 500,
        sellPrice: 250
    },

    moon_fish: {
        id: "moon_fish",
        name: "Cá mặt trăng",
        emoji: "🌙",
        category: "seafood",
        buyPrice: 650,
        sellPrice: 325
    },

    star_fish: {
        id: "star_fish",
        name: "Sao biển",
        emoji: "⭐",
        category: "seafood",
        buyPrice: 700,
        sellPrice: 350
    },

    coral_fish: {
        id: "coral_fish",
        name: "Cá san hô",
        emoji: "🪸",
        category: "seafood",
        buyPrice: 750,
        sellPrice: 375
    },

    mist_fish: {
        id: "mist_fish",
        name: "Cá sương mù",
        emoji: "🌫️",
        category: "seafood",
        buyPrice: 1000,
        sellPrice: 500
    },

    storm_fish: {
        id: "storm_fish",
        name: "Cá bão tố",
        emoji: "⚡",
        category: "seafood",
        buyPrice: 1200,
        sellPrice: 600
    },

    sapphire_fish: {
        id: "sapphire_fish",
        name: "Cá sapphire",
        emoji: "🔷",
        category: "seafood",
        buyPrice: 1400,
        sellPrice: 700
    },

    emerald_fish: {
        id: "emerald_fish",
        name: "Cá ngọc lục bảo",
        emoji: "💚",
        category: "seafood",
        buyPrice: 1600,
        sellPrice: 800
    },

    phoenix_fish: {
        id: "phoenix_fish",
        name: "Cá phượng hoàng",
        emoji: "🔥",
        category: "seafood",
        buyPrice: 3500,
        sellPrice: 1750
    },

    celestial_fish: {
        id: "celestial_fish",
        name: "Cá thiên hà",
        emoji: "🌌",
        category: "seafood",
        buyPrice: 5000,
        sellPrice: 2500
    },

    anemo_fish: {
        id: "anemo_fish",
        name: "Cá Anemo",
        emoji: "🍃",
        category: "seafood",
        buyPrice: 7500,
        sellPrice: 3750
    },

    divine_fish: {
        id: "divine_fish",
        name: "Cá thần linh",
        emoji: "💫",
        category: "seafood",
        buyPrice: 10000,
        sellPrice: 5000
    },


    // ═══════════════════════════════════════
    // 🎣 CẦN CÂU
    // category: rod
    // ═══════════════════════════════════════

    fishing_rod: {
        id: "fishing_rod",
        name: "Cần câu cơ bản",
        emoji: "🎣",
        category: "rod",
        buyPrice: 1000,
        sellPrice: 500,
        rodLevel: 1
    },

    iron_rod: {
        id: "iron_rod",
        name: "Cần câu sắt",
        emoji: "⚒️",
        category: "rod",
        buyPrice: 5000,
        sellPrice: 2500,
        rodLevel: 2
    },

    golden_rod: {
        id: "golden_rod",
        name: "Cần câu vàng",
        emoji: "✨",
        category: "rod",
        buyPrice: 15000,
        sellPrice: 7500,
        rodLevel: 3
    },

    wind_rod: {
        id: "wind_rod",
        name: "Cần câu Phong Thần",
        emoji: "🌪️",
        category: "rod",
        buyPrice: 50000,
        sellPrice: 25000,
        rodLevel: 4
    },


    // ═══════════════════════════════════════
    // 🧰 NÔNG CỤ
    // category: tool
    // ═══════════════════════════════════════

    hoe: {
        id: "hoe",
        name: "Cuốc",
        emoji: "⛏️",
        category: "tool",
        buyPrice: 800,
        sellPrice: 0,
        description: "Dùng để cày đất trước khi trồng cây. Mua 1 lần, dùng mãi mãi."
    },

    watering_can: {
        id: "watering_can",
        name: "Bình tưới",
        emoji: "🪣",
        category: "tool",
        buyPrice: 1200,
        sellPrice: 0,
        description: "Dùng kèm Nước để tưới cây, giúp cây lớn nhanh hơn. Mua 1 lần, dùng mãi mãi."
    },

    water: {
        id: "water",
        name: "Nước",
        emoji: "💧",
        category: "tool",
        buyPrice: 20,
        sellPrice: 0,
        description: "Dùng kèm Bình tưới để tưới cây, mỗi lần tưới tốn 1 Nước."
    }
};

module.exports = items;
