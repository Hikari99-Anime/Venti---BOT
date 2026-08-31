module.exports = {
    name: "ready",
    once: true,

    execute(client) {
        console.log(`🍃 ${client.user.tag} is online!`);

        client.user.setPresence({
            activities: [
                {
                    name: "the wind 🍃 | Vhelp",
                    type: 0
                }
            ],
            status: "online"
        });
    }
};
