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

// ==========================================
// 🎰 LOTTERY CONFIG
// ==========================================

const TICKET_PRICE = 1000;

const BASE_JACKPOT = 10000;

const MIN_NUMBER = 0;

const MAX_NUMBER = 99999;

// ==========================================
// 🔧 FORMAT NUMBER
// ==========================================

function formatNumber(number) {
    return Number(number || 0)
        .toLocaleString("en-US");
}

// ==========================================
// 🎫 PAD TICKET
// ==========================================

function padTicket(number) {
    return String(number)
        .padStart(5, "0");
}

// ==========================================
// 🎰 GET LOTTERY
// ==========================================

function getLottery(data) {

    if (
        !data.lottery ||
        typeof data.lottery !== "object"
    ) {

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
                null,

            previous:
                null
        };
    }

    // ======================================
    // 💰 JACKPOT
    // ======================================

    if (
        typeof data.lottery.jackpot !== "number" ||
        data.lottery.jackpot < BASE_JACKPOT
    ) {

        data.lottery.jackpot =
            BASE_JACKPOT;
    }

    // ======================================
    // 🔢 ROUND
    // ======================================

    if (
        !Number.isInteger(
            data.lottery.round
        ) ||
        data.lottery.round < 1
    ) {

        data.lottery.round =
            1;
    }

    // ======================================
    // 🎫 TICKETS
    // ======================================

    if (
        !data.lottery.tickets ||
        typeof data.lottery.tickets !== "object"
    ) {

        data.lottery.tickets =
            {};
    }

    // ======================================
    // 📍 CHANNEL
    // ======================================

    if (
        !("channelId" in data.lottery)
    ) {

        data.lottery.channelId =
            null;
    }

    // ======================================
    // 📨 MESSAGE
    // ======================================

    if (
        !("messageId" in data.lottery)
    ) {

        data.lottery.messageId =
            null;
    }

    // ======================================
    // ⏰ NEXT DRAW
    // ======================================

    if (
        !("nextDrawAt" in data.lottery)
    ) {

        data.lottery.nextDrawAt =
            null;
    }

    // ======================================
    // 📜 PREVIOUS
    // ======================================

    if (
        !("previous" in data.lottery)
    ) {

        data.lottery.previous =
            null;
    }

    return data.lottery;
}

// ==========================================
// 👤 GET USER FROM SAME DATABASE
// ==========================================

function getLotteryUser(
    data,
    userId
) {

    if (
        !data[userId]
    ) {

        db.createUser(
            userId
        );

        // createUser() load/save riêng
        // nên phải load lại database
        const freshData =
            db.load();

        return {
            data: freshData,
            user: freshData[userId]
        };
    }

    return {
        data,
        user: data[userId]
    };
}

// ==========================================
// 🎫 GET USER TICKET
// ==========================================

function getUserTicket(
    lottery,
    userId
) {

    for (
        const [number, ownerId]
        of Object.entries(
            lottery.tickets
        )
    ) {

        if (
            String(ownerId) ===
            String(userId)
        ) {

            return number;
        }
    }

    return null;
}

// ==========================================
// 🔍 CHECK NUMBER TAKEN
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

    const sold =
        Object.keys(
            lottery.tickets
        ).length;

    if (
        sold >= total
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
// 🎨 LOTTERY EMBED
// ==========================================

function createLotteryEmbed(
    lottery
) {

    const previous =
        lottery.previous;

    let previousText =
        "> 📜 **Kỳ trước**\n";

    if (!previous) {

        previousText +=
            "> Chưa có kỳ quay trước.";

    } else {

        const winner =
            previous.winnerId
                ? `<@${previous.winnerId}>`
                : "Không có người thắng";

        previousText +=
            `> 🎫 Kỳ \`#${String(
                previous.round
            ).padStart(3, "0")}\`\n` +

            `> 🔢 Số trúng: \`${previous.number}\`\n` +

            `> 🏆 Người thắng: ${winner}\n` +

            `> 💰 Jackpot: \`${formatNumber(
                previous.jackpot
            )} Mora\`\n` +

            `> ⏰ ${previous.drawTime}`;
    }

    const sold =
        Object.keys(
            lottery.tickets
        ).length;

    return new EmbedBuilder()

        .setColor(
            "#A8DCC0"
        )

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

                `> \`${formatNumber(
                    sold
                )}\``,

                ``,

                previousText,

                ``,

                `୨୧ ─────────────── ୨୧`,

                ``,

                `● Số vé: \`00000\` → \`99999\``,

                `● Mỗi người chỉ được \`1 vé\``,

                `● Không thể mua trùng số`,

                `● Vé được tính chung trên **toàn hệ thống**`,

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
// 🔘 LOTTERY BUTTONS
// ==========================================

function createLotteryButtons() {

    const row =
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
            );

    return [
        row
    ];
}

// ==========================================
// 🔄 UPDATE PANEL
// ==========================================

async function updateLotteryPanel(
    client
) {

    try {

        const data =
            db.load();

        const lottery =
            getLottery(data);

        if (
            !lottery.channelId ||
            !lottery.messageId
        ) {

            console.log(
                "[Lottery] Panel chưa được setup."
            );

            return false;
        }

        const channel =
            await client.channels.fetch(
                lottery.channelId
            );

        if (
            !channel ||
            !channel.isTextBased()
        ) {

            console.log(
                "[Lottery] Channel không hợp lệ."
            );

            return false;
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

        return true;

    } catch (error) {

        console.error(
            "[Lottery Panel Error]",
            error
        );

        return false;
    }
}

// ==========================================
// 🎟️ BUY TICKET
// ==========================================

async function buyTicket(
    interaction,
    selectedNumber = null
) {

    try {

        // ======================================
        // 📦 LOAD DATA
        // ======================================

        const data =
            db.load();

        const lottery =
            getLottery(data);

        // ======================================
        // 👤 GET USER
        // ======================================

        const userResult =
            getLotteryUser(
                data,
                interaction.user.id
            );

        const currentData =
            userResult.data;

        const user =
            userResult.user;

        // ======================================
        // 🎫 CHECK EXISTING TICKET
        // ======================================

        const existingTicket =
            getUserTicket(
                lottery,
                interaction.user.id
            );

        if (
            existingTicket
        ) {

            return interaction.reply({

                content:

                    `🎟️ Bạn đã có vé \`${existingTicket}\` trong kỳ này.\n` +

                    `> Mỗi người chỉ được **1 vé**.`,

                flags:
                    MessageFlags.Ephemeral
            });
        }

        // ======================================
        // 🔢 DETERMINE NUMBER
        // ======================================

        let ticketNumber;

        if (
            selectedNumber !== null
        ) {

            if (
                !Number.isInteger(
                    selectedNumber
                )
            ) {

                return interaction.reply({

                    content:
                        "❌ Số vé không hợp lệ.",

                    flags:
                        MessageFlags.Ephemeral
                });
            }

            if (
                selectedNumber <
                    MIN_NUMBER ||
                selectedNumber >
                    MAX_NUMBER
            ) {

                return interaction.reply({

                    content:
                        "❌ Số vé phải nằm trong khoảng `00000` → `99999`.",

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
                        "❌ Kỳ này đã hết số vé.",

                    flags:
                        MessageFlags.Ephemeral
                });
            }
        }

        // ======================================
        // 💰 BALANCE
        // ======================================

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

                    `❌ Bạn không đủ Mora.\n\n` +

                    `> 🪙 Cần: \`${formatNumber(
                        TICKET_PRICE
                    )} Mora\`\n` +

                    `> 💰 Có: \`${formatNumber(
                        balance
                    )} Mora\``,

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
        // 🎫 SAVE TICKET
        // ======================================

        lottery.tickets[
            ticketNumber
        ] =
            interaction.user.id;

        // ======================================
        // 💰 ADD JACKPOT
        // ======================================

        lottery.jackpot =
            Number(
                lottery.jackpot || 0
            ) +
            TICKET_PRICE;

        // ======================================
        // 💾 SAVE SAME DATABASE
        // ======================================

        currentData.lottery =
            lottery;

        currentData[
            interaction.user.id
        ] =
            user;

        db.save(
            currentData
        );

        // ======================================
        // ✅ SUCCESS
        // ======================================

        await interaction.reply({

            content:

                `🎟️ **Mua vé thành công!**\n\n` +

                `> 🔢 Số vé: \`${ticketNumber}\`\n` +

                `> 🪙 Giá: \`${formatNumber(
                    TICKET_PRICE
                )} Mora\`\n` +

                `> 💰 Jackpot: \`${formatNumber(
                    lottery.jackpot
                )} Mora\`\n\n` +

                `🍃 Chúc bạn may mắn!`,

            flags:
                MessageFlags.Ephemeral
        });

        // ======================================
        // 🔄 UPDATE PANEL
        // ======================================

        await updateLotteryPanel(
            interaction.client
        );

        return true;

    } catch (error) {

        console.error(
            "[Lottery Buy Error]",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            return interaction.followUp({

                content:
                    "❌ Có lỗi xảy ra khi mua vé.",

                flags:
                    MessageFlags.Ephemeral
            }).catch(() => {});

        }

        return interaction.reply({

            content:
                "❌ Có lỗi xảy ra khi mua vé.",

            flags:
                MessageFlags.Ephemeral
        }).catch(() => {});

    }
}

// ==========================================
// 🔢 OPEN CUSTOM MODAL
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

    return interaction.showModal(
        modal
    );
}

// ==========================================
// ⚙️ SETUP LOTTERY
// ==========================================

async function setupLottery(
    message
) {

    try {

        // ======================================
        // 🔐 ADMIN
        // ======================================

        if (
            !message.member ||
            !message.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return message.reply({

                content:
                    "❌ Chỉ Admin mới có thể setup khu vé số."
            });
        }

        // ======================================
        // 📦 LOAD DATABASE
        // ======================================

        const data =
            db.load();

        const lottery =
            getLottery(data);

        // ======================================
        // 📍 CHANNEL ID
        // ======================================

        lottery.channelId =
            message.channel.id;

        // ======================================
        // 🎨 CREATE PANEL
        // ======================================

        const embed =
            createLotteryEmbed(
                lottery
            );

        const components =
            createLotteryButtons();

        // ======================================
        // 📤 SEND MESSAGE
        // ======================================

        const lotteryMessage =
            await message.channel.send({

                embeds: [
                    embed
                ],

                components
            });

        // ======================================
        // 📨 MESSAGE ID
        // ======================================

        lottery.messageId =
            lotteryMessage.id;

        // ======================================
        // 💾 SAVE
        // ======================================

        data.lottery =
            lottery;

        db.save(
            data
        );

        // ======================================
        // ✅ RESPONSE
        // ======================================

        return message.reply({

            content:

                `✅ **Setup Lottery thành công!**\n\n` +

                `🎰 Channel: ${message.channel}\n` +

                `📌 Channel ID: \`${message.channel.id}\`\n` +

                `🎟️ Panel ID: \`${lotteryMessage.id}\`\n\n` +

                `🍃 Lottery đã sẵn sàng!`
        });

    } catch (error) {

        console.error(
            "[Lottery Setup Error]",
            error
        );

        return message.reply({

            content:

                `❌ **Không thể setup Lottery.**\n\n` +

                `\`${error.message}\``
        });
    }
}

// ==========================================
// 🎯 HANDLE INTERACTION
// ==========================================

async function handleLotteryInteraction(
    interaction
) {

    try {

        // ======================================
        // 🔘 BUTTON
        // ======================================

        if (
            interaction.isButton()
        ) {

            const id =
                interaction.customId || "";

            if (
                !id.startsWith(
                    "lottery_"
                )
            ) {

                return false;
            }

            // ==================================
            // 🎲 RANDOM
            // ==================================

            if (
                id ===
                "lottery_random"
            ) {

                await buyTicket(
                    interaction
                );

                return true;
            }

            // ==================================
            // 🔢 CUSTOM
            // ==================================

            if (
                id ===
                "lottery_custom"
            ) {

                await openCustomModal(
                    interaction
                );

                return true;
            }

            // ==================================
            // 🔄 REFRESH
            // ==================================

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
        // 🪟 MODAL
        // ======================================

        if (
            interaction.isModalSubmit()
        ) {

            const id =
                interaction.customId || "";

            if (
                id !==
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

            // ==================================
            // 🔢 VALIDATE
            // ==================================

            if (
                !/^\d{5}$/.test(
                    raw
                )
            ) {

                await interaction.reply({

                    content:
                        "❌ Vui lòng nhập đúng 5 chữ số, ví dụ `01234`.",

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

    } catch (error) {

        console.error(
            "[Lottery Interaction Error]",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            await interaction.followUp({

                content:
                    "❌ Có lỗi xảy ra khi xử lý Lottery.",

                flags:
                    MessageFlags.Ephemeral

            }).catch(() => {});

        } else {

            await interaction.reply({

                content:
                    "❌ Có lỗi xảy ra khi xử lý Lottery.",

                flags:
                    MessageFlags.Ephemeral

            }).catch(() => {});
        }

        return true;
    }
}

// ==========================================
// 🎰 COMMAND EXECUTE
// ==========================================

async function execute(
    message,
    args = []
) {

    const subcommand =
        String(
            args[0] || ""
        ).toLowerCase();

    // ======================================
    // ⚙️ SETUP
    // ======================================

    if (
        subcommand ===
        "setup"
    ) {

        return setupLottery(
            message
        );
    }

    // ======================================
    // 🎟️ DEFAULT
    // ======================================

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

                        `> 🎫 Kỳ hiện tại: **#${String(
                            lottery.round
                        ).padStart(3, "0")}**`,

                        `> 💰 Jackpot: **${formatNumber(
                            lottery.jackpot
                        )} Mora**`,

                        `> 🪙 Giá vé: **${formatNumber(
                            TICKET_PRICE
                        )} Mora**`,

                        ``,

                        `● Mỗi người chỉ được 1 vé`,

                        `● Số từ \`00000\` → \`99999\``,

                        `● Không thể mua trùng số`,

                        `● Vé được tính trên toàn hệ thống`,

                        ``,

                        `> 🍃 Hãy vào khu vé số để tham gia!`

                    ].join("\n")
                )
        ]
    });
}

// ==========================================
// 📤 EXPORT
// ==========================================

module.exports = {

    name:
        "lottery",

    aliases: [
        "vé số"
    ],

    description:
        "Khu vé số global của Venti",

    execute,

    handleInteraction:
        handleLotteryInteraction,

    setupLottery,

    updateLotteryPanel,

    createLotteryEmbed,

    createLotteryButtons
};

