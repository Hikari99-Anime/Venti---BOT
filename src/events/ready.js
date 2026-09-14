module.exports = {
    name: "ready",
    once: true,

    execute(client) {
        console.log(
            `🍃 ${client.user.tag} đã thức giấc!`
        );

        client.user.setPresence({
            activities: [
                {
                    name:
                        "☁️ chelp • Columbina đang ngân nga",
                    type: 3
                }
            ],

            status: "online"
        });
    }
};


