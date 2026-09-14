const SHOP =
    require("../../commands/shop/shop");

// ═══════════════════════════════════════
// 🛒 SHOP BUTTON
// ═══════════════════════════════════════

async function execute(interaction) {

    /*
     * File này được gọi từ:
     *
     * profile_shop
     * inventory_shop
     *
     * Nếu interaction là button,
     * command shop sẽ xử lý.
     */

    return SHOP.execute(
        interaction
    );
}

// ═══════════════════════════════════════
// 🛒 SHOP INTERACTION
// ═══════════════════════════════════════

async function handleInteraction(
    interaction
) {

    try {

        const id =
            interaction.customId || "";

        // ═══════════════════════════════
        // 🪟 SHOP QUANTITY MODAL
        // ═══════════════════════════════

        if (
            interaction.isModalSubmit() &&
            id.startsWith(
                "shop_quantity_"
            )
        ) {

            /*
             * customId:
             *
             * shop_quantity_USERID_ITEMID
             *
             * Ví dụ:
             *
             * shop_quantity_123456789_apple
             */

            const parts =
                id.split("_");

            if (
                parts.length < 4
            ) {

                return interaction.reply({

                    content:
                        "❌ Dữ liệu mua hàng không hợp lệ.",

                    ephemeral:
                        true
                });
            }

            const userId =
                parts[2];

            /*
             * Không dùng parts[3] trực tiếp
             * vì item ID có thể có "_"
             *
             * Ví dụ:
             *
             * golden_apple
             * crystal_berry
             */

            const itemId =
                parts
                    .slice(3)
                    .join("_");

            // ═══════════════════════════
            // 🛡️ CHECK USER
            // ═══════════════════════════

            if (
                interaction.user.id !==
                userId
            ) {

                return interaction.reply({

                    content:
                        "🍃 Đây không phải shop của bạn.",

                    ephemeral:
                        true
                });
            }

            // ═══════════════════════════
            // 🔢 GET QUANTITY
            // ═══════════════════════════

            let quantityRaw;

            try {

                quantityRaw =
                    interaction.fields
                        .getTextInputValue(
                            "quantity"
                        );

            } catch (error) {

                console.error(
                    "[shop quantity field]",
                    error
                );

                return interaction.reply({

                    content:
                        "❌ Không đọc được số lượng.",

                    ephemeral:
                        true
                });
            }

            const quantity =
                Number(
                    String(
                        quantityRaw
                    ).trim()
                );

            // ═══════════════════════════
            // ❌ INVALID QUANTITY
            // ═══════════════════════════

            if (
                !Number.isInteger(
                    quantity
                ) ||
                quantity <= 0
            ) {

                return interaction.reply({

                    content:
                        "❌ Số lượng phải là một số nguyên lớn hơn 0.",

                    ephemeral:
                        true
                });
            }

            // ═══════════════════════════
            // 🛒 BUY
            // ═══════════════════════════

            return SHOP.buyItemFromModal(
                interaction,
                itemId,
                userId,
                quantity
            );
        }

        return false;

    } catch (error) {

        console.error(
            "[shop handleInteraction]",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            return interaction
                .followUp({

                    content:
                        "🍃 Có lỗi xảy ra khi mua hàng.",

                    ephemeral:
                        true

                })
                .catch(() => {});
        }

        return interaction
            .reply({

                content:
                    "🍃 Có lỗi xảy ra khi mua hàng.",

                ephemeral:
                    true

            })
            .catch(() => {});
    }
}

module.exports = {
    execute,
    handleInteraction
};