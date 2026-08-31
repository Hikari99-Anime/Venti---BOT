const {
    Client,
    Collection,
    GatewayIntentBits
} = require("discord.js");

const config = require("./config");
const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");

if (!config.token) {
    console.error("❌ TOKEN chưa được cấu hình trong .env");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

loadCommands(client);
loadEvents(client);

process.on("unhandledRejection", error => {
    console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", error => {
    console.error("Uncaught Exception:", error);
});

client.login(config.token);
