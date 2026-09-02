
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const db = require("../../database/database");


// ═══════════════════════════════════════
// 🏦 VENTI BANK
// ═══════════════════════════════════════

const COLORS = {
    primary: "#9ccfd8",
    success: "#a8d8a8",
    warning: "#ffd166",
    error: "#f2a7a7"
};


// ═══════════════════════════════════════
// FORMAT MONEY
// ═══════════════════════════════════════

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}


// ═══════════════════════════════════════
// GET USER
// ═══════════════════════════════════════

function getUser(userId) {
    return db.getOrCreate(userId);
}


// ═══════════════════════════════════════
// BANK EMBED
// ═══════════════════════════════════════

function bankEmbed(userId) {

    const user =
        getUser(userId);

    const balance =
        Number(user.balance || 0);

    const bank =
        Number(user.bank || 0);

    const total =
        balance + bank;

    return new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle("🏦 Venti Bank")
        .setDescription(
            [
                "╭─────────────────────╮",
                "       🏦 **NGÂN HÀNG VENTI**",
                "╰─────────────────────╯",
                "",
                `💰 **Tiền mặt**`,
                `> ${money(balance)} Mora`,
                "",
                `🏦 **Tiền trong ngân hàng**`,
                `> ${money(bank)} Mora`,
                "",
                `💎 **Tổng tài sản**`,
                `> ${money(total)} Mora`,
                "",
                "🌿 Chọn một chức năng bên dưới."
            ].join("\n")
        )
        .setFooter({
            text: "Venti Bank • An toàn • Nhanh chóng"
        })
        .setTimestamp();
}


// ═══════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════

function bankButtons(userId) {

    return [
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `bank_deposit_${userId}`
                    )
                    .setLabel("Gửi tiền")
                    .setEmoji("💰")
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `bank_withdraw_${userId}`
                    )
                    .setLabel("Rút tiền")
                    .setEmoji("💸")
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `bank_transfer_${userId}`
                    )
                    .setLabel("Chuyển tiền")
                    .setEmoji("🔄")
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            ),

        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `bank_refresh_${userId}`
                    )
                    .setLabel("Làm mới")
                    .setEmoji("🔃")
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `bank_close_${userId}`
                    )
                    .setLabel("Đóng")
                    .setEmoji("✖️")
                    .setStyle(
                        ButtonStyle.Danger
                    )
            )
    ];
}


// ═══════════════════════════════════════
// DEPOSIT MODAL
// ═══════════════════════════════════════

function depositModal(userId) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                `bank_modal_deposit_${userId}`
            )
            .setTitle(
                "💰 Gửi tiền vào ngân hàng"
            );

    const amount =
        new TextInputBuilder()
            .setCustomId(
                "amount"
            )
            .setLabel(
                "Nhập số tiền muốn gửi"
            )
            .setPlaceholder(
                "Ví dụ: 5000"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(15);

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(amount)
    );

    return modal;
}


// ═══════════════════════════════════════
// WITHDRAW MODAL
// ═══════════════════════════════════════

function withdrawModal(userId) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                `bank_modal_withdraw_${userId}`
            )
            .setTitle(
                "💸 Rút tiền khỏi ngân hàng"
            );

    const amount =
        new TextInputBuilder()
            .setCustomId(
                "amount"
            )
            .setLabel(
                "Nhập số tiền muốn rút"
            )
            .setPlaceholder(
                "Ví dụ: 5000"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(15);

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(amount)
    );

    return modal;
}


// ═══════════════════════════════════════
// TRANSFER MODAL
// ═══════════════════════════════════════

function transferModal(userId) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                `bank_modal_transfer_${userId}`
            )
            .setTitle(
                "🔄 Chuyển tiền"
            );

    const receiver =
        new TextInputBuilder()
            .setCustomId(
                "receiver"
            )
            .setLabel(
                "ID Discord người nhận"
            )
            .setPlaceholder(
                "Ví dụ: 123456789012345678"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(25);

    const amount =
        new TextInputBuilder()
            .setCustomId(
                "amount"
            )
            .setLabel(
                "Số tiền muốn chuyển"
            )
            .setPlaceholder(
                "Ví dụ: 10000"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(15);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(receiver),

        new ActionRowBuilder()
            .addComponents(amount)

    );

    return modal;
}


// ═══════════════════════════════════════
// PARSE MONEY
// ═══════════════════════════════════════

function parseMoney(value) {

    if (!value) {
        return NaN;
    }

    const clean =
        String(value)
            .replace(/[.,\s]/g, "");

    const amount =
        Number(clean);

    if (
        !Number.isSafeInteger(amount)
    ) {
        return NaN;
    }

    return amount;
}


// ═══════════════════════════════════════
// DEPOSIT
// ═══════════════════════════════════════

async function deposit(
    interaction,
    userId,
    amount
) {

    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        return interaction.reply({
            content:
                "❌ Số tiền không hợp lệ.",
            ephemeral: true
        });
    }

    const user =
        getUser(userId);

    const balance =
        Number(user.balance || 0);

    if (amount > balance) {
        return interaction.reply({
            content:
                `❌ Bạn chỉ có **${money(balance)} Mora** tiền mặt.`,
            ephemeral: true
        });
    }

    db.removeBalance(
        userId,
        amount
    );

    db.addBank(
        userId,
        amount
    );

    return interaction.update({
        embeds: [
            bankEmbed(userId)
        ],
        components:
            bankButtons(userId)
    });
}


// ═══════════════════════════════════════
// WITHDRAW
// ═══════════════════════════════════════

async function withdraw(
    interaction,
    userId,
    amount
) {

    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        return interaction.reply({
            content:
                "❌ Số tiền không hợp lệ.",
            ephemeral: true
        });
    }

    const user =
        getUser(userId);

    const bank =
        Number(user.bank || 0);

    if (amount > bank) {
        return interaction.reply({
            content:
                `❌ Ngân hàng chỉ có **${money(bank)} Mora**.`,
            ephemeral: true
        });
    }

    db.removeBank(
        userId,
        amount
    );

    db.addBalance(
        userId,
        amount
    );

    return interaction.update({
        embeds: [
            bankEmbed(userId)
        ],
        components:
            bankButtons(userId)
    });
}


// ═══════════════════════════════════════
// TRANSFER
// ═══════════════════════════════════════

async function transfer(
    interaction,
    userId,
    receiverId,
    amount
) {

    receiverId =
        String(receiverId || "")
            .trim();

    if (
        !receiverId ||
        !/^\d{5,25}$/.test(receiverId)
    ) {
        return interaction.reply({
            content:
                "❌ ID Discord người nhận không hợp lệ.",
            ephemeral: true
        });
    }

    if (
        receiverId === userId
    ) {
        return interaction.reply({
            content:
                "❌ Bạn không thể chuyển tiền cho chính mình.",
            ephemeral: true
        });
    }

    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        return interaction.reply({
            content:
                "❌ Số tiền không hợp lệ.",
            ephemeral: true
        });
    }

    const sender =
        getUser(userId);

    const bank =
        Number(sender.bank || 0);

    if (amount > bank) {
        return interaction.reply({
            content:
                `❌ Bạn chỉ có **${money(bank)} Mora** trong ngân hàng.`,
            ephemeral: true
        });
    }

    // Tạo người nhận nếu chưa có dữ liệu.
    getUser(receiverId);

    const success =
        db.transferBank(
            userId,
            receiverId,
            amount
        );

    if (!success) {
        return interaction.reply({
            content:
                "❌ Không thể thực hiện giao dịch.",
            ephemeral: true
        });
    }

    return interaction.update({
        embeds: [
            bankEmbed(userId)
        ],
        components:
            bankButtons(userId)
    });
}


// ═══════════════════════════════════════
// COMMAND
// ═══════════════════════════════════════

const command = {

    name: "bank",

    aliases: [
        "b",
        "vbank"
    ],

    description:
        "🏦 Quản lý tiền trong ngân hàng.",

    usage:
        "Vbank",

    category:
        "economy",

    async execute(message) {

        const userId =
            message.author.id;

        getUser(userId);

        return message.reply({
            embeds: [
                bankEmbed(userId)
            ],
            components:
                bankButtons(userId)
        });
    }
};


// ═══════════════════════════════════════
// INTERACTION HANDLER
// ═══════════════════════════════════════

async function handleInteraction(
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

    // ═══════════════════════════════
    // BUTTON
    // ═══════════════════════════════

    if (interaction.isButton()) {

        if (
            !id.startsWith("bank_")
        ) {
            return false;
        }

        const parts =
            id.split("_");

        const action =
            parts[1];

        const userId =
            parts[2];

        if (
            interaction.user.id !==
            userId
        ) {
            return interaction.reply({
                content:
                    "🏦 Đây không phải ngân hàng của bạn.",
                ephemeral: true
            });
        }

        if (
            action === "deposit"
        ) {
            return interaction.showModal(
                depositModal(userId)
            );
        }

        if (
            action === "withdraw"
        ) {
            return interaction.showModal(
                withdrawModal(userId)
            );
        }

        if (
            action === "transfer"
        ) {
            return interaction.showModal(
                transferModal(userId)
            );
        }

        if (
            action === "refresh"
        ) {
            return interaction.update({
                embeds: [
                    bankEmbed(userId)
                ],
                components:
                    bankButtons(userId)
            });
        }

        if (
            action === "close"
        ) {
            return interaction.update({
                content:
                    "🏦 Đã đóng Venti Bank.",
                embeds: [],
                components: []
            });
        }

        return false;
    }


    // ═══════════════════════════════
    // MODAL
    // ═══════════════════════════════

    if (interaction.isModalSubmit()) {

        if (
            !id.startsWith(
                "bank_modal_"
            )
        ) {
            return false;
        }

        const parts =
            id.split("_");

        const action =
            parts[2];

        const userId =
            parts[3];

        if (
            interaction.user.id !==
            userId
        ) {
            return interaction.reply({
                content:
                    "🏦 Đây không phải ngân hàng của bạn.",
                ephemeral: true
            });
        }

        // ─────────────────────────
        // DEPOSIT
        // ─────────────────────────

        if (
            action === "deposit"
        ) {

            const amount =
                parseMoney(
                    interaction.fields.getTextInputValue(
                        "amount"
                    )
                );

            return deposit(
                interaction,
                userId,
                amount
            );
        }


        // ─────────────────────────
        // WITHDRAW
        // ─────────────────────────

        if (
            action === "withdraw"
        ) {

            const amount =
                parseMoney(
                    interaction.fields.getTextInputValue(
                        "amount"
                    )
                );

            return withdraw(
                interaction,
                userId,
                amount
            );
        }


        // ─────────────────────────
        // TRANSFER
        // ─────────────────────────

        if (
            action === "transfer"
        ) {

            const receiverId =
                interaction.fields.getTextInputValue(
                    "receiver"
                );

            const amount =
                parseMoney(
                    interaction.fields.getTextInputValue(
                        "amount"
                    )
                );

            return transfer(
                interaction,
                userId,
                receiverId,
                amount
            );
        }
    }

    return false;
}


module.exports = {
    ...command,
    handleInteraction
};

