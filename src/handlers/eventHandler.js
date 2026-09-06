const fs = require("fs");
const path = require("path");

const {
    MessageFlags
} = require("discord.js");

const {
    handleInteraction
} = require("./interactionHandler");

function loadEvents(client) {

    const eventsPath =
        path.join(
            process.cwd(),
            "src",
            "events"
        );

    const files =
        fs
            .readdirSync(eventsPath)
            .filter(
                file =>
                    file.endsWith(".js")
            );

    for (const file of files) {

        const event =
            require(
                path.join(
                    eventsPath,
                    file
                )
            );

        if (event.once) {

            client.once(
                event.name,
                (...args) =>
                    event.execute(...args)
            );

        } else {

            client.on(
                event.name,
                (...args) =>
                    event.execute(...args)
            );
        }
    }

    // ==========================================
    // 🎛️ INTERACTION HANDLER
    // ==========================================

    client.on(
        "interactionCreate",
        async interaction => {

            try {

                await handleInteraction(
                    interaction
                );

            } catch (error) {

                console.error(
                    "[Interaction Error]",
                    error
                );

                const content =
                    "🍃 Venti gặp một cơn gió ngược...";

                try {

                    if (
                        interaction.replied ||
                        interaction.deferred
                    ) {

                        await interaction.followUp({
                            content,
                            flags:
                                MessageFlags.Ephemeral
                        });

                    } else {

                        await interaction.reply({
                            content,
                            flags:
                                MessageFlags.Ephemeral
                        });
                    }

                } catch (replyError) {

                    console.error(
                        "[Interaction Reply Error]",
                        replyError
                    );
                }
            }
        }
    );

    console.log(
        `🍃 Loaded ${files.length} events.`
    );
}

module.exports = {
    loadEvents
};
