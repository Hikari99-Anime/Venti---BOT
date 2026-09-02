
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

// ==========================================
// 🏦 COLORS
// ==========================================

const COLORS = {
    primary: "#9ccfd8",
    success: "#a8d8a8",
    warning: "#ffd166",
    error: "#f2a7a7"
};

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
}

// ==========================================
// ⏰ FORMAT TIME
// ==========================================

function countdown(timestamp) {

    if (!timestamp) {
        return "Ngay bây giờ";
    }

    const remaining =
        Math.max(
            0,
            Number(timestamp) - Date.now()
        );

    if (remaining <= 0) {
        return "Có thể nhận ngay";
    }

    const totalSeconds =
        Math.ceil(
            remaining / 1000
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    if (hours > 0) {
        return `${hours} giờ ${minutes} phút`;
    }

    return `${minutes} phút`;
}

// ==========================================
// 👤 GET USER
// ==========================================

function getUser(userId) {
    return db.getOrCreate(userId);
}

// ==========================================
// 🏦 BANK EMBED
// ==========================================

function bankEmbed(userId) {

    const user =
        getUser(userId);

    const balance =
        Number(
            user.balance || 0
        );

    const bank =
        Number(
            user.bank || 0
        );

    const total =
        balance + bank;

    let interest = {
        canClaim: false,
        amount: 0,
        nextInterestAt: null
    };

    if (
        typeof db.calculateBankInterest ===
        "function"
    ) {
        interest =
            db.calculateBankInterest(
                userId
            ) || interest;
    }

    const totalInterest =
        Number(
            user.bankData?.totalInterest ||
            0
        );

    const interestAmount =
        Number(
            interest.amount || 0
        );

    return new EmbedBuilder()

        .setColor(
            COLORS.primary
        )

        .setTitle(
            "`🏦` Venti Bank"
        )

        .setDescription(
            [
                "╭────────────────────────────╮",
                "        `🏦` **VENTI BANK**",
                "╰────────────────────────────╯",
                "",

                "● `💰` **Tiền mặt**",
                `> +${money(balance)} Mora`,
                "",

                "● `🏦` **Tiền trong Bank**",
                `> +${money(bank)} Mora`,
                "",

                "● `💎` **Tổng tài sản**",
                `> +${money(total)} Mora`,
                "",

                "○ `📈` **Lãi suất**",
                "> +1% / ngày",
                "",

                "○ `💵` **Lãi hôm nay**",
                interest.canClaim
                    ? `> +${money(interestAmount)} Mora`
                    : "> Chưa thể nhận",
                "",

                "○ `📊` **Tổng lãi đã nhận**",
                `> +${money(totalInterest)} Mora`,
                "",

                "────────────────────────────",
                "",

                interest.canClaim
                    ? "◉ `🌿` **Bạn có thể nhận lãi ngay!**"
                    : `○ \`⏰\` Lần nhận lãi tiếp theo: **${countdown(interest.nextInterestAt)}**`,

                "",

                "● `🔒` Tiền trong Bank được bảo toàn",
                "● `📈` Số dư Bank sinh lãi mỗi ngày"
            ].join("\n")
        )

        .setFooter({
            text:
                "Venti Bank • An toàn • Sinh lời"
        })

        .setTimestamp();
}

// ==========================================
// 🔘 BANK BUTTONS
// ==========================================

function bankButtons(userId) {

    return [

        // ==============================
        // ROW 1
        // ==============================

        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `bank_deposit_${userId}`
                    )
                    .setLabel(
                        "Gửi tiền"
                    )
                    .setEmoji(
                        "💰"
                    )
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `bank_withdraw_${userId}`
                    )
                    .setLabel(
                        "Rút tiền"
                    )
                    .setEmoji(
                        "💸"
                    )
                    .setStyle(
                        ButtonStyle.Primary
                    )
            ),

        // ==============================
        // ROW 2
        // ==============================

        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `bank_interest_${userId}`
                    )
                    .setLabel(
                        "Nhận lãi"
                    )
                    .setEmoji(
                        "📈"
                    )
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `bank_refresh_${userId}`
                    )
                    .setLabel(
                        "Làm mới"
                    )
                    .setEmoji(
                        "🔃"
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `bank_close_${userId}`
                    )
                    .setLabel(
                        "Đóng"
                    )
                    .setEmoji(
                        "✖️"
                    )
                    .setStyle(
                        ButtonStyle.Danger
                    )
            )
    ];
}

// ==========================================
// 💰 DEPOSIT MODAL
// ==========================================

function depositModal(userId) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                `bank_modal_deposit_${userId}`
            )
            .setTitle(
                "💰 Gửi tiền vào Bank"
            );

    const amount =
        new TextInputBuilder()
            .setCustomId(
                "amount"
            )
            .setLabel(
                "Số tiền muốn gửi"
            )
            .setPlaceholder(
                "Ví dụ: 5000"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(
                true
            )
            .setMinLength(
                1
            )
            .setMaxLength(
                15
            );

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(
                amount
            )
    );

    return modal;
}

// ==========================================
// 💸 WITHDRAW MODAL
// ==========================================

function withdrawModal(userId) {

    const modal =
        new ModalBuilder()
            .setCustomId(
                `bank_modal_withdraw_${userId}`
            )
            .setTitle(
                "💸 Rút tiền khỏi Bank"
            );

    const amount =
        new TextInputBuilder()
            .setCustomId(
                "amount"
            )
            .setLabel(
                "Số tiền muốn rút"
            )
            .setPlaceholder(
                "Ví dụ: 5000"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(
                true
            )
            .setMinLength(
                1
            )
            .setMaxLength(
                15
            );

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(
                amount
            )
    );

    return modal;
}

// ==========================================
// 🔢 PARSE MONEY
// ==========================================

function parseMoney(value) {

    if (!value) {
        return NaN;
    }

    const clean =
        String(value)
            .trim()
            .replace(/[.,\s]/g, "");

    if (
        !/^\d+$/.test(clean)
    ) {
        return NaN;
    }

    const amount =
        Number(clean);

    if (
        !Number.isSafeInteger(
            amount
        )
    ) {
        return NaN;
    }

    return amount;
}

// ==========================================
// 💰 DEPOSIT
// ==========================================

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
            ephemeral:
                true
        });
    }

    const user =
        getUser(userId);

    const balance =
        Number(
            user.balance || 0
        );

    if (
        amount > balance
    ) {
        return interaction.reply({
            content:
                `❌ Bạn chỉ có **${money(balance)} Mora** tiền mặt.`,
            ephemeral:
                true
        });
    }

    if (
        typeof db.removeBalance !==
        "function"
    ) {
        return interaction.reply({
            content:
                "❌ Database chưa có hàm `removeBalance()`.",
            ephemeral:
                true
        });
    }

    if (
        typeof db.addBank !==
        "function"
    ) {
        return interaction.reply({
            content:
                "❌ Database chưa có hàm `addBank()`.",
            ephemeral:
                true
        });
    }

    const removed =
        db.removeBalance(
            userId,
            amount
        );

    if (
        removed === false
    ) {
        return interaction.reply({
            content:
                "❌ Không thể trừ tiền mặt.",
            ephemeral:
                true
        });
    }

    const added =
        db.addBank(
            userId,
            amount
        );

    if (
        added === false
    ) {

        if (
            typeof db.addBalance ===
            "function"
        ) {
            db.addBalance(
                userId,
                amount
            );
        }

        return interaction.reply({
            content:
                "❌ Không thể gửi tiền vào Bank.",
            ephemeral:
                true
        });
    }

    return interaction.update({
        embeds: [
            bankEmbed(
                userId
            )
        ],
        components:
            bankButtons(
                userId
            )
    });
}

// ==========================================
// 💸 WITHDRAW
// ==========================================

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
            ephemeral:
                true
        });
    }

    const user =
        getUser(userId);

    const bank =
        Number(
            user.bank || 0
        );

    if (
        amount > bank
    ) {
        return interaction.reply({
            content:
                `❌ Bank chỉ có **${money(bank)} Mora**.`,
            ephemeral:
                true
        });
    }

    if (
        typeof db.removeBank !==
        "function"
    ) {
        return interaction.reply({
            content:
                "❌ Database chưa có hàm `removeBank()`.",
            ephemeral:
                true
        });
    }

    if (
        typeof db.addBalance !==
        "function"
    ) {
        return interaction.reply({
            content:
                "❌ Database chưa có hàm `addBalance()`.",
            ephemeral:
                true
        });
    }

    const removed =
        db.removeBank(
            userId,
            amount
        );

    if (
        removed === false
    ) {
        return interaction.reply({
            content:
                "❌ Không thể rút tiền.",
            ephemeral:
                true
        });
    }

    const added =
        db.addBalance(
            userId,
            amount
        );

    if (
        added === false
    ) {

        if (
            typeof db.addBank ===
            "function"
        ) {
            db.addBank(
                userId,
                amount
            );
        }

        return interaction.reply({
            content:
                "❌ Không thể cộng tiền mặt.",
            ephemeral:
                true
        });
    }

    return interaction.update({
        embeds: [
            bankEmbed(
                userId
            )
        ],
        components:
            bankButtons(
                userId
            )
    });
}

// ==========================================
// 📈 CLAIM INTEREST
// ==========================================

async function claimInterest(
    interaction,
    userId
) {

    if (
        typeof db.claimBankInterest !==
        "function"
    ) {
        return interaction.reply({
            content:
                "❌ Database chưa có hệ thống lãi Bank.",
            ephemeral:
                true
        });
    }

    const result =
        db.claimBankInterest(
            userId
        );

    if (
        !result ||
        !result.success
    ) {

        if (
            result?.reason ===
            "empty"
        ) {
            return interaction.reply({
                content:
                    "❌ Bank đang trống.\nHãy gửi tiền vào Bank trước.",
                ephemeral:
                    true
            });
        }

        if (
            result?.reason ===
            "cooldown"
        ) {
            return interaction.reply({
                content:
                    `⏰ Bạn đã nhận lãi hôm nay rồi.\n\nLần nhận tiếp theo sau **${countdown(result.nextInterestAt)}**.`,
                ephemeral:
                    true
            });
        }

        if (
            result?.reason ===
            "too_small"
        ) {
            return interaction.reply({
                content:
                    "❌ Số dư Bank quá nhỏ để tạo ra ít nhất 1 Mora tiền lãi.",
                ephemeral:
                    true
            });
        }

        return interaction.reply({
            content:
                "❌ Không thể nhận lãi.",
            ephemeral:
                true
        });
    }

    return interaction.update({
        embeds: [
            bankEmbed(
                userId
            )
        ],
        components:
            bankButtons(
                userId
            )
    });
}

// ==========================================
// 📋 COMMAND
// ==========================================

const command = {

    name:
        "bank",

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

    async execute(
        message
    ) {

        const userId =
            message.author.id;

        getUser(
            userId
        );

        return message.reply({
            embeds: [
                bankEmbed(
                    userId
                )
            ],
            components:
                bankButtons(
                    userId
                )
        });
    }
};

// ==========================================
// 🎯 INTERACTION HANDLER
// ==========================================

async function handleInteraction(
    interaction
) {

    try {

        // ==================================
        // 🔘 BUTTON
        // ==================================

        if (
            interaction.isButton()
        ) {

            const id =
                interaction.customId || "";

            if (
                !id.startsWith(
                    "bank_"
                )
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
                !userId ||
                interaction.user.id !==
                userId
            ) {
                return interaction.reply({
                    content:
                        "🏦 Đây không phải ngân hàng của bạn.",
                    ephemeral:
                        true
                });
            }

            // ==============================
            // 💰 DEPOSIT
            // ==============================

            if (
                action ===
                "deposit"
            ) {
                return interaction.showModal(
                    depositModal(
                        userId
                    )
                );
            }

            // ==============================
            // 💸 WITHDRAW
            // ==============================

            if (
                action ===
                "withdraw"
            ) {
                return interaction.showModal(
                    withdrawModal(
                        userId
                    )
                );
            }

            // ==============================
            // 📈 INTEREST
            // ==============================

            if (
                action ===
                "interest"
            ) {
                return claimInterest(
                    interaction,
                    userId
                );
            }

            // ==============================
            // 🔃 REFRESH
            // ==============================

            if (
                action ===
                "refresh"
            ) {

                return interaction.update({
                    embeds: [
                        bankEmbed(
                            userId
                        )
                    ],
                    components:
                        bankButtons(
                            userId
                        )
                });
            }

            // ==============================
            // ✖️ CLOSE
            // ==============================

            if (
                action ===
                "close"
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

        // ==================================
        // 📝 MODAL
        // ==================================

        if (
            interaction.isModalSubmit()
        ) {

            const id =
                interaction.customId || "";

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
                !userId ||
                interaction.user.id !==
                userId
            ) {
                return interaction.reply({
                    content:
                        "🏦 Đây không phải ngân hàng của bạn.",
                    ephemeral:
                        true
                });
            }

            // ==============================
            // 💰 DEPOSIT
            // ==============================

            if (
                action ===
                "deposit"
            ) {

                const amount =
                    parseMoney(
                        interaction.fields
                            .getTextInputValue(
                                "amount"
                            )
                    );

                return deposit(
                    interaction,
                    userId,
                    amount
                );
            }

            // ==============================
            // 💸 WITHDRAW
            // ==============================

            if (
                action ===
                "withdraw"
            ) {

                const amount =
                    parseMoney(
                        interaction.fields
                            .getTextInputValue(
                                "amount"
                            )
                    );

                return withdraw(
                    interaction,
                    userId,
                    amount
                );
            }

            return false;
        }

        return false;

    } catch (error) {

        console.error(
            "[Bank]",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {
            return interaction
                .followUp({
                    content:
                        "🏦 Có lỗi xảy ra khi xử lý Venti Bank.",
                    ephemeral:
                        true
                })
                .catch(
                    () => {}
                );
        }

        return interaction
            .reply({
                content:
                    "🏦 Có lỗi xảy ra khi xử lý Venti Bank.",
                ephemeral:
                    true
            })
            .catch(
                () => {}
            );
    }
}

// ==========================================
// 📦 EXPORT
// ==========================================

module.exports = {
    ...command,
    handleInteraction
};

