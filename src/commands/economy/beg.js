
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const User =
    require("../../database/models/User");

// ==========================================
// 💰 FORMAT MONEY
// ==========================================

function money(amount) {
    return Number(
        amount || 0
    ).toLocaleString("vi-VN");
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
            .replace(/[.,\s]/g, "");

    if (!/^\d+$/.test(clean)) {
        return NaN;
    }

    const amount =
        Number(clean);

    if (!Number.isSafeInteger(amount)) {
        return NaN;
    }

    return amount;
}

// ==========================================
// 🎨 COLORS
// ==========================================

const COLORS = {
    primary: "#9ccfd8",
    success: "#a8d8a8",
    error: "#f2a7a7",
    warning: "#ffd166"
};

// ==========================================
// 📨 BEG REQUEST EMBED
// ==========================================

function requestEmbed(
    requester,
    target
) {
    return new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle("🍃 Yêu cầu xin Mora")
        .setDescription(
            [
                `> \`🍃\` ${requester} đang xin Mora từ ${target}.`,
                "",
                `\`👤\` **Người xin:** ${requester}`,
                `\`💰\` **Người cho:** ${target}`,
                "",
                "Nhấn **Xác nhận** để chọn số Mora muốn cho.",
                "Nhấn **Từ chối** nếu bạn không muốn cho."
            ].join("\n")
        )
        .setFooter({
            text: "Venti • Yêu cầu xin Mora"
        })
        .setTimestamp();
}

// ==========================================
// 🔘 REQUEST BUTTONS
// ==========================================

function requestButtons(
    requesterId,
    targetId
) {
    return [
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        `beg_accept_${requesterId}_${targetId}`
                    )
                    .setLabel("Xác nhận")
                    .setEmoji("🟢")
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `beg_deny_${requesterId}_${targetId}`
                    )
                    .setLabel("Từ chối")
                    .setEmoji("🔴")
                    .setStyle(
                        ButtonStyle.Danger
                    )
            )
    ];
}

// ==========================================
// 💰 AMOUNT MODAL
// ==========================================

function amountModal(
    requesterId,
    targetId
) {
    const modal =
        new ModalBuilder()
            .setCustomId(
                `beg_modal_${requesterId}_${targetId}`
            )
            .setTitle(
                "💰 Cho Mora"
            );

    const amount =
        new TextInputBuilder()
            .setCustomId(
                "amount"
            )
            .setLabel(
                "Số Mora muốn cho"
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
            .addComponents(
                amount
            )
    );

    return modal;
}

// ==========================================
// 📤 SEND REQUEST
// ==========================================

async function sendRequest(
    message
) {
    const requester =
        message.author;

    const target =
        message.mentions.users.first();

    // ======================================
    // ❌ KHÔNG TAG
    // ======================================

    if (!target) {
        return message.reply(
            "🍃 Bạn muốn xin Mora từ ai?\n\n" +
            "Cách dùng: `Vbeg @user`"
        );
    }

    // ======================================
    // 🚫 TỰ XIN
    // ======================================

    if (
        target.id ===
        requester.id
    ) {
        return message.reply(
            "🍃 Bạn không thể xin Mora của chính mình."
        );
    }

    // ======================================
    // 👤 TẠO USER
    // ======================================

    User.getOrCreate(
        requester.id
    );

    User.getOrCreate(
        target.id
    );

    // ======================================
    // 📩 GỬI YÊU CẦU
    // ======================================

    return message.reply({
        content: `${target}`,
        embeds: [
            requestEmbed(
                requester,
                target
            )
        ],
        components:
            requestButtons(
                requester.id,
                target.id
            )
    });
}

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
                !id.startsWith("beg_")
            ) {
                return false;
            }

            const parts =
                id.split("_");

            const action =
                parts[1];

            const requesterId =
                parts[2];

            const targetId =
                parts[3];

            if (
                !requesterId ||
                !targetId
            ) {
                return false;
            }

            // ==================================
            // 🔐 CHỈ NGƯỜI ĐƯỢC XIN ĐƯỢC BẤM
            // ==================================

            if (
                interaction.user.id !==
                targetId
            ) {
                return interaction.reply({
                    content:
                        "🍃 Chỉ người được yêu cầu mới có thể xử lý yêu cầu này.",
                    ephemeral: true
                });
            }

            // ==================================
            // 🟢 ACCEPT
            // ==================================

            if (
                action === "accept"
            ) {
                return interaction.showModal(
                    amountModal(
                        requesterId,
                        targetId
                    )
                );
            }

            // ==================================
            // 🔴 DENY
            // ==================================

            if (
                action === "deny"
            ) {
                return interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                COLORS.error
                            )
                            .setTitle(
                                "🍃 Yêu cầu bị từ chối"
                            )
                            .setDescription(
                                `> \`🔴\` ${interaction.user} đã từ chối yêu cầu xin Mora.`
                            )
                            .setFooter({
                                text:
                                    "Venti • Yêu cầu xin Mora"
                            })
                            .setTimestamp()
                    ],
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
                    "beg_modal_"
                )
            ) {
                return false;
            }

            const parts =
                id.split("_");

            const requesterId =
                parts[2];

            const targetId =
                parts[3];

            // ==================================
            // 🔐 KIỂM TRA NGƯỜI CHO
            // ==================================

            if (
                interaction.user.id !==
                targetId
            ) {
                return interaction.reply({
                    content:
                        "🍃 Bạn không có quyền xử lý yêu cầu này.",
                    ephemeral: true
                });
            }

            // ==================================
            // 🔢 LẤY SỐ TIỀN
            // ==================================

            const value =
                interaction.fields
                    .getTextInputValue(
                        "amount"
                    );

            const amount =
                parseMoney(value);

            if (
                !Number.isSafeInteger(
                    amount
                ) ||
                amount <= 0
            ) {
                return interaction.reply({
                    content:
                        "❌ Số Mora không hợp lệ.",
                    ephemeral: true
                });
            }

            // ==================================
            // 👤 LẤY USER
            // ==================================

            const requester =
                User.getOrCreate(
                    requesterId
                );

            const giver =
                User.getOrCreate(
                    targetId
                );

            const giverBalance =
                Number(
                    giver.balance || 0
                );

            // ==================================
            // 💰 KIỂM TRA TIỀN
            // ==================================

            if (
                amount >
                giverBalance
            ) {
                return interaction.reply({
                    content:
                        `❌ Bạn chỉ có **${money(giverBalance)} Mora** tiền mặt.`,
                    ephemeral: true
                });
            }

            // ==================================
            // 💸 TRỪ NGƯỜI CHO
            // ==================================

            const removed =
                User.removeBalance(
                    targetId,
                    amount
                );

            if (!removed) {
                return interaction.reply({
                    content:
                        "❌ Không thể trừ Mora. Giao dịch đã bị hủy.",
                    ephemeral: true
                });
            }

            // ==================================
            // 💰 CỘNG NGƯỜI XIN
            // ==================================

            User.addBalance(
                requesterId,
                amount
            );

            // ==================================
            // ⭐ XP NGƯỜI XIN
            // ==================================

            User.addXP(
                requesterId,
                10
            );

            // ==================================
            // 📩 THÔNG BÁO
            // ==================================

            const requesterUser =
                await interaction.client.users
                    .fetch(requesterId)
                    .catch(() => null);

            return interaction.update({
                content:
                    requesterUser
                        ? `${requesterUser}`
                        : "",
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            COLORS.success
                        )
                        .setTitle(
                            "🍃 Đã cho Mora"
                        )
                        .setDescription(
                            [
                                `> \`🟢\` ${interaction.user} đã đồng ý cho Mora.`,
                                "",
                                `\`👤\` **Người nhận:** ${requesterUser || `<@${requesterId}>`}`,
                                `\`💰\` **Số tiền:** +${money(amount)} Mora`,
                                `\`✨\` **XP:** +10`,
                                "",
                                `\`💳\` **Số dư còn lại:** ${money(giverBalance - amount)} Mora`
                            ].join("\n")
                        )
                        .setFooter({
                            text:
                                "Venti • Giao dịch xin Mora"
                        })
                        .setTimestamp()
                ],
                components: []
            });
        }

        return false;

    } catch (error) {

        console.error(
            "[beg]",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {
            return interaction
                .followUp({
                    content:
                        "🍃 Có lỗi xảy ra khi xử lý yêu cầu xin Mora.",
                    ephemeral: true
                })
                .catch(() => {});
        }

        return interaction
            .reply({
                content:
                    "🍃 Có lỗi xảy ra khi xử lý yêu cầu xin Mora.",
                ephemeral: true
            })
            .catch(() => {});
    }
}

// ==========================================
// 📦 COMMAND
// ==========================================

module.exports = {
    name: "beg",
    aliases: ["xin"],
    description:
        "Xin Mora từ người chơi khác.",
    usage:
        "Vbeg @user",

    execute:
        sendRequest,

    handleInteraction
};
