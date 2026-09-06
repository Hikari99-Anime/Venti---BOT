const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    PermissionFlagsBits
} = require("discord.js");

const db =
    require("../../database/database");

const User =
    require("../../database/models/User");

// ==========================================
// 🎟️ LOTTERY CONFIG
// ==========================================

const TICKET_PRICE = 1000;

const BASE_JACKPOT = 10000;

const MIN_NUMBER = 0;

const MAX_NUMBER = 99999;

const MAX_TICKETS_PER_USER = 5;

const ROUND_DURATION =
    5 * 60 * 1000;

// ==========================================
// 🔧 SYSTEM
// ==========================================

let lotteryClient = null;

let lotteryTimer = null;

let panelUpdateTimer = null;

let drawing = false;

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 🔢 FORMAT TICKET
// ==========================================

function padTicket(number) {
    return String(number)
        .padStart(5, "0");
}

// ==========================================
// 🎟️ GET LOTTERY
// ==========================================

function getLottery(data) {

    if (!data.lottery) {

        data.lottery = {

            jackpot:
                BASE_JACKPOT,

            tickets: {},

            channelId: null,

            messageId: null,

            nextDrawAt:
                Date.now() +
                ROUND_DURATION,

            lastResult: null
        };
    }

    if (
        typeof data.lottery.jackpot !==
            "number" ||
        data.lottery.jackpot <
            BASE_JACKPOT
    ) {

        data.lottery.jackpot =
            BASE_JACKPOT;
    }

    if (
        !data.lottery.tickets
    ) {

        data.lottery.tickets = {};
    }

    if (
        !data.lottery.nextDrawAt
    ) {

        data.lottery.nextDrawAt =
            Date.now() +
            ROUND_DURATION;
    }

    if (
        !Object.prototype.hasOwnProperty.call(
            data.lottery,
            "lastResult"
        )
    ) {

        data.lottery.lastResult =
            null;
    }

    return data.lottery;
}

// ==========================================
// 🎟️ USER TICKETS
// ==========================================

function getUserTickets(
    lottery,
    userId
) {

    const tickets = [];

    for (
        const number of Object.keys(
            lottery.tickets
        )
    ) {

        if (
            lottery.tickets[number] ===
            userId
        ) {

            tickets.push(number);
        }
    }

    return tickets;
}

// ==========================================
// 🎟️ TOTAL TICKETS
// ==========================================

function getTicketCount(
    lottery
) {

    return Object.keys(
        lottery.tickets
    ).length;
}

// ==========================================
// 🔍 CHECK NUMBER
// ==========================================

function isNumberTaken(
    lottery,
    number
) {

    return Boolean(
        lottery.tickets[number]
    );
}

// ==========================================
// 🎲 RANDOM TICKET
// ==========================================

function getRandomTicket(
    lottery
) {

    const total =
        MAX_NUMBER -
        MIN_NUMBER +
        1;

    if (
        getTicketCount(lottery) >=
        total
    ) {

        return null;
    }

    let number;

    do {

        number =
            Math.floor(
                Math.random() *
                total
            );

    } while (
        isNumberTaken(
            lottery,
            padTicket(number)
        )
    );

    return padTicket(number);
}

// ==========================================
// ⏰ COUNTDOWN
// ==========================================

function getRemainingTime(
    lottery
) {

    const remaining =
        Math.max(
            0,
            Number(
                lottery.nextDrawAt || 0
            ) - Date.now()
        );

    const totalSeconds =
        Math.ceil(
            remaining / 1000
        );

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    return {

        remaining,

        minutes,

        seconds,

        text:
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(seconds)
                .padStart(2, "0")
    };
}

// ==========================================
// 🎨 LOTTERY EMBED
// ==========================================

function createLotteryEmbed(
    lottery
) {

    const time =
        getRemainingTime(
            lottery
        );

    const ticketCount =
        getTicketCount(
            lottery
        );

    const result =
        lottery.lastResult;

    const description = [

        // ==================================
        // ⏰ COUNTDOWN
        // ==================================

        "## ⏰ " + time.text,

        "",

        // ==================================
        // 💰 JACKPOT
        // ==================================

        "💰 **JACKPOT**",

        `> **${money(lottery.jackpot)} Mora**`,

        "",

        // ==================================
        // 🎟️ TICKET INFO
        // ==================================

        "🎟️ **VÉ ĐÃ BÁN**",

        `> **${ticketCount.toLocaleString("vi-VN")} vé**`,

        "",

        "🪙 **GIÁ MỖI VÉ**",

        `> **${money(TICKET_PRICE)} Mora**`,

        "",

        // ==================================
        // 📊 RULES
        // ==================================

        "📌 **THÔNG TIN**",

        "> `00000` → `99999`",

        `> Tối đa **${MAX_TICKETS_PER_USER} vé/người**`,

        "> Không thể mua trùng số",

        "",

        // ==================================
        // 🏆 LAST RESULT
        // ==================================

        "🏆 **KẾT QUẢ GẦN NHẤT**",

        result
            ? (
                result.winnerId
                    ? [
                        `> 🔢 Số trúng: **${result.number}**`,
                        `> 👤 Người thắng: <@${result.winnerId}>`,
                        `> 💰 Nhận được: **${money(result.jackpot)} Mora**`
                    ].join("\n")
                    : [
                        `> 🔢 Số quay: **${result.number}**`,
                        "> ❌ **Không có người trúng**",
                        `> 💰 Jackpot tiếp tục cộng dồn`
                    ].join("\n")
            )
            : "> Chưa có kết quả.",

        "",

        "୨୧ ─────────────── ୨୧",

        "",

        "🍃 Chúc bạn may mắn, nhà lữ hành."
    ];

    return new EmbedBuilder()

        .setColor(
            "#A8DCC0"
        )

        .setAuthor({
            name:
                "Venti • Lottery",

            iconURL:
                lotteryClient?.user
                    ?.displayAvatarURL()
        })

        .setDescription(
            description.join("\n")
        )

        .setFooter({
            text:
                "Venti Lottery • Cứ 5 phút quay một lần"
        })

        .setTimestamp();
}

// ==========================================
// 🔘 BUTTONS
// ==========================================

function createLotteryButtons() {

    return [

        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        "lottery_random"
                    )
                    .setLabel(
                        "Mua vé ngẫu nhiên"
                    )
                    .setEmoji("🎲")
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        "lottery_custom"
                    )
                    .setLabel(
                        "Chọn số"
                    )
                    .setEmoji("🔢")
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        "lottery_check"
                    )
                    .setLabel(
                        "Vé của tôi"
                    )
                    .setEmoji("🎟️")
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        "lottery_refresh"
                    )
                    .setLabel(
                        "Làm mới"
                    )
                    .setEmoji("🔄")
                    .setStyle(
                        ButtonStyle.Success
                    )
            )
    ];
}

// ==========================================
// 💾 SAVE
// ==========================================

async function saveLottery(
    data
) {

    db.save(data);
}

// ==========================================
// 🔄 UPDATE PANEL
// ==========================================

async function updateLotteryPanel(
    client
) {

    if (!client) {
        return;
    }

    const data =
        db.load();

    const lottery =
        getLottery(data);

    if (
        !lottery.channelId ||
        !lottery.messageId
    ) {

        return;
    }

    try {

        const channel =
            await client.channels.fetch(
                lottery.channelId
            );

        if (
            !channel ||
            !channel.isTextBased()
        ) {

            return;
        }

        const message =
            await channel.messages.fetch(
                lottery.messageId
            );

        await message.edit({

            embeds: [
                createLotteryEmbed(
                    lottery
                )
            ],

            components:
                createLotteryButtons()
        });

    } catch (error) {

        console.log(
            "[Lottery Panel]",
            error.message
        );
    }
}

// ==========================================
// 🏆 DRAW LOTTERY
// ==========================================

async function drawLottery(
    client
) {

    if (drawing) {
        return false;
    }

    const data =
        db.load();

    const lottery =
        getLottery(data);

    if (
        Date.now() <
        Number(
            lottery.nextDrawAt
        )
    ) {

        return false;
    }

    drawing = true;

    try {

        // ==================================
        // 🎲 QUAY RANDOM TOÀN BỘ 00000-99999
        // ==================================

        const randomNumber =
            Math.floor(
                Math.random() *
                (
                    MAX_NUMBER -
                    MIN_NUMBER +
                    1
                )
            );

        const winningNumber =
            padTicket(
                randomNumber
            );

        const winnerId =
            lottery.tickets[
                winningNumber
            ] || null;

        const oldJackpot =
            Number(
                lottery.jackpot ||
                BASE_JACKPOT
            );

        // ==================================
        // 🏆 CÓ NGƯỜI TRÚNG
        // ==================================

        if (winnerId) {

            User.addBalance(
                winnerId,
                oldJackpot
            );

            lottery.jackpot =
                BASE_JACKPOT;

        } else {

            // ==================================
            // ❌ KHÔNG AI TRÚNG
            // JACKPOT CỘNG DỒN
            // ==================================

            lottery.jackpot =
                oldJackpot;
        }

        // ==================================
        // 📜 LƯU KẾT QUẢ
        // ==================================

        lottery.lastResult = {

            number:
                winningNumber,

            winnerId:
                winnerId,

            jackpot:
                oldJackpot,

            drawTime:
                Date.now()
        };

        // ==================================
        // 🔄 RESET VÉ
        // ==================================

        lottery.tickets = {};

        // ==================================
        // ⏰ KỲ MỚI
        // ==================================

        lottery.nextDrawAt =
            Date.now() +
            ROUND_DURATION;

        await saveLottery(
            data
        );

        // ==================================
        // 🔄 CHỈ EDIT EMBED
        // ==================================

        await updateLotteryPanel(
            client
        );

        return true;

    } finally {

        drawing = false;
    }
}

// ==========================================
// 🚀 START SYSTEM
// ==========================================

function startLotterySystem(
    client
) {

    lotteryClient =
        client;

    if (
        lotteryTimer
    ) {

        return;
    }

    lotteryTimer =
        setInterval(
            async function () {

                try {

                    await drawLottery(
                        lotteryClient
                    );

                } catch (error) {

                    console.error(
                        "[Lottery Timer]",
                        error
                    );
                }

            },
            1000
        );

    // ======================================
    // 🔄 UPDATE COUNTDOWN
    // ======================================

    if (
        panelUpdateTimer
    ) {

        return;
    }

    panelUpdateTimer =
        setInterval(
            async function () {

                try {

                    await updateLotteryPanel(
                        lotteryClient
                    );

                } catch (error) {

                    console.error(
                        "[Lottery Panel Timer]",
                        error
                    );
                }

            },
            1000
        );
}

// ==========================================
// 🎟️ BUY TICKET
// ==========================================

async function buyTicket(
    interaction,
    selectedNumber
) {

    const data =
        db.load();

    const lottery =
        getLottery(data);

    const userId =
        interaction.user.id;

    // ======================================
    // ⏰ KIỂM TRA ĐÃ HẾT GIỜ
    // ======================================

    if (
        Date.now() >=
        Number(
            lottery.nextDrawAt
        )
    ) {

        await drawLottery(
            interaction.client
        );

        const refreshedData =
            db.load();

        const refreshedLottery =
            getLottery(
                refreshedData
            );

        if (
            Date.now() >=
            Number(
                refreshedLottery.nextDrawAt
            )
        ) {

            return interaction.reply({

                content:
                    "❌ Kỳ quay đang kết thúc. Vui lòng thử lại.",

                flags:
                    MessageFlags.Ephemeral
            });
        }
    }

    // ======================================
    // 🎟️ USER TICKETS
    // ======================================

    const userTickets =
        getUserTickets(
            lottery,
            userId
        );

    if (
        userTickets.length >=
        MAX_TICKETS_PER_USER
    ) {

        return interaction.reply({

            content:
                "❌ Bạn đã đủ " +
                MAX_TICKETS_PER_USER +
                " vé trong kỳ này.\n\n" +
                "🎟️ Vé của bạn:\n" +
                userTickets.join(", "),

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 🔢 TICKET NUMBER
    // ======================================

    let ticketNumber;

    if (
        selectedNumber !== null &&
        selectedNumber !== undefined
    ) {

        if (
            !Number.isInteger(
                selectedNumber
            ) ||
            selectedNumber <
                MIN_NUMBER ||
            selectedNumber >
                MAX_NUMBER
        ) {

            return interaction.reply({

                content:
                    "❌ Số vé phải từ `00000` đến `99999`.",

                flags:
                    MessageFlags.Ephemeral
            });
        }

        ticketNumber =
            padTicket(
                selectedNumber
            );

        if (
            isNumberTaken(
                lottery,
                ticketNumber
            )
        ) {

            return interaction.reply({

                content:
                    `❌ Số vé \`${ticketNumber}\` đã có người mua.`,

                flags:
                    MessageFlags.Ephemeral
            });
        }

    } else {

        ticketNumber =
            getRandomTicket(
                lottery
            );

        if (!ticketNumber) {

            return interaction.reply({

                content:
                    "❌ Đã hết số vé trong kỳ này.",

                flags:
                    MessageFlags.Ephemeral
            });
        }
    }

    // ======================================
    // 💰 CHECK BALANCE
    // ======================================

    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user.balance || 0
        );

    if (
        balance <
        TICKET_PRICE
    ) {

        return interaction.reply({

            content:
                "❌ Bạn không đủ Mora.\n\n" +
                `🪙 Cần: **${money(TICKET_PRICE)} Mora**\n` +
                `💰 Bạn có: **${money(balance)} Mora**`,

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 💸 TRỪ TIỀN DATABASE
    // ======================================

    const removed =
        User.removeBalance(
            userId,
            TICKET_PRICE
        );

    if (
        removed === false
    ) {

        return interaction.reply({

            content:
                "❌ Không thể trừ Mora. Vui lòng thử lại.",

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 🎟️ ADD TICKET
    // ======================================

    lottery.tickets[
        ticketNumber
    ] =
        userId;

    // ======================================
    // 💰 ADD JACKPOT
    // ======================================

    lottery.jackpot =
        Number(
            lottery.jackpot || 0
        ) +
        TICKET_PRICE;

    await saveLottery(
        data
    );

    // ======================================
    // 🎉 SUCCESS
    // ======================================

    await interaction.reply({

        content:
            "🎟️ **MUA VÉ THÀNH CÔNG**\n\n" +
            `🔢 Số vé: **${ticketNumber}**\n` +
            `🪙 Giá: **${money(TICKET_PRICE)} Mora**\n` +
            `💰 Jackpot: **${money(lottery.jackpot)} Mora**\n` +
            `🎟️ Vé của bạn: **${getUserTickets(lottery, userId).length}/${MAX_TICKETS_PER_USER}**`,

        flags:
            MessageFlags.Ephemeral
    });

    await updateLotteryPanel(
        interaction.client
    );
}

// ==========================================
// 🔢 CUSTOM MODAL
// ==========================================

async function openCustomModal(
    interaction
) {

    const modal =
        new ModalBuilder()

            .setCustomId(
                "lottery_custom_modal"
            )

            .setTitle(
                "🔢 Chọn số vé"
            );

    const input =
        new TextInputBuilder()

            .setCustomId(
                "lottery_number"
            )

            .setLabel(
                "Nhập số từ 00000 đến 99999"
            )

            .setPlaceholder(
                "Ví dụ: 01234"
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setMinLength(5)

            .setMaxLength(5)

            .setRequired(true);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(
                input
            )
    );

    await interaction.showModal(
        modal
    );
}

// ==========================================
// 🎟️ MY TICKETS
// ==========================================

async function showMyTickets(
    interaction
) {

    const data =
        db.load();

    const lottery =
        getLottery(data);

    const tickets =
        getUserTickets(
            lottery,
            interaction.user.id
        );

    if (
        tickets.length === 0
    ) {

        return interaction.reply({

            content:
                "🎟️ Bạn chưa có vé trong kỳ hiện tại.",

            flags:
                MessageFlags.Ephemeral
        });
    }

    return interaction.reply({

        content:
            "🎟️ **VÉ CỦA BẠN**\n\n" +
            tickets
                .map(
                    function (
                        ticket,
                        index
                    ) {

                        return (
                            `${index + 1}. \`${ticket}\``
                        );
                    }
                )
                .join("\n") +
            `\n\n📊 **${tickets.length}/${MAX_TICKETS_PER_USER} vé**`,

        flags:
            MessageFlags.Ephemeral
    });
}

// ==========================================
// ⚙️ SETUP
// ==========================================

async function setupLottery(
    interaction
) {

    if (
        !interaction.member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {

        return interaction.reply({

            content:
                "❌ Chỉ Admin mới có thể setup khu vé số.",

            flags:
                MessageFlags.Ephemeral
        });
    }

    const data =
        db.load();

    const lottery =
        getLottery(data);

    // ======================================
    // 🧹 DELETE OLD PANEL
    // ======================================

    if (
        lottery.channelId &&
        lottery.messageId
    ) {

        try {

            const oldChannel =
                await interaction.client.channels.fetch(
                    lottery.channelId
                );

            if (
                oldChannel &&
                oldChannel.isTextBased()
            ) {

                const oldMessage =
                    await oldChannel.messages.fetch(
                        lottery.messageId
                    );

                await oldMessage.delete();

            }

        } catch (error) {

            console.log(
                "[Lottery Old Panel]",
                error.message
            );
        }
    }

    // ======================================
    // 📌 SET CHANNEL
    // ======================================

    lottery.channelId =
        interaction.channel.id;

    lottery.messageId =
        null;

    lottery.nextDrawAt =
        Date.now() +
        ROUND_DURATION;

    lottery.lastResult =
        null;

    // ======================================
    // 🎟️ RESET VÉ KHI SETUP
    // ======================================

    lottery.tickets =
        {};

    lottery.jackpot =
        Math.max(
            Number(
                lottery.jackpot ||
                BASE_JACKPOT
            ),
            BASE_JACKPOT
        );

    // ======================================
    // 📌 SEND PANEL
    // ======================================

    const message =
        await interaction.channel.send({

            embeds: [
                createLotteryEmbed(
                    lottery
                )
            ],

            components:
                createLotteryButtons()
        });

    lottery.messageId =
        message.id;

    await saveLottery(
        data
    );

    startLotterySystem(
        interaction.client
    );

    // ======================================
    // 🧹 DELETE COMMAND MESSAGE
    // ======================================

    try {

        if (
            interaction.message
        ) {

            await interaction.message.delete();

        } else if (
            typeof interaction.delete ===
            "function"
        ) {

            await interaction.delete();

        }

    } catch (error) {

        console.log(
            "[Lottery Setup Delete]",
            error.message
        );
    }

    // ======================================
    // 📢 SETUP MESSAGE
    // TỰ XÓA SAU 5 GIÂY
    // ======================================

    const reply =
        await interaction.reply({

            content:
                "✅ Đã setup khu vé số tại " +
                interaction.channel.toString() +
                ".",

            flags:
                MessageFlags.Ephemeral
        });

    return reply;
}

// ==========================================
// 🗑️ REMOVE SETUP
// ==========================================

async function removeLotterySetup(
    interaction
) {

    if (
        !interaction.member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {

        return interaction.reply({

            content:
                "❌ Chỉ Admin mới có thể hủy setup.",

            flags:
                MessageFlags.Ephemeral
        });
    }

    const data =
        db.load();

    const lottery =
        getLottery(data);

    const channelId =
        lottery.channelId;

    const messageId =
        lottery.messageId;

    lottery.channelId =
        null;

    lottery.messageId =
        null;

    await saveLottery(
        data
    );

    // ======================================
    // 🗑️ DELETE PANEL
    // ======================================

    if (
        channelId &&
        messageId
    ) {

        try {

            const channel =
                await interaction.client.channels.fetch(
                    channelId
                );

            if (
                channel &&
                channel.isTextBased()
            ) {

                const message =
                    await channel.messages.fetch(
                        messageId
                    );

                await message.delete();
            }

        } catch (error) {

            console.log(
                "[Lottery Remove]",
                error.message
            );
        }
    }

    return interaction.reply({

        content:
            "✅ Đã hủy setup khu vé số.",

        flags:
            MessageFlags.Ephemeral
    });
}

// ==========================================
// 🎮 INTERACTION HANDLER
// ==========================================

async function handleLotteryInteraction(
    interaction
) {

    if (
        !interaction.isButton() &&
        !interaction.isModalSubmit()
    ) {

        return false;
    }

    const id =
        interaction.customId || "";

    if (
        !id.startsWith(
            "lottery_"
        )
    ) {

        return false;
    }

    startLotterySystem(
        interaction.client
    );

    // ======================================
    // 🔘 BUTTON
    // ======================================

    if (
        interaction.isButton()
    ) {

        if (
            id ===
            "lottery_random"
        ) {

            await buyTicket(
                interaction,
                null
            );

            return true;
        }

        if (
            id ===
            "lottery_custom"
        ) {

            await openCustomModal(
                interaction
            );

            return true;
        }

        if (
            id ===
            "lottery_check"
        ) {

            await showMyTickets(
                interaction
            );

            return true;
        }

        if (
            id ===
            "lottery_refresh"
        ) {

            const data =
                db.load();

            const lottery =
                getLottery(data);

            await interaction.update({

                embeds: [
                    createLotteryEmbed(
                        lottery
                    )
                ],

                components:
                    createLotteryButtons()
            });

            return true;
        }

        return false;
    }

    // ======================================
    // 🔢 MODAL
    // ======================================

    if (
        interaction.isModalSubmit() &&
        id ===
            "lottery_custom_modal"
    ) {

        const raw =
            interaction.fields
                .getTextInputValue(
                    "lottery_number"
                )
                .trim();

        if (
            !/^[0-9]{5}$/.test(raw)
        ) {

            await interaction.reply({

                content:
                    "❌ Vui lòng nhập đúng 5 chữ số.",

                flags:
                    MessageFlags.Ephemeral
            });

            return true;
        }

        const number =
            Number(raw);

        await buyTicket(
            interaction,
            number
        );

        return true;
    }

    return false;
}

// ==========================================
// 📦 COMMAND
// ==========================================

module.exports = {

    name:
        "lottery",

    aliases: [
        "vé số",
        "veso"
    ],

    description:
        "Vé số Venti.",

    async execute(
        message,
        args
    ) {

        startLotterySystem(
            message.client
        );

        const subcommand =
            args[0]
                ? args[0].toLowerCase()
                : "";

        // ==================================
        // ⚙️ SETUP
        // ==================================

        if (
            subcommand ===
            "setup"
        ) {

            const fakeInteraction = {

                member:
                    message.member,

                channel:
                    message.channel,

                client:
                    message.client,

                user:
                    message.author,

                reply:
                    async function (
                        options
                    ) {

                        return message.reply(
                            options
                        );
                    }
            };

            const result =
                await setupLottery(
                    fakeInteraction
                );

            // ==================================
            // 🧹 TỰ XÓA MESSAGE COMMAND
            // ==================================

            try {

                await message.delete();

            } catch (error) {

                console.log(
                    "[Lottery Command Delete]",
                    error.message
                );
            }

            return result;
        }

        // ==================================
        // 🗑️ REMOVE SETUP
        // ==================================

        if (
            subcommand ===
            "huysetup"
        ) {

            const fakeInteraction = {

                member:
                    message.member,

                channel:
                    message.channel,

                client:
                    message.client,

                user:
                    message.author,

                reply:
                    async function (
                        options
                    ) {

                        return message.reply(
                            options
                        );
                    }
            };

            const result =
                await removeLotterySetup(
                    fakeInteraction
                );

            try {

                await message.delete();

            } catch (error) {

                console.log(
                    "[Lottery Command Delete]",
                    error.message
                );
            }

            return result;
        }

        // ==================================
        // 🎟️ CHECK
        // ==================================

        if (
            subcommand ===
            "check"
        ) {

            const data =
                db.load();

            const lottery =
                getLottery(data);

            const tickets =
                getUserTickets(
                    lottery,
                    message.author.id
                );

            if (
                tickets.length === 0
            ) {

                return message.reply(
                    "🎟️ Bạn chưa có vé trong kỳ hiện tại."
                );
            }

            const reply =
                await message.reply(
                    [
                        "🎟️ **VÉ SỐ CỦA BẠN**",
                        "",
                        tickets
                            .map(
                                function (
                                    ticket,
                                    index
                                ) {

                                    return (
                                        `${index + 1}. \`${ticket}\``
                                    );
                                }
                            )
                            .join("\n"),
                        "",
                        `📊 **${tickets.length}/${MAX_TICKETS_PER_USER} vé**`
                    ].join("\n")
                );

            // ==================================
            // 🧹 XÓA THÔNG BÁO CHECK
            // ==================================

            setTimeout(
                async function () {

                    try {

                        await reply.delete();

                    } catch (error) {

                        // Ignore
                    }

                },
                5000
            );

            return reply;
        }

        // ==================================
        // ℹ️ INFO
        // ==================================

        const data =
            db.load();

        const lottery =
            getLottery(data);

        const time =
            getRemainingTime(
                lottery
            );

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#A8DCC0"
                )

                .setAuthor({
                    name:
                        `${message.author.username} • Lottery`,

                    iconURL:
                        message.author
                            .displayAvatarURL()
                })

                .setDescription(
                    [
                        "🎟️ **VENTI LOTTERY**",
                        "",
                        "⏰ **" +
                        time.text +
                        "**",
                        "",
                        "💰 **Jackpot**",
                        `> **${money(lottery.jackpot)} Mora**`,
                        "",
                        "🎟️ **Vé đã bán**",
                        `> **${getTicketCount(lottery)} vé**`,
                        "",
                        "🪙 **Giá vé**",
                        `> **${money(TICKET_PRICE)} Mora**`,
                        "",
                        "🔢 **Phạm vi số**",
                        "> `00000` → `99999`",
                        "",
                        `👤 **Tối đa ${MAX_TICKETS_PER_USER} vé/người**`,
                        "",
                        lottery.lastResult
                            ? (
                                lottery.lastResult.winnerId
                                    ? `🏆 Kết quả gần nhất: **${lottery.lastResult.number}** • <@${lottery.lastResult.winnerId}>`
                                    : `🏆 Kết quả gần nhất: **${lottery.lastResult.number}** • Không có người trúng`
                            )
                            : "🏆 Chưa có kết quả."
                    ].join("\n")
                )

                .setFooter({
                    text:
                        "Venti • Lottery"
                })

                .setTimestamp();

        const reply =
            await message.reply({
                embeds: [
                    embed
                ]
            });

        setTimeout(
            async function () {

                try {

                    await reply.delete();

                } catch (error) {

                    // Ignore
                }

            },
            10000
        );

        return reply;
    },

    handleInteraction:
        handleLotteryInteraction,

    startLotterySystem:
        startLotterySystem
};
