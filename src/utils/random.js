function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(percent) {
    return Math.random() * 100 < percent;
}

function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
    random,
    chance,
    pick
};
