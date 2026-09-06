
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

const db = require("../../database/database");
const User = require("../../database/models/User");

// ==========================================
// 🎟️ CONFIG
// ==========================================

const TICKET_PRICE = 1000;
const BASE_JACKPOT = 10000;

const MIN_NUMBER = 0;
const MAX_NUMBER = 99999;

// ==========================================
// 🔢 FORMAT
// ==========================================

function formatNumber(number) {
    return Number(number || 0).toLocaleString("en-US");
}

function padTicket(number) {
    return String(number).padStart(5, "0");
}

// ==========================================
// 🎟️ GET LOTTERY
// ==========================================

function getLottery(data) {
    if (!data.lottery) {
        data.lottery = {
            jackpot: BASE_JACKPOT,
            round: 1,
            tickets: {},
            channelId: null,
            messageId: null,
            previous: null
        };
    }

    if (
        typeof data.lottery.jackpot !== "number" ||
        data.lottery.jackpot < BASE_JACKPOT
    ) {
        data.lottery.jackpot = BASE_JACKPOT;
    }

    if (
        typeof data.lottery.round !== "number" ||
        data.lottery.round < 1
    ) {
        data.lottery.round = 1;
    }

    if (
        !data.lottery.tickets ||
        typeof data.lottery.tickets !== "object"
    ) {
        data.lottery.tickets = {};
    }

    return data.lottery;
}

// ==========================================
// 👤 USER TICKET
// ==========================================

function getUserTicket(lottery, userId) {
    for (const [number, ownerId] of Object.entries(lottery.tickets)) {
        if (ownerId === userId) {
            return number;
        }
    }

    return null;
}

// ==========================================
// 🔍 NUMBER TAKEN
// ==========================================

function isNumberTaken(lottery, number) {
    return Boolean(lottery.tickets[number]);
}

// ==========================================
// 🎲 RANDOM TICKET
// ==========================================

function getRandomTicket(lottery) {
    const total =
        MAX_NUMBER - MIN_NUMBER + 1;

    if (
        Object.keys(lottery.tickets).length >=
        total
    ) {
        return null;
    }

    let number;

    do {
        number = Math.floor(
            Math.random() *
            total
        );
    } while (
        isNumberTaken(
            lottery,
            number
        )
    );

    return padTicket(number);
}

// ==========================================
// 🖼️ EMBED
// ==========================================

function createLotteryEmbed(lottery) {

    const ticketCount =
        Object.keys(
            lottery.tickets
        ).length;

    let previousText =
        "> 📜 **Kỳ trước**\n";

    if (!lottery.previous) {

        previousText +=
            "> Chưa có kỳ quay trước.";

    } else {

        previousText +=
            `> 🎫 Kỳ \`#${String(
                lottery.previous.round
            ).padStart(3, "0")}\`\n` +

            `> 🔢 Số trúng: \`${lottery.previous.number}\`\n` +

            `> 🏆 Người thắng: <@${lottery.previous.winnerId}>\n` +

            `> 💰 Jackpot: \`${formatNumber(
                lottery.previous.jackpot
            )} Mora\``;
    }

    return new EmbedBuilder()

        .setColor("#A8DCC0")

        .setTitle(
            "୨୧ 🎟️ VÉ SỐ VENTI ୨୧"
        )

        .setDescription(
            [
                `> 🎫 **Kỳ quay hiện tại**`,
                `> \`#${String(
                    lottery.round
                ).padStart(3, "0")}\``,

                ``,

                `> 💰 **Jackpot**`,
                `> \`${formatNumber(
                    lottery.jackpot
                )} Mora\``,

                ``,

                `> 🪙 **Giá vé**`,
                `> \`${formatNumber(
                    TICKET_PRICE
                )} Mora\``,

                ``,

                `> 🎟️ **Vé đã bán**`,
                `> \`${ticketCount}\``,

                ``,

                previousText,

                ``,

                `୨୧ ─────────────── ୨୧`,

                ``,

                `● Số vé: \`00000\` → \`99999\``,
                `● Mỗi người chỉ được **1 vé**`,
                `● Không thể mua trùng số`,
                `● Vé được tính chung toàn hệ thống`,

                ``,

                `> 🍃 *Chúc bạn may mắn, nhà lữ hành.*`
            ].join("\n")
        )

        .setFooter({
            text:
                "Venti Lottery • Global Lottery"
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
                        "lottery_refresh"
                    )
                    .setLabel(
                        "Làm mới"
                    )
                    .setEmoji("🔄")
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            )
    ];
}

// ==========================================
// 🔄 UPDATE PANEL
// ==========================================

async function updateLotteryPanel(client) {

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

        console.error(
            "[Lottery] Update panel error:",
            error
        );
    }
}

// ==========================================
// 🎟️ BUY TICKET
// ==========================================

async function buyTicket(
    interaction,
    selectedNumber = null
) {

    const data =
        db.load();

    const lottery =
        getLottery(data);

    // ======================================
    // 👤 CHECK EXISTING
    // ======================================

    const existingTicket =
        getUserTicket(
            lottery,
            interaction.user.id
        );

    if (existingTicket) {

        return interaction.reply({

            content:
                `🎟️ Bạn đã có vé \`${existingTicket}\` trong kỳ này.\n` +
                `> Mỗi người chỉ được mua **1 vé**.`,

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 🔢 TICKET NUMBER
    // ======================================

    let ticketNumber;

    if (
        selectedNumber !== null
    ) {

        if (
            !Number.isInteger(
                selectedNumber
            ) ||
            selectedNumber < MIN_NUMBER ||
            selectedNumber > MAX_NUMBER
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
                    `❌ Số \`${ticketNumber}\` đã có người mua.`,

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
                    "❌ Tất cả số vé đã được bán.",

                flags:
                    MessageFlags.Ephemeral
            });
        }
    }

    // ======================================
    // 💰 USER
    // ======================================

    const user =
        User.getOrCreate(
            interaction.user.id
        );

    const balance =
        Number(
            user.balance || 0
        );

    if (
        balance < TICKET_PRICE
    ) {

        return interaction.reply({

            content:
                `❌ Bạn không đủ Mora.\n\n` +
                `> Cần: **${formatNumber(
                    TICKET_PRICE
                )} Mora**\n` +

                `> Có: **${formatNumber(
                    balance
                )} Mora**`,

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
        interaction.user.id;

    lottery.jackpot =
        Number(
            lottery.jackpot || BASE_JACKPOT
        ) +
        TICKET_PRICE;

    // ======================================
    // 💾 SAVE
    // ======================================

    db.save(data);

    // ======================================
    // ✅ RESPONSE
    // ======================================

    await interaction.reply({

        content:
            `🎟️ **Mua vé thành công!**\n\n` +

            `> 🔢 Số vé: \`${ticketNumber}\`\n` +

            `> 🪙 Giá vé: \`${formatNumber(
                TICKET_PRICE
            )} Mora\`\n` +

            `> 💰 Jackpot: \`${formatNumber(
                lottery.jackpot
            )} Mora\`\n\n` +

            `🍃 Chúc bạn may mắn!`,

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
            .setMinLength(5)
            .setMaxLength(5)
            .setRequired(true);

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
// 🛠️ SETUP
// ==========================================

async function setupLottery(
    interaction
) {

    // ======================================
    // 🔐 ADMIN
    // ======================================

    if (
        !interaction.member ||
        !interaction.member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {

        return interaction.reply({

            content:
                "❌ Chỉ Admin mới có thể setup Lottery.",

            flags:
                MessageFlags.Ephemeral
        });
    }

    // ======================================
    // 📦 DATABASE
    // ======================================

    const data =
        db.load();

    const lottery =
        getLottery(data);

    // ======================================
    // 📍 CHANNEL
    // ======================================

    lottery.channelId =
        interaction.channel.id;

    // ======================================
    // 📨 SEND PANEL
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

    // ======================================
    // 💾 SAVE MESSAGE
    // ======================================

    lottery.messageId =
        message.id;

    db.save(data);

    // ======================================
    // RESPONSE
    // ======================================

    return interaction.reply({

        content:
            `✅ Đã setup Lottery tại ${interaction.channel}.\n` +
            `🎟️ Panel: ${message.url}`,

        flags:
            MessageFlags.Ephemeral
    });
}

// ==========================================
// 🎯 INTERACTION
// ==========================================

async function handleLotteryInteraction(
    interaction
) {

    // ======================================
    // BUTTON
    // ======================================

    if (
        interaction.isButton()
    ) {

        const id =
            interaction.customId;

        if (
            !id.startsWith(
                "lottery_"
            )
        ) {
            return false;
        }

        if (
            id ===
            "lottery_random"
        ) {

            await buyTicket(
                interaction
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
    // MODAL
    // ======================================

    if (
        interaction.isModalSubmit()
    ) {

        if (
            interaction.customId !==
            "lottery_custom_modal"
        ) {
            return false;
        }

        const raw =
            interaction.fields
                .getTextInputValue(
                    "lottery_number"
                )
                .trim();

        if (
            !/^\d{5}$/.test(raw)
        ) {

            await interaction.reply({

                content:
                    "❌ Vui lòng nhập đúng 5 chữ số. Ví dụ: `01234`.",

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
// 📤 COMMAND EXPORT
// ==========================================

module.exports = {

    name: "lottery",

    aliases: [
        "loto",
        "veso"
    ],

    description:
        "Khu vé số Global của Venti",

    async execute(
        message,
        args = []
    ) {

        const subcommand =
            String(
                args[0] || ""
            ).toLowerCase();

        // ==================================
        // 🛠️ SETUP
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
                    options =>
                        message.reply(
                            options
                        )
            };

            return setupLottery(
                fakeInteraction
            );
        }

        // ==================================
        // 🎟️ INFO
        // ==================================

        const data =
            db.load();

        const lottery =
            getLottery(data);

        return message.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(
                        "#A8DCC0"
                    )

                    .setTitle(
                        "🎟️ Vé số Venti"
                    )

                    .setDescription(

                        [
                            `> 💰 Jackpot: **${formatNumber(
                                lottery.jackpot
                            )} Mora**`,

                            `> 🪙 Giá vé: **${formatNumber(
                                TICKET_PRICE
                            )} Mora**`,

                            ``,

                            `● Mỗi người chỉ được **1 vé**`,
                            `● Số từ \`00000\` → \`99999\``,
                            `● Không thể mua trùng số`,

                            ``,

                            `> 🍃 Hãy vào khu vé số để tham gia!`
                        ].join("\n")
                    )
            ]
        });
    },

    handleInteraction:
        handleLotteryInteraction
};
