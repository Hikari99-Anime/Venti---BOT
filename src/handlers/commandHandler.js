
const fs = require("fs");
const path = require("path");

// ==========================================
// 📂 GET COMMAND FILES
// ==========================================

function getCommandFiles(dir) {
    const entries =
        fs.readdirSync(dir, {
            withFileTypes: true
        });

    const files = [];

    for (const entry of entries) {
        // ==================================
        // 🚫 BỎ QUA FILE / FOLDER PRIVATE
        // ==================================

        if (
            entry.name.startsWith("_")
        ) {
            continue;
        }

        const fullPath =
            path.join(
                dir,
                entry.name
            );

        // ==================================
        // 📁 FOLDER
        // ==================================

        if (entry.isDirectory()) {
            files.push(
                ...getCommandFiles(
                    fullPath
                )
            );

            continue;
        }

        // ==================================
        // 📄 COMMAND FILE
        // ==================================

        if (
            entry.isFile() &&
            entry.name.endsWith(".js")
        ) {
            files.push(fullPath);
        }
    }

    return files;
}

// ==========================================
// 🚀 LOAD COMMANDS
// ==========================================

function loadCommands(client) {
    const commandsPath =
        path.join(
            process.cwd(),
            "src",
            "commands"
        );

    if (
        !fs.existsSync(commandsPath)
    ) {
        console.error(
            `❌ Không tìm thấy thư mục commands: ${commandsPath}`
        );

        return;
    }

    const files =
        getCommandFiles(
            commandsPath
        );

    // Xóa command cũ
    client.commands.clear();

    let loaded = 0;
    let invalid = 0;

    // ======================================
    // 📦 LOAD TỪNG COMMAND
    // ======================================

    for (const file of files) {
        try {
            const command =
                require(file);

            // ==============================
            // ❌ INVALID COMMAND
            // ==============================

            if (
                !command ||
                typeof command !==
                    "object" ||
                typeof command.name !==
                    "string" ||
                !command.name.trim()
            ) {
                console.warn(
                    `⚠️ Invalid command: ${file}`
                );

                invalid++;

                continue;
            }

            const commandName =
                command.name
                    .trim()
                    .toLowerCase();

            // ==============================
            // 📌 REGISTER COMMAND
            // ==============================

            client.commands.set(
                commandName,
                command
            );

            // ==============================
            // 🔗 REGISTER ALIASES
            // ==============================

            if (
                Array.isArray(
                    command.aliases
                )
            ) {
                for (
                    const alias of
                    command.aliases
                ) {
                    if (
                        typeof alias !==
                            "string" ||
                        !alias.trim()
                    ) {
                        continue;
                    }

                    client.commands.set(
                        alias
                            .trim()
                            .toLowerCase(),
                        command
                    );
                }
            }

            loaded++;

            console.log(
                `🍃 Loaded: ${commandName}`
            );
        } catch (error) {
            console.error(
                `❌ Failed to load command: ${file}`
            );

            console.error(
                error
            );
        }
    }

    // ======================================
    // 📊 RESULT
    // ======================================

    console.log(
        `🍃 Loaded ${loaded} command files.`
    );

    if (invalid > 0) {
        console.warn(
            `⚠️ Skipped ${invalid} invalid command files.`
        );
    }
}

// ==========================================
// 📤 EXPORT
// ==========================================

module.exports = {
    loadCommands
};

