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
// 🔢 PAD TICKET
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
// ⏰ REMAINING TIME
// ==========================================
// Vẫn giữ để hệ thống biết lúc nào draw.
// Không hiển thị trong embed.

function getRemainingTime(
    lottery
) {

    const remaining =
        Math.max(
            0,
            Number(
                lottery.nextDrawAt ||
                0
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
            String(
                minutes
            ).padStart(
                2,
                "0"
            ) +
            ":" +
            String(
                seconds
            ).padStart(
                2,
                "0"
            )
    };
}

// ==========================================
// 🎟️ LOTTERY EMBED
// ==========================================

function createLotteryEmbed(
    lottery
) {

    const previous =
        lottery.previous;

    const previousText =
        previous
            ? [
                `> \`🎫\` **Kỳ #${String(
                    previous.round
                ).padStart(
                    3,
                    "0"
                )}**`,

                `> \`🔢\` **Số trúng:** ${previous.number}`,

                `> \`🏆\` **Người thắng:** ${
                    previous.winnerId
                        ? `<@${previous.winnerId}>`
                        : "Không có"
                }`,

                `> \`💰\` **Jackpot:** ${formatNumber(
                    previous.jackpot
                )} Mora`,

                `> \`⏰\` ${previous.drawTime}`
            ].join("\n")
            : "> Chưa có kỳ quay trước.";

    const embed =
        new EmbedBuilder()
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
                    "**🎟️ VÉ SỐ VENTI**",

                    "",

                    "> `🎫` **Kỳ quay hiện tại**",
                    `> **#${String(
                        lottery.round
                    ).padStart(
                        3,
                        "0"
                    )}**`,

                    "",

                    "> `💰` **Jackpot**",
                    `> **${formatNumber(
                        lottery.jackpot
                    )} Mora**`,

                    "",

                    "> `🪙` **Giá mỗi vé**",
                    `> **${formatNumber(
                        TICKET_PRICE
                    )} Mora**`,

                    "",

                    "> `🎟️` **Vé đã bán**",
                    `> **${getTicketCount(
                        lottery
                    )} vé**`,

                    "",

                    "> `👤` **Giới hạn mỗi người**",
                    `> **${MAX_TICKETS_PER_USER} vé**`,

                    "",

                    "> `🔢` **Kho số**",
                    "> **00000 → 99999**",

                    "",

                    "━━━━━━━━━━━━━━━━━━",

                    "",

                    "> `📜` **Kỳ trước**",
                    previousText,

                    "",

                    "🍃 *Chúc bạn may mắn, nhà lữ hành.*"
                ].join("\n")
            )
            .setFooter({
                text:
                    "Venti • Lottery • Kỳ quay mỗi 5 phút"
            })
            .setTimestamp();

    return embed;
}

// ==========================================
// 🔘 LOTTERY BUTTONS
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
// 🔄 UPDATE LOTTERY PANEL
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
    // 🎲 CHỌN NGƯỜI THẮNG
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

        if (winnerId) {

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
    // 📜 LƯU KỲ TRƯỚC
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
    // 🔄 RESET KỲ
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
    // 📢 GỬI KẾT QUẢ
    // ======================================

    if (
        client &&
        lottery.channelId
    ) {

        try {

            const channel =
                await client.channels.fetch(
                    lottery.channelId
                );

            if (
                channel &&
                channel.isTextBased()
            ) {

                let resultText;

                if (
                    winnerId &&
                    winningNumber
                ) {

                    resultText =
                        [
                            "🎉 **KỲ QUAY ĐÃ KẾT THÚC!**",

                            "",

                            `> \`🎫\` **Kỳ #${String(
                                oldRound
                            ).padStart(
                                3,
                                "0"
                            )}`,

                            `> \`🔢\` **Số trúng:** ${winningNumber}`,

                            `> \`🏆\` **Người thắng:** <@${winnerId}>`,

                            `> \`💰\` **Phần thưởng:** ${formatNumber(
                                oldJackpot
                            )} Mora`,

                            "",

                            "🍃 **Kỳ mới đã bắt đầu!**"
                        ].join("\n");

                } else {

                    resultText =
                        [
                            "🎉 **KỲ QUAY ĐÃ KẾT THÚC!**",

                            "",

                            `> \`🎫\` **Kỳ #${String(
                                oldRound
                            ).padStart(
                                3,
                                "0"
                            )}`,

                            "> `❌` Kỳ này không có người mua vé.",

                            "",

                            "🍃 **Kỳ mới đã bắt đầu!**"
                        ].join("\n");
                }

                await channel.send({
                    content:
                        resultText
                });
            }

        } catch (
            error
        ) {

            console.log(
                "[Lottery Draw]",
                error.message
            );
        }
    }

    await updateLotteryPanel(
        client
    );

    return true;
}

// ==========================================
// ▶️ START LOTTERY SYSTEM
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

    if (
        panelUpdateTimer
    ) {
        return;
    }

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
                "❌ Bạn đã có đủ " +
                MAX_TICKETS_PER_USER +
                " vé trong kỳ này.\n" +
                "🎟️ Vé của bạn: " +
                userTickets.join(
                    ", "
                ),

            flags:
                MessageFlags.Ephemeral
        });
    }

    let ticketNumber;

    // ======================================
    // 🔢 CUSTOM NUMBER
    // ======================================

    if (
        selectedNumber !==
            null &&
        selectedNumber !==
            undefined
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
                    "❌ Số vé phải từ 00000 đến 99999.",

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
                    "❌ Số vé " +
                    ticketNumber +
                    " đã có người mua.",

                flags:
                    MessageFlags.Ephemeral
            });
        }

    } else {

        // ==================================
        // 🎲 RANDOM NUMBER
        // ==================================

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
            user.balance ||
            0
        );

    if (
        balance <
        TICKET_PRICE
    ) {

        return interaction.reply({

            content:
                "❌ Bạn không đủ Mora.\n" +
                "Cần: " +
                formatNumber(
                    TICKET_PRICE
                ) +
                " Mora\n" +
                "Bạn có: " +
                formatNumber(
                    balance
                ) +
                " Mora",

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 💰 TRỪ TIỀN
    // ======================================

    user.balance =
        balance -
        TICKET_PRICE;

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

    await interaction.reply({

        content:
            "🎟️ **MUA VÉ THÀNH CÔNG!**\n\n" +

            "> `🔢` **Số vé:** " +
            ticketNumber +

            "\n" +

            "> `🪙` **Giá:** " +
            formatNumber(
                TICKET_PRICE
            ) +
            " Mora" +

            "\n" +

            "> `💰` **Jackpot:** " +
            formatNumber(
                lottery.jackpot
            ) +
            " Mora" +

            "\n" +

            "> `🎟️` **Vé của bạn:** " +
            getUserTickets(
                lottery,
                userId
            ).length +
            "/" +
            MAX_TICKETS_PER_USER,

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
                "🎟️ Bạn chưa có vé nào trong kỳ #" +
                String(
                    lottery.round
                ).padStart(
                    3,
                    "0"
                ) +
                ".",

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

                "> `🔢` **Số vé**",

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
// ⚙️ SETUP LOTTERY
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

    lottery.channelId =
        interaction.channel.id;

    lottery.nextDrawAt =
        Date.now() +
        ROUND_DURATION;

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

    return interaction.reply({

        content:
            "✅ Đã setup khu vé số tại " +
            interaction.channel +
            ".\n" +

            "🎟️ Kỳ #" +
            String(
                lottery.round
            ).padStart(
                3,
                "0"
            ) +
            " đã bắt đầu.\n" +

            "⏰ Kỳ sẽ kết thúc sau 5 phút.",

        flags:
            MessageFlags.Ephemeral
    });
}

// ==========================================
// ❌ REMOVE LOTTERY SETUP
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

        } catch (
            error
        ) {

            console.log(
                "[Lottery Remove]",
                error.message
            );
        }
    }

    return interaction.reply({

        content:
            "✅ Đã hủy setup khu vé số.\n" +
            "🎟️ Panel Lottery đã được gỡ.",

        flags:
            MessageFlags.Ephemeral
    });
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
// 📦 MODULE
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
                    "🎟️ Bạn chưa có vé trong kỳ #" +
                    String(
                        lottery.round
                    ).padStart(
                        3,
                        "0"
                    ) +
                    "."
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

                                `- \`🎫\` **Kỳ #${String(
                                    lottery.round
                                ).padStart(
                                    3,
                                    "0"
                                )}`,

                                "",

                                "- `🔢` **Số vé**",

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

                                `- \`📊\` **${tickets.length}/${MAX_TICKETS_PER_USER} vé**`
                            ].join("\n")
                        )
                        .setFooter({
                            text:
                                "Columbina • Lottery"
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

                new EmbedBuilder()
                    .setColor(
                        "#A8DCC0"
                    )
                    .setAuthor({
                        name:
                            "Columbina • Lottery"
                    })
                    .setDescription(
                        [
                            "**🎟️ LOTTERY**",

                            "",

                            `- \`🎫\` **Kỳ hiện tại:** #${String(
                                lottery.round
                            ).padStart(
                                3,
                                "0"
                            )}`,

                            `- \`💰\` **Jackpot:** ${formatNumber(
                                lottery.jackpot
                            )} Mora`,

                            `- \`🪙\` **Giá vé:** ${formatNumber(
                                TICKET_PRICE
                            )} Mora`,

                            `- \`🎟️\` **Đã bán:** ${getTicketCount(
                                lottery
                            )} vé`,

                            `> \`👤\` **Tối đa:** ${MAX_TICKETS_PER_USER} vé/người`,
                            "",
                            "- `📌` **Lệnh**",
                            "> `vlottery setup`",
                            "> `vlottery check`",
                            "> `vlottery huysetup`"
                        ].join("\n")
                    )
                    .setFooter({
                        text:
                            "Columbina • Lottery"
                    })
                    .setTimestamp()
            ]
        });
    },

    handleInteraction:
        handleLotteryInteraction,

    startLotterySystem:
        startLotterySystem
};
