module.exports = {
    name: "ready",
    once: true,

    execute(client) {
        console.log(`🍃 ${client.user.tag} is online!`);

        client.user.setPresence({
            activities: [
                {
                    name: "Đang buồn vì không có ai chơi cùng... vui lòng chelp để xem danh sách lệnh.",
                    type: 0
                }
            ],
            status: "online"
        });
    }
};
