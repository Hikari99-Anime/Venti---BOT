const fs = require("fs");
const path = require("path");
const { handleInteraction } = require("./interactionHandler");

function loadEvents(client) {
    const eventsPath = path.join(
        process.cwd(),
        "src",
        "events"
    );

    const files = fs
        .readdirSync(eventsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        const event = require(
            path.join(eventsPath, file)
        );

        if (event.once) {
            client.once(
                event.name,
                (...args) => event.execute(...args)
            );
        } else {
            client.on(
                event.name,
                (...args) => event.execute(...args)
            );
        }
    }

    client.on("interactionCreate", async interaction => {
        try {
            await handleInteraction(interaction);
        } catch (error) {
            console.error("Interaction Error:", error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "🍃 Venti gặp một cơn gió ngược...",
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: "🍃 Venti gặp một cơn gió ngược...",
                    ephemeral: true
                }).catch(() => {});
            }
        }
    });

    console.log(`🍃 Loaded ${files.length} events.`);
}

module.exports = {
    loadEvents
};
