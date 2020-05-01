function hexToRGBA(hex, alpha) {
    let r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);

    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}


function arrayDiv(a, b) {
    let out = [];
    const isNumber = typeof(b) === 'number';

    for (idx = 0; idx < a.length; idx++) {
        div = isNumber ? b : b[idx];
        out.push(a[idx] / div);
    }

    return out;
}


function arraySub(a, b) {
    let out = [];
    const isNumber = typeof(b) === 'number';

    for (idx = 0; idx < a.length; idx++) {
        sub = isNumber ? b : b[idx];
        out.push(a[idx] - sub);
    }

    return out;
}
