function pointAtBezier(line, t) {
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    const pos = [];
    for (let coord = 0; coord <= 1; coord++) {
        pos[coord] = a * line[0][coord] + b * line[1][coord] + c * line[2][coord] + d * line[3][coord];
    }
    return pos;
}

