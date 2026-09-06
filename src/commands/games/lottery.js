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
// 🎰 LOTTERY CONFIG
// ==========================================

const TICKET_PRICE =
    1000;

const BASE_JACKPOT =
    10000;

const MIN_NUMBER =
    0;

const MAX_NUMBER =
    99999;

const MAX_TICKETS_PER_USER =
    5;

const ROUND_DURATION =
    5 * 60 * 1000;

// ==========================================
// ⚙️ SYSTEM
// ==========================================

let lotteryClient =
    null;

let lotteryTimer =
    null;

let panelUpdateTimer =
    null;

// ==========================================
// 💰 MONEY
// ==========================================

function money(amount) {

    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 🔢 TICKET
// ==========================================

function padTicket(number) {

    return String(
        number
    ).padStart(
        5,
        "0"
    );
}

// ==========================================
// 🎰 GET LOTTERY
// ==========================================

function getLottery(data) {

    if (!data.lottery) {

        data.lottery = {

            jackpot:
                BASE_JACKPOT,

            tickets: {},

            channelId:
                null,

            messageId:
                null,

            nextDrawAt:
                Date.now() +
                ROUND_DURATION,

            previous:
                null
        };
    }

    // ======================================
    // 🛠️ FIX OLD DATA
    // ======================================

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
        typeof data.lottery.channelId ===
        "undefined"
    ) {

        data.lottery.channelId =
            null;
    }

    if (
        typeof data.lottery.messageId ===
        "undefined"
    ) {

        data.lottery.messageId =
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

    return Object.keys(
        lottery.tickets
    ).filter(
        number =>
            lottery.tickets[number] ===
            userId
    );
}

// ==========================================
// 🎟️ TICKET COUNT
// ==========================================

function getTicketCount(
    lottery
) {

    return Object.keys(
        lottery.tickets
    ).length;
}

// ==========================================
// 🔎 TAKEN
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
        getTicketCount(
            lottery
        ) >= total
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

    return padTicket(
        number
    );
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
            ) -
            Date.now()
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
// 🎨 CREATE EMBED
// ==========================================

function createLotteryEmbed(
    lottery
) {

    const time =
        getRemainingTime(
            lottery
        );

    const previous =
        lottery.previous;

    let resultText =
        "Chưa có kết quả kỳ trước.";

    if (previous) {

        if (
            previous.winnerId &&
            previous.number
        ) {

            resultText =
                [
                    `🎯 Số trúng: **${previous.number}**`,
                    `🏆 Người thắng: <@${previous.winnerId}>`,
                    `💰 Jackpot: **${money(previous.jackpot)} Mora**`
                ].join("\n");

        } else {

            resultText =
                [
                    `🎯 Số trúng: **${previous.number}**`,
                    "🏆 Người thắng: **Không có người trúng**",
                    `💰 Jackpot được cộng dồn: **${money(lottery.jackpot)} Mora**`
                ].join("\n");
        }
    }

    return new EmbedBuilder()

        .setColor(
            "#A8DCC0"
        )

        .setAuthor({
            name:
                "🍃 Venti • Lottery"
        })

        .setTitle(
            "🎟️ VÉ SỐ VENTI"
        )

        .setDescription(
            [
                `## ⏰ ${time.text}`,

                "",

                "🎰 **JACKPOT**",
                `> 💰 **${money(lottery.jackpot)} Mora**`,

                "",

                "🎟️ **GIÁ VÉ**",
                `> 🪙 **${money(TICKET_PRICE)} Mora / vé**`,

                "",

                "📊 **THỐNG KÊ**",
                `> 🎫 Vé đã bán: **${getTicketCount(lottery)}**`,
                `> 👤 Tối đa mỗi người: **${MAX_TICKETS_PER_USER} vé**`,

                "",

                "🎯 **KẾT QUẢ GẦN NHẤT**",
                `> ${resultText.replace(/\n/g, "\n> ")}`,

                "",

                "୨୧ ─────────────── ୨୧",

                "🔢 Số vé: `00000` → `99999`",
                "🎲 Có thể mua số ngẫu nhiên",
                "🔢 Hoặc tự chọn số",
                "🚫 Không thể mua trùng số",

                "",

                "🍃 Chúc bạn may mắn, nhà lữ hành."
            ].join("\n")
        )

        .setFooter({
            text:
                "Venti • Lottery • Jackpot không có người trúng sẽ cộng dồn"
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
                    .setEmoji(
                        "🎲"
                    )
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
                    .setEmoji(
                        "🔢"
                    )
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
                    .setEmoji(
                        "🎟️"
                    )
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
                    .setEmoji(
                        "🔄"
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            )
    ];
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
        getLottery(
            data
        );

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
// 💾 SAVE
// ==========================================

async function saveLottery(
    data
) {

    db.save(
        data
    );
}

// ==========================================
// 🎰 DRAW LOTTERY
// ==========================================

async function drawLottery(
    client
) {

    const data =
        db.load();

    const lottery =
        getLottery(
            data
        );

    if (
        Date.now() <
        Number(
            lottery.nextDrawAt
        )
    ) {

        return false;
    }

    const numbers =
        Object.keys(
            lottery.tickets
        );

    const oldJackpot =
        lottery.jackpot;

    let winnerId =
        null;

    let winningNumber =
        null;

    // ======================================
    // 🎲 RANDOM WINNING NUMBER
    // ======================================

    if (
        numbers.length > 0
    ) {

        const index =
            Math.floor(
                Math.random() *
                numbers.length
            );

        winningNumber =
            numbers[index];

        winnerId =
            lottery.tickets[
                winningNumber
            ];

        // ==================================
        // 💰 PAY WINNER
        // ==================================

        if (
            winnerId
        ) {

            User.addBalance(
                winnerId,
                oldJackpot
            );
        }
    }

    // ======================================
    // 📜 SAVE RESULT
    // ======================================

    lottery.previous = {

        number:
            winningNumber ||
            "Không có",

        winnerId:
            winnerId,

        jackpot:
            oldJackpot,

        drawTime:
            new Date()
                .toLocaleString(
                    "vi-VN"
                )
    };

    // ======================================
    // 🎰 NEXT ROUND
    // ======================================

    lottery.tickets =
        {};

    /*
     * Nếu có người trúng:
     * Jackpot reset về BASE.
     *
     * Nếu không có người trúng:
     * Giữ nguyên jackpot để cộng dồn.
     */

    if (
        winnerId
    ) {

        lottery.jackpot =
            BASE_JACKPOT;
    }

    lottery.nextDrawAt =
        Date.now() +
        ROUND_DURATION;

    await saveLottery(
        data
    );

    // ======================================
    // 🔄 UPDATE PANEL
    // ======================================

    await updateLotteryPanel(
        client
    );

    return true;
}

// ==========================================
// ▶️ START SYSTEM
// ==========================================

function startLotterySystem(
    client
) {

    lotteryClient =
        client;

    // ======================================
    // 🎰 DRAW TIMER
    // ======================================

    if (
        !lotteryTimer
    ) {

        lotteryTimer =
            setInterval(
                async () => {

                    try {

                        await drawLottery(
                            lotteryClient
                        );

                    } catch (
                        error
                    ) {

                        console.error(
                            "[Lottery Timer]",
                            error
                        );
                    }

                },
                1000
            );
    }

    // ======================================
    // 🔄 PANEL COUNTDOWN
    // ======================================

    if (
        !panelUpdateTimer
    ) {

        panelUpdateTimer =
            setInterval(
                async () => {

                    try {

                        const data =
                            db.load();

                        const lottery =
                            getLottery(
                                data
                            );

                        if (
                            lottery.channelId &&
                            lottery.messageId
                        ) {

                            await updateLotteryPanel(
                                lotteryClient
                            );
                        }

                    } catch (
                        error
                    ) {

                        console.error(
                            "[Lottery Panel Timer]",
                            error
                        );
                    }

                },
                1000
            );
    }
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
        getLottery(
            data
        );

    const userId =
        interaction.user.id;

    // ======================================
    // 🎟️ CHECK USER LIMIT
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
                [
                    "❌ **Bạn đã đạt giới hạn vé.**",
                    "",
                    `🎟️ Vé của bạn: ${userTickets.join(", ")}`,
                    `📊 ${userTickets.length}/${MAX_TICKETS_PER_USER} vé`
                ].join("\n"),

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 🔢 DETERMINE TICKET
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

        if (
            !ticketNumber
        ) {

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
                [
                    "❌ **Bạn không đủ Mora.**",
                    "",
                    `🪙 Cần: **${money(TICKET_PRICE)} Mora**`,
                    `💰 Bạn có: **${money(balance)} Mora**`
                ].join("\n"),

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 💰 TRỪ TIỀN
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
                "❌ Không thể trừ Mora của bạn. Vui lòng thử lại.",

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

    lottery.jackpot +=
        TICKET_PRICE;

    await saveLottery(
        data
    );

    // ======================================
    // 🎉 SUCCESS
    // ======================================

    const updatedUser =
        User.getOrCreate(
            userId
        );

    const newBalance =
        Number(
            updatedUser.balance || 0
        );

    await interaction.reply({

        content:
            [
                "🎟️ **MUA VÉ THÀNH CÔNG!**",
                "",
                `🔢 Số vé: **${ticketNumber}**`,
                `🪙 Giá vé: **${money(TICKET_PRICE)} Mora**`,
                `💰 Jackpot: **${money(lottery.jackpot)} Mora**`,
                "",
                `🎟️ Vé của bạn: **${getUserTickets(lottery, userId).length}/${MAX_TICKETS_PER_USER}**`,
                `💳 Số dư còn lại: **${money(newBalance)} Mora**`
            ].join("\n"),

        flags:
            MessageFlags.Ephemeral
    });

    await updateLotteryPanel(
        interaction.client
    );
}

// ==========================================
// 🔢 CUSTOM NUMBER MODAL
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
                "Nhập 5 chữ số"
            )
            .setPlaceholder(
                "Ví dụ: 01234"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(
                5
            )
            .setMaxLength(
                5
            )
            .setRequired(
                true
            );

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(
                input
            )
    );

    return interaction.showModal(
        modal
    );
}

// ==========================================
// 🎟️ SHOW MY TICKETS
// ==========================================

async function showMyTickets(
    interaction
) {

    const data =
        db.load();

    const lottery =
        getLottery(
            data
        );

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
            [
                "🎟️ **VÉ CỦA BẠN**",
                "",
                tickets
                    .map(
                        (ticket, index) =>
                            `${index + 1}. \`${ticket}\``
                    )
                    .join("\n"),
                "",
                `📊 ${tickets.length}/${MAX_TICKETS_PER_USER} vé`
            ].join("\n"),

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
        getLottery(
            data
        );

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
                    )
                    .catch(
                        () => null
                    );

                if (
                    oldMessage
                ) {

                    await oldMessage.delete()
                        .catch(
                            () => {}
                        );
                }
            }

        } catch {
            // Ignore old panel errors
        }
    }

    // ======================================
    // 🎰 RESET PANEL LOCATION
    // ======================================

    lottery.channelId =
        interaction.channel.id;

    lottery.messageId =
        null;

    // ======================================
    // 🎰 NEW ROUND IF NEEDED
    // ======================================

    if (
        !lottery.nextDrawAt ||
        Number(
            lottery.nextDrawAt
        ) <= Date.now()
    ) {

        lottery.nextDrawAt =
            Date.now() +
            ROUND_DURATION;
    }

    // ======================================
    // 📌 SEND ONLY ONE PANEL
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
    // 🧹 DELETE SETUP COMMAND
    // ======================================

    if (
        interaction.message &&
        interaction.message.deletable
    ) {

        await interaction.message
            .delete()
            .catch(
                () => {}
            );
    }

    // ======================================
    // 📢 NO MESSAGE IN LOTTERY CHANNEL
    // ======================================

    return interaction.reply({

        content:
            `✅ Đã setup khu vé số tại ${interaction.channel}.\n` +
            "🎟️ Panel vé số đã được tạo.",

        flags:
            MessageFlags.Ephemeral
    });
}

// ==========================================
// ❌ REMOVE SETUP
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
        getLottery(
            data
        );

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
                    )
                    .catch(
                        () => null
                    );

                if (
                    message
                ) {

                    await message.delete()
                        .catch(
                            () => {}
                        );
                }
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
// 🔘 INTERACTION
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
                getLottery(
                    data
                );

            return interaction.update({

                embeds: [
                    createLotteryEmbed(
                        lottery
                    )
                ],

                components:
                    createLotteryButtons()
            });
        }

        return false;
    }

    // ======================================
    // 🪟 MODAL
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
            !/^[0-9]{5}$/.test(
                raw
            )
        ) {

            return interaction.reply({

                content:
                    "❌ Vui lòng nhập đúng 5 chữ số.",

                flags:
                    MessageFlags.Ephemeral
            });
        }

        const number =
            Number(
                raw
            );

        await buyTicket(
            interaction,
            number
        );

        return true;
    }

    return false;
}

// ==========================================
// 💬 COMMAND
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

    usage:
        "Vlottery",

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

                message:
                    message,

                reply:
                    async options =>
                        message.reply(
                            options
                        )
            };

            return setupLottery(
                fakeInteraction
            );
        }

        // ==================================
        // ❌ REMOVE SETUP
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

                message:
                    message,

                reply:
                    async options =>
                        message.reply(
                            options
                        )
            };

            return removeLotterySetup(
                fakeInteraction
            );
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
                getLottery(
                    data
                );

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

            return message.reply(
                [
                    "🎟️ **VÉ SỐ CỦA BẠN**",
                    "",
                    tickets
                        .map(
                            (ticket, index) =>
                                `${index + 1}. \`${ticket}\``
                        )
                        .join("\n"),
                    "",
                    `📊 ${tickets.length}/${MAX_TICKETS_PER_USER} vé`
                ].join("\n")
            );
        }

        // ==================================
        // 📊 INFO
        // ==================================

        const data =
            db.load();

        const lottery =
            getLottery(
                data
            );

        return message.reply({

            embeds: [
                createLotteryEmbed(
                    lottery
                )
            ]
        });
    },

    handleInteraction:
        handleLotteryInteraction,

    startLotterySystem:
        startLotterySystem
};
