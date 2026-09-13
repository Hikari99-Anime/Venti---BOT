
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
    primary: "#A8DCC0",
    success: "#A8DCC0",
    error: "#F2A7A7",
    warning: "#FFD166"
};

// ==========================================
// 📨 BEG REQUEST EMBED
// ==========================================

function requestEmbed(
    requester,
    target
) {
    return new EmbedBuilder()

        .setColor(
            COLORS.primary
        )

        .setAuthor({
            name:
                `☁️ ${requester.globalName || requester.username} · Columbina`,
            iconURL:
                requester.displayAvatarURL({
                    extension: "png",
                    size: 128
                })
        })

        .setTitle(
            "🍃 Yêu Cầu Xin Mora"
        )

        .setDescription(
            [
                "☁️ `🍃` **Một lời xin nhỏ trong hành trình**",
                "",

                "- `👤` **Người xin**",
                `> ${requester}`,

                "",

                "- `💰` **Người được xin**",
                `> ${target}`,

                "",

                "☕ `🍃` **Nhấn Xác nhận để chọn số Mora muốn cho.**",
                "☁️ `🍃` **Nhấn Từ chối nếu bạn không muốn cho.**"
            ].join("\n")
        )

        .setThumbnail(
            requester.displayAvatarURL({
                extension: "png",
                size: 256
            })
        )

        .setFooter({
            text:
                "☁️ Columbina • Cozy Corner 🍃"
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
                    .setLabel(
                        "Xác nhận"
                    )
                    .setEmoji(
                        "🟢"
                    )
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `beg_deny_${requesterId}_${targetId}`
                    )
                    .setLabel(
                        "Từ chối"
                    )
                    .setEmoji(
                        "🔴"
                    )
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
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        COLORS.error
                    )
                    .setAuthor({
                        name:
                            `☁️ ${requester.globalName || requester.username} · Columbina`,
                        iconURL:
                            requester.displayAvatarURL({
                                extension: "png",
                                size: 128
                            })
                    })
                    .setTitle(
                        "🍃 Yêu Cầu Xin Mora"
                    )
                    .setDescription(
                        [
                            "☁️ `🍃` **Bạn muốn xin Mora từ ai?**",
                            "",
                            "- `📝` **Cách dùng**",
                            "> `Vbeg @user`"
                        ].join("\n")
                    )
                    .setFooter({
                        text:
                            "☁️ Columbina • Cozy Corner 🍃"
                    })
                    .setTimestamp()
            ]
        });
    }

    // ======================================
    // 🚫 TỰ XIN
    // ======================================

    if (
        target.id ===
        requester.id
    ) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(
                        COLORS.error
                    )
                    .setAuthor({
                        name:
                            `☁️ ${requester.globalName || requester.username} · Columbina`,
                        iconURL:
                            requester.displayAvatarURL({
                                extension: "png",
                                size: 128
                            })
                    })
                    .setTitle(
                        "🍃 Không Thể Thực Hiện"
                    )
                    .setDescription(
                        "☁️ `🍃` **Bạn không thể xin Mora của chính mình.**"
                    )
                    .setFooter({
                        text:
                            "☁️ Columbina • Cozy Corner 🍃"
                    })
                    .setTimestamp()
            ]
        });
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
        content:
            `${target}`,

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
                !id.startsWith(
                    "beg_"
                )
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
            // 🔐 CHỈ NGƯỜI ĐƯỢC XIN
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
                action ===
                "accept"
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
                action ===
                "deny"
            ) {
                return interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                COLORS.error
                            )
                            .setAuthor({
                                name:
                                    `☁️ ${interaction.user.globalName || interaction.user.username} · Columbina`,
                                iconURL:
                                    interaction.user.displayAvatarURL({
                                        extension: "png",
                                        size: 128
                                    })
                            })
                            .setTitle(
                                "🍃 Yêu Cầu Bị Từ Chối"
                            )
                            .setDescription(
                                [
                                    "☁️ `🍃` **Yêu cầu xin Mora đã bị từ chối.**",
                                    "",
                                    `- \`🔴\` **Người từ chối**`,
                                    `> ${interaction.user}`,
                                    "",
                                    "☕ `🍃` **Giao dịch chưa được thực hiện.**"
                                ].join("\n")
                            )
                            .setFooter({
                                text:
                                    "☁️ Columbina • Cozy Corner 🍃"
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
                parseMoney(
                    value
                );

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
                    .fetch(
                        requesterId
                    )
                    .catch(
                        () => null
                    );

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

                        .setAuthor({
                            name:
                                `☁️ ${interaction.user.globalName || interaction.user.username} · Columbina`,
                            iconURL:
                                interaction.user.displayAvatarURL({
                                    extension: "png",
                                    size: 128
                                })
                        })

                        .setTitle(
                            "🍃 Đã Cho Mora"
                        )

                        .setDescription(
                            [
                                "☁️ `🍃` **Giao dịch đã được hoàn tất.**",
                                "",

                                "- `👤` **Người nhận**",
                                `> ${requesterUser || `<@${requesterId}>`}`,

                                "",

                                "- `💰` **Số tiền**",
                                `> +${money(amount)} Mora`,

                                "",

                                "- `✨` **Kinh nghiệm**",
                                "> +10 XP",

                                "",

                                "- `💳` **Số dư còn lại**",
                                `> ${money(giverBalance - amount)} Mora`,

                                "",

                                "☕ `🍃` **Một chút Mora cho hành trình phía trước.**"
                            ].join("\n")
                        )

                        .setThumbnail(
                            interaction.user.displayAvatarURL({
                                extension: "png",
                                size: 256
                            })
                        )

                        .setFooter({
                            text:
                                "☁️ Columbina • Cozy Corner 🍃"
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
                .catch(
                    () => {}
                );
        }

        return interaction
            .reply({
                content:
                    "🍃 Có lỗi xảy ra khi xử lý yêu cầu xin Mora.",
                ephemeral: true
            })
            .catch(
                () => {}
            );
    }
}

// ==========================================
// 📦 COMMAND
// ==========================================

module.exports = {
    name: "beg",

    aliases: [
        "xin"
    ],

    description:
        "Xin Mora từ người chơi khác.",

    usage:
        "Vbeg @user",

    execute:
        sendRequest,

    handleInteraction
};

