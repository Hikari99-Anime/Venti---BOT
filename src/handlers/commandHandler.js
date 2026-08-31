const fs = require("fs");
const path = require("path");

function getCommandFiles(dir) {
    const entries =
        fs.readdirSync(dir, {
            withFileTypes: true
        });

    const files = [];

    for (const entry of entries) {
        const fullPath =
            path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(
                ...getCommandFiles(fullPath)
            );
        } else if (
            entry.isFile() &&
            entry.name.endsWith(".js")
        ) {
            files.push(fullPath);
        }
    }

    return files;
}

function loadCommands(client) {
    const commandsPath =
        path.join(
            process.cwd(),
            "src",
            "commands"
        );

    const files =
        getCommandFiles(commandsPath);

    client.commands.clear();

    for (const file of files) {
        const command =
            require(file);

        if (!command.name) {
            console.warn(
                `⚠️ Invalid command: ${file}`
            );
            continue;
        }

        client.commands.set(
            command.name,
            command
        );

        if (command.aliases) {
            for (const alias of command.aliases) {
                client.commands.set(
                    alias,
                    command
                );
            }
        }
    }

    console.log(
        `🍃 Loaded ${files.length} command files.`
    );
}

module.exports = {
    loadCommands
};
