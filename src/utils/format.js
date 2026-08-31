function money(amount) {
    return Number(amount).toLocaleString("en-US");
}

function timeRemaining(ms) {
    const seconds = Math.ceil(ms / 1000);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
}

module.exports = {
    money,
    timeRemaining
};
