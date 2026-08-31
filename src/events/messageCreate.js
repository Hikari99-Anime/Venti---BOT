const config = require("../config");
const User = require("../database/models/User");

module.exports = {
    name: "messageCreate",

    async execute(message) {
        if (message.author.bot) return;

        const prefix = config.prefix;

        if (!message.content.toLowerCase().startsWith(
            prefix.toLowerCase()
        )) {
            return;
        }

        const args = message.content
            .slice(prefix.length)
            .trim()
            .split(/\s+/);

        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        const command = message.client.commands.get(
            commandName
        );

        if (!command) return;

        User.getOrCreate(message.author.id);

        try {
            await command.execute(
                message,
                args
            );
        } catch (error) {
            console.error(
                `[${commandName}]`,
                error
            );

            await message.reply({
                content:
                    "🍃 Có lỗi xảy ra khi Venti đang xử lý lệnh này."
            }).catch(() => {});
        }
    }
};
