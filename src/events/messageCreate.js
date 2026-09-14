const config =
    require("../config");

module.exports = {
    name: "messageCreate",

    async execute(message) {

        // ======================================
        // 🚫 IGNORE BOT
        // ======================================

        if (message.author.bot) {
            return;
        }

        // ======================================
        // 🔑 PREFIX
        // ======================================

        const prefix =
            String(
                config.prefix || "c"
            ).trim();

        // ======================================
        // 🚫 KHÔNG CÓ PREFIX
        // ======================================

        if (
            !message.content.startsWith(
                prefix
            )
        ) {
            return;
        }

        // ======================================
        // 🧹 PARSE COMMAND
        // ======================================

        const args =
            message.content
                .slice(prefix.length)
                .trim()
                .split(/\s+/);

        const commandName =
            args.shift()?.toLowerCase();

        if (!commandName) {
            return;
        }

        // ======================================
        // 🔎 FIND COMMAND
        // ======================================

        const command =
            message.client.commands.get(
                commandName
            );

        if (!command) {
            return;
        }

        // ======================================
        // 🚀 EXECUTE
        // ======================================

        try {

            await command.execute(
                message,
                args
            );

        } catch (error) {

            console.error(
                `❌ Error executing ${commandName}:`,
                error
            );

            return message.reply({
                content:
                    "`❌` Đã xảy ra lỗi khi thực hiện lệnh."
            });
        }
    }
};
