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

const TICKET_PRICE = 1000;
const BASE_JACKPOT = 10000;
const MIN_NUMBER = 0;
const MAX_NUMBER = 99999;

function formatNumber(number) {
    return Number(number).toLocaleString("en-US");
}

function padTicket(number) {
    return String(number).padStart(5, "0");
}

function getLottery(data) {
    if (!data.lottery) {
        data.lottery = {
            jackpot: BASE_JACKPOT,
            round: 1,
            tickets: {},
            channelId: null,
            messageId: null,
            nextDrawAt: null,
            previous: null
        };
    }

    if (!data.lottery.jackpot) {
        data.lottery.jackpot = BASE_JACKPOT;
    }

    if (!data.lottery.round) {
        data.lottery.round = 1;
    }

    if (!data.lottery.tickets) {
        data.lottery.tickets = {};
    }

    return data.lottery;
}

function getUserTicket(lottery, userId) {
    for (const [number, ownerId] of Object.entries(lottery.tickets)) {
        if (ownerId === userId) {
            return number;
        }
    }

    return null;
}

function isNumberTaken(lottery, number) {
    return Boolean(lottery.tickets[number]);
}

function getRandomTicket(lottery) {
    const total = MAX_NUMBER - MIN_NUMBER + 1;

    if (Object.keys(lottery.tickets).length >= total) {
        return null;
    }

    let number;

    do {
        number = Math.floor(
            Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)
        );
    } while (isNumberTaken(lottery, number));

    return padTicket(number);
}

function createLotteryEmbed(lottery) {
    const previous = lottery.previous;

    let previousText = "> 📜 `Kỳ trước`\n";

    if (!previous) {
        previousText += "> Chưa có kỳ quay trước.";
    } else {
        previousText +=
            `> 🎫 Kỳ \`#${String(previous.round).padStart(3, "0")}\`\n` +
            `> 🔢 Số trúng: \`${previous.number}\`\n` +
            `> 🏆 Người thắng: <@${previous.winnerId}>\n` +
            `> 💰 Jackpot: \`${formatNumber(previous.jackpot)} Mora\`\n` +
            `> ⏰ ${previous.drawTime}`;
    }

    const embed = new EmbedBuilder()
        .setTitle("୨୧ 🎟️ VÉ SỐ VENTI ୨୧")
        .setDescription(
            [
                `> 🎫 **Kỳ quay hiện tại**`,
                `> \`#${String(lottery.round).padStart(3, "0")}\``,
                ``,
                `> 💰 **Jackpot**`,
                `> \`${formatNumber(lottery.jackpot)} Mora\``,
                ``,
                `> 🪙 **Giá vé**`,
                `> \`${formatNumber(TICKET_PRICE)} Mora\``,
                ``,
                `> 🎟️ **Vé đã bán**`,
                `> \`${Object.keys(lottery.tickets).length}\``,
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
            text: "Venti Lottery • Global Lottery"
        })
        .setTimestamp();

    return embed;
}

function createLotteryButtons() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("lottery_random")
                .setLabel("Mua vé ngẫu nhiên")
                .setEmoji("🎲")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("lottery_custom")
                .setLabel("Chọn số")
                .setEmoji("🔢")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("lottery_refresh")
                .setLabel("Làm mới")
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Secondary)
        )
    ];
}

async function updateLotteryPanel(client) {
    const data = db.load();
    const lottery = getLottery(data);

    if (!lottery.channelId || !lottery.messageId) {
        return;
    }

    try {
        const channel = await client.channels.fetch(lottery.channelId);

        if (!channel || !channel.isTextBased()) {
            return;
        }

        const message = await channel.messages.fetch(lottery.messageId);

        await message.edit({
            embeds: [createLotteryEmbed(lottery)],
            components: createLotteryButtons()
        });
    } catch (error) {
        console.log("Lottery panel update failed:", error.message);
    }
}

async function saveLottery(data) {
    db.save(data);
}

async function buyTicket(interaction, selectedNumber = null) {
    const data = db.load();
    const lottery = getLottery(data);

    const existingTicket = getUserTicket(
        lottery,
        interaction.user.id
    );

    if (existingTicket) {
        return interaction.reply({
            content:
                `🎟️ Bạn đã có vé \`${existingTicket}\` trong kỳ này.\n` +
                `> Mỗi người chỉ được mua **1 vé**.`,
            flags: MessageFlags.Ephemeral
        });
    }

    let ticketNumber;

    if (selectedNumber !== null) {
        ticketNumber = padTicket(selectedNumber);

        if (
            selectedNumber < MIN_NUMBER ||
            selectedNumber > MAX_NUMBER
        ) {
            return interaction.reply({
                content:
                    "❌ Số vé phải nằm trong khoảng `00000` → `99999`.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (isNumberTaken(lottery, ticketNumber)) {
            return interaction.reply({
                content:
                    `❌ Số vé \`${ticketNumber}\` đã có người mua.`,
                flags: MessageFlags.Ephemeral
            });
        }
    } else {
        ticketNumber = getRandomTicket(lottery);

        if (!ticketNumber) {
            return interaction.reply({
                content: "❌ Kỳ này đã hết số vé.",
                flags: MessageFlags.Ephemeral
            });
        }
    }

    const user = await User.getOrCreate(interaction.user.id);

    const balance = Number(user.balance || 0);

    if (balance < TICKET_PRICE) {
        return interaction.reply({
            content:
                `❌ Bạn không đủ Mora.\n` +
                `> Cần: \`${formatNumber(TICKET_PRICE)} Mora\`\n` +
                `> Có: \`${formatNumber(balance)} Mora\``,
            flags: MessageFlags.Ephemeral
        });
    }

    user.balance = balance - TICKET_PRICE;

    lottery.tickets[ticketNumber] = interaction.user.id;
    lottery.jackpot += TICKET_PRICE;

    await saveLottery(data);

    await interaction.reply({
        content:
            `🎟️ **Mua vé thành công!**\n\n` +
            `> 🔢 Số vé: \`${ticketNumber}\`\n` +
            `> 🪙 Giá: \`${formatNumber(TICKET_PRICE)} Mora\`\n` +
            `> 💰 Jackpot: \`${formatNumber(lottery.jackpot)} Mora\`\n\n` +
            `🍃 Chúc bạn may mắn!`,
        flags: MessageFlags.Ephemeral
    });

    await updateLotteryPanel(interaction.client);
}

async function openCustomModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("lottery_custom_modal")
        .setTitle("🔢 Chọn số vé");

    const input = new TextInputBuilder()
        .setCustomId("lottery_number")
        .setLabel("Nhập số từ 00000 đến 99999")
        .setPlaceholder("Ví dụ: 01234")
        .setStyle(TextInputStyle.Short)
        .setMinLength(5)
        .setMaxLength(5)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    await interaction.showModal(modal);
}

async function setupLottery(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: "❌ Chỉ Admin mới có thể setup khu vé số.",
            flags: MessageFlags.Ephemeral
        });
    }

    const data = db.load();
    const lottery = getLottery(data);

    lottery.channelId = interaction.channel.id;

    const embed = createLotteryEmbed(lottery);
    const buttons = createLotteryButtons();

    const message = await interaction.channel.send({
        embeds: [embed],
        components: buttons
    });

    lottery.messageId = message.id;

    await saveLottery(data);

    await interaction.reply({
        content:
            `✅ Đã setup khu vé số tại ${interaction.channel}.\n` +
            `🎟️ Panel Lottery đã được tạo.`,
        flags: MessageFlags.Ephemeral
    });
}

async function handleLotteryInteraction(interaction) {
    if (!interaction.isButton() && !interaction.isModalSubmit()) {
        return false;
    }

    if (
        interaction.isButton() &&
        !interaction.customId.startsWith("lottery_")
    ) {
        return false;
    }

    if (
        interaction.isModalSubmit() &&
        !interaction.customId.startsWith("lottery_")
    ) {
        return false;
    }

    if (interaction.isButton()) {
        if (interaction.customId === "lottery_random") {
            await buyTicket(interaction);
            return true;
        }

        if (interaction.customId === "lottery_custom") {
            await openCustomModal(interaction);
            return true;
        }

        if (interaction.customId === "lottery_refresh") {
            const data = db.load();
            const lottery = getLottery(data);

            await interaction.update({
                embeds: [createLotteryEmbed(lottery)],
                components: createLotteryButtons()
            });

            return true;
        }
    }

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "lottery_custom_modal"
    ) {
        const raw = interaction.fields
            .getTextInputValue("lottery_number")
            .trim();

        if (!/^\d{5}$/.test(raw)) {
            await interaction.reply({
                content:
                    "❌ Vui lòng nhập đúng **5 chữ số**, ví dụ `01234`.",
                flags: MessageFlags.Ephemeral
            });

            return true;
        }

        const number = Number(raw);

        await buyTicket(interaction, number);

        return true;
    }

    return false;
}

module.exports = {
    name: "lottery",
    aliases: ["vé số"],
    description: "Khu vé số global của Venti",

    async execute(message, args) {
        const subcommand = args[0]?.toLowerCase();

        if (subcommand === "setup") {
            const fakeInteraction = {
                member: message.member,
                channel: message.channel,
                client: message.client,
                reply: async options => message.reply(options),
                user: message.author
            };

            return setupLottery(fakeInteraction);
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🎟️ Vé số Venti")
                    .setDescription(
                        [
                            `> 💰 Jackpot: **Global**`,
                            `> 🪙 Giá vé: \`${formatNumber(TICKET_PRICE)} Mora\``,
                            ``,
                            `● Mỗi người chỉ được 1 vé`,
                            `● Số từ \`00000\` → \`99999\``,
                            `● Vé được tính trên toàn hệ thống`,
                            ``,
                            `> 🍃 Hãy vào khu vé số để tham gia!`
                        ].join("\n")
                    )
            ]
        });
    },

    handleInteraction: handleLotteryInteraction
};