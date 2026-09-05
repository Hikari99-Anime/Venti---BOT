module.exports = {
    name: "ready",
    once: true,

    execute(client) {
        console.log(`🍃 ${client.user.tag} is online!`);

        client.user.setPresence({
            activities: [
                {
                    name: "Columbina // Play vhelp",
                    type: 0
                }
            ],
            status: "online"
        });
    }
};
