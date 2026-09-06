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
// ⚙️ CONFIG
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
// 🔧 SYSTEM
// ==========================================

let lotteryClient =
    null;

let lotteryTimer =
    null;

let panelUpdateTimer =
    null;

// ==========================================
// 💰 FORMAT NUMBER
// ==========================================

function formatNumber(number) {

    return Number(
        number || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// 🔢 PAD NUMBER
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
            String(minutes).padStart(
                2,
                "0"
            ) +
            ":" +
            String(seconds).padStart(
                2,
                "0"
            )
    };
}

// ==========================================
// 🎟️ GET LOTTERY
// ==========================================

function getLottery(data) {

    if (!data.lottery) {

        data.lottery = {

            jackpot:
                BASE_JACKPOT,

            round:
                1,

            tickets:
                {},

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
        !Number.isInteger(
            data.lottery.round
        ) ||
        data.lottery.round < 1
    ) {

        data.lottery.round =
            1;
    }

    if (
        !data.lottery.tickets
    ) {

        data.lottery.tickets =
            {};
    }

    if (
        !data.lottery.nextDrawAt
    ) {

        data.lottery.nextDrawAt =
            Date.now() +
            ROUND_DURATION;
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
        const number of
        Object.keys(
            lottery.tickets
        )
    ) {

        if (
            lottery.tickets[
                number
            ] === userId
        ) {

            tickets.push(
                number
            );
        }
    }

    return tickets;
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
// 🔍 CHECK NUMBER
// ==========================================

function isNumberTaken(
    lottery,
    number
) {

    return Boolean(
        lottery.tickets[
            number
        ]
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
            number
        )
    );

    return padTicket(
        number
    );
}

// ==========================================
// 📜 PREVIOUS RESULT
// ==========================================

function createPreviousResult(
    lottery
) {

    const previous =
        lottery.previous;

    if (!previous) {

        return [
            "> `📜` **Kết quả kỳ trước**",
            "> Chưa có kỳ quay trước."
        ].join("\n");
    }

    const winner =
        previous.winnerId
            ? `<@${previous.winnerId}>`
            : "**Không có người trúng**";

    return [
        "> `📜` **KẾT QUẢ KỲ TRƯỚC**",

        "",

        `> \`🎫\` **Kỳ** #${String(
            previous.round
        ).padStart(
            3,
            "0"
        )}`,

        `> \`🔢\` **Số trúng:** \`${previous.number}\``,

        `> \`🏆\` **Người trúng:** ${winner}`,

        `> \`💰\` **Jackpot:** ${formatNumber(
            previous.jackpot
        )} Mora`,

        `> \`⏰\` ${previous.drawTime}`
    ].join("\n");
}

// ==========================================
// 🎟️ LOTTERY EMBED
// ==========================================

function createLotteryEmbed(
    lottery
) {

    const time =
        getRemainingTime(
            lottery
        );

    return new EmbedBuilder()

        .setColor(
            "#A8DCC0"
        )

        .setAuthor({
            name:
                `Venti • Lottery #${String(
                    lottery.round
                ).padStart(
                    3,
                    "0"
                )}`
        })

        .setDescription(
            [
                // ==================================
                // ⏰ COUNTDOWN LỚN
                // ==================================

                "# ⏰ " + time.text,

                "",

                "**🎟️ VÉ SỐ VENTI**",

                "",

                `> \`🎫\` **Kỳ hiện tại:** #${String(
                    lottery.round
                ).padStart(
                    3,
                    "0"
                )}`,

                `> \`💰\` **Jackpot:** ${formatNumber(
                    lottery.jackpot
                )} Mora`,

                `> \`🪙\` **Giá vé:** ${formatNumber(
                    TICKET_PRICE
                )} Mora`,

                `> \`🎟️\` **Đã bán:** ${getTicketCount(
                    lottery
                )} vé`,

                `> \`👤\` **Tối đa:** ${MAX_TICKETS_PER_USER} vé/người`,

                "",

                "> `🔢` **Kho số**",

                "> `00000 → 99999`",

                "",

                createPreviousResult(
                    lottery
                ),

                "",

                "🍃 *Chọn số may mắn và chờ kỳ quay!*"
            ].join("\n")
        )

        .setFooter({
            text:
                "Venti • Lottery • Kỳ quay mỗi 5 phút"
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

    } catch (
        error
    ) {

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
// 🧹 CLEAN CHANNEL
// ==========================================

async function cleanLotteryChannel(
    channel,
    keepMessageId = null
) {

    if (
        !channel ||
        !channel.isTextBased()
    ) {

        return;
    }

    try {

        let messages;

        do {

            messages =
                await channel.messages.fetch({
                    limit: 100
                });

            if (
                messages.size ===
                0
            ) {

                break;
            }

            const deletable =
                messages.filter(
                    message =>
                        message.id !==
                        keepMessageId &&
                        message.deletable
                );

            if (
                deletable.size ===
                0
            ) {

                break;
            }

            await channel.bulkDelete(
                deletable,
                true
            );

            if (
                messages.size <
                100
            ) {

                break;
            }

        } while (
            true
        );

    } catch (
        error
    ) {

        console.log(
            "[Lottery Clean]",
            error.message
        );
    }
}

// ==========================================
// 🎉 DRAW LOTTERY
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

    const oldRound =
        lottery.round;

    const oldJackpot =
        lottery.jackpot;

    let winnerId =
        null;

    let winningNumber =
        null;

    // ======================================
    // 🎲 DRAW
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

            const winner =
                User.getOrCreate(
                    winnerId
                );

            winner.balance =
                Number(
                    winner.balance ||
                    0
                ) +
                oldJackpot;

            User.update(
                winnerId,
                {
                    balance:
                        winner.balance
                }
            );
        }
    }

    // ======================================
    // 📜 SAVE PREVIOUS RESULT
    // ======================================

    lottery.previous = {

        round:
            oldRound,

        number:
            winningNumber ||
            "Không có",

        winnerId:
            winnerId,

        jackpot:
            oldJackpot,

        drawTime:
            new Date().toLocaleString(
                "vi-VN"
            )
    };

    // ======================================
    // 🔄 NEW ROUND
    // ======================================

    lottery.round =
        oldRound +
        1;

    lottery.tickets =
        {};

    lottery.jackpot =
        BASE_JACKPOT;

    lottery.nextDrawAt =
        Date.now() +
        ROUND_DURATION;

    await saveLottery(
        data
    );

    // ======================================
    // ⭐ EDIT PANEL ONLY
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
    // 🎲 DRAW TIMER
    // ======================================

    if (
        !lotteryTimer
    ) {

        lotteryTimer =
            setInterval(
                async function () {

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
    // ⏰ COUNTDOWN UPDATE
    // ======================================

    if (
        !panelUpdateTimer
    ) {

        panelUpdateTimer =
            setInterval(
                async function () {

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

    if (
        !lottery.channelId ||
        !lottery.messageId
    ) {

        return interaction.reply({

            content:
                "❌ Khu vé số chưa được setup.",

            flags:
                MessageFlags.Ephemeral
        });
    }

    const userId =
        interaction.user.id;

    const userTickets =
        getUserTickets(
            lottery,
            userId
        );

    // ======================================
    // 👤 MAX TICKETS
    // ======================================

    if (
        userTickets.length >=
        MAX_TICKETS_PER_USER
    ) {

        return interaction.reply({

            content:
                [
                    "❌ **Bạn đã đủ vé trong kỳ này.**",
                    "",
                    `> \`🎟️\` ${userTickets
                        .map(
                            ticket =>
                                `\`${ticket}\``
                        )
                        .join(
                            " • "
                        )}`
                ].join("\n"),

            flags:
                MessageFlags.Ephemeral
        });
    }

    let ticketNumber;

    // ======================================
    // 🔢 CUSTOM NUMBER
    // ======================================

    if (
        selectedNumber !== null &&
        selectedNumber !== undefined
    ) {

        ticketNumber =
            padTicket(
                selectedNumber
            );

        if (
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
    // 👤 USER
    // ======================================

    const user =
        User.getOrCreate(
            userId
        );

    const balance =
        Number(
            user.balance ||
            0
        );

    // ======================================
    // 💰 BALANCE
    // ======================================

    if (
        balance <
        TICKET_PRICE
    ) {

        return interaction.reply({

            content:
                [
                    "❌ **Bạn không đủ Mora.**",
                    "",
                    `> \`💰\` **Cần:** ${formatNumber(
                        TICKET_PRICE
                    )} Mora`,

                    `> \`💳\` **Bạn có:** ${formatNumber(
                        balance
                    )} Mora`
                ].join("\n"),

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 💸 REMOVE MONEY
    // ======================================

    user.balance =
        balance -
        TICKET_PRICE;

    // ======================================
    // 🎟️ SAVE TICKET
    // ======================================

    lottery.tickets[
        ticketNumber
    ] =
        userId;

    // ======================================
    // 💰 JACKPOT
    // ======================================

    lottery.jackpot +=
        TICKET_PRICE;

    await saveLottery(
        data
    );

    // ======================================
    // 🎉 SUCCESS
    // ======================================

    await interaction.reply({

        content:
            [
                "🎟️ **MUA VÉ THÀNH CÔNG!**",

                "",

                `> \`🔢\` **Số vé:** \`${ticketNumber}\``,

                `> \`🪙\` **Giá:** ${formatNumber(
                    TICKET_PRICE
                )} Mora`,

                `> \`💰\` **Jackpot:** ${formatNumber(
                    lottery.jackpot
                )} Mora`,

                `> \`🎟️\` **Vé:** ${getUserTickets(
                    lottery,
                    userId
                ).length}/${MAX_TICKETS_PER_USER}`
            ].join("\n"),

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

    await interaction.showModal(
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
        tickets.length ===
        0
    ) {

        return interaction.reply({

            content:
                `🎟️ Bạn chưa có vé trong kỳ #${String(
                    lottery.round
                ).padStart(
                    3,
                    "0"
                )}.`,

            flags:
                MessageFlags.Ephemeral
        });
    }

    return interaction.reply({

        content:
            [
                "🎟️ **VÉ CỦA BẠN**",

                "",

                `> \`🎫\` **Kỳ #${String(
                    lottery.round
                ).padStart(
                    3,
                    "0"
                )}`,

                "",

                tickets
                    .map(
                        function (
                            ticket,
                            index
                        ) {

                            return (
                                `> **${index + 1}.** \`${ticket}\``
                            );
                        }
                    )
                    .join("\n"),

                "",

                `> \`📊\` **${tickets.length}/${MAX_TICKETS_PER_USER} vé**`
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
    // 🧹 CLEAN CHANNEL
    // ======================================

    await cleanLotteryChannel(
        interaction.channel
    );

    // ======================================
    // 📍 CHANNEL
    // ======================================

    lottery.channelId =
        interaction.channel.id;

    lottery.messageId =
        null;

    lottery.nextDrawAt =
        Date.now() +
        ROUND_DURATION;

    // ======================================
    // 🎟️ CREATE PANEL
    // ======================================

    const panel =
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
        panel.id;

    await saveLottery(
        data
    );

    startLotterySystem(
        interaction.client
    );

    // ======================================
    // 🧹 DELETE COMMAND
    // ======================================

    if (
        interaction.message &&
        interaction.message.deletable
    ) {

        try {

            await interaction.message.delete();

        } catch (
            error
        ) {
            // Ignore
        }
    }

    return null;
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
                    );

                if (
                    message.deletable
                ) {

                    await message.delete();
                }
            }

        } catch (
            error
        ) {

            console.log(
                "[Lottery Remove]",
                error.message
            );
        }
    }

    // ======================================
    // 🧹 DELETE COMMAND
    // ======================================

    if (
        interaction.message &&
        interaction.message.deletable
    ) {

        try {

            await interaction.message.delete();

        } catch (
            error
        ) {
            // Ignore
        }
    }

    return null;
}

// ==========================================
// 🔘 HANDLE INTERACTION
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
        interaction.customId ||
        "";

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
    // 📝 MODAL
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

            await interaction.reply({

                content:
                    "❌ Vui lòng nhập đúng 5 chữ số.",

                flags:
                    MessageFlags.Ephemeral
            });

            return true;
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
// 📦 EXPORT
// ==========================================

module.exports = {

    name:
        "lottery",

    aliases: [
        "vé số",
        "veso"
    ],

    description:
        "Vé số Venti",

    // ======================================
    // 💬 COMMAND
    // ======================================

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
                    async function (
                        options
                    ) {

                        if (
                            options &&
                            typeof options ===
                                "object"
                        ) {

                            return message.reply(
                                options
                            );
                        }

                        return message.reply(
                            options
                        );
                    }
            };

            return setupLottery(
                fakeInteraction
            );
        }

        // ==================================
        // ❌ HUY SETUP
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
                    async function (
                        options
                    ) {

                        return message.reply(
                            options
                        );
                    }
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
                tickets.length ===
                0
            ) {

                return message.reply(
                    `🎟️ Bạn chưa có vé trong kỳ #${String(
                        lottery.round
                    ).padStart(
                        3,
                        "0"
                    )}.`
                );
            }

            return message.reply({

                embeds: [

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
                                "**🎟️ VÉ SỐ CỦA BẠN**",

                                "",

                                `> \`🎫\` **Kỳ #${String(
                                    lottery.round
                                ).padStart(
                                    3,
                                    "0"
                                )}`,

                                "",

                                tickets
                                    .map(
                                        function (
                                            ticket,
                                            index
                                        ) {

                                            return (
                                                `> **${index + 1}.** \`${ticket}\``
                                            );
                                        }
                                    )
                                    .join("\n"),

                                "",

                                `> \`📊\` **${tickets.length}/${MAX_TICKETS_PER_USER} vé**`
                            ].join("\n")
                        )

                        .setFooter({
                            text:
                                "Venti • Lottery"
                        })

                        .setTimestamp()
                ]
            });
        }

        // ==================================
        // 🎟️ DEFAULT
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
