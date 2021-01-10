function hexToRGBA(hex, alpha) {
    let r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);

    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}


function arrayDiv(a, b) {
    let out = [];
    const isNumber = typeof(b) === 'number';

    for (idx = 0; idx < a.length; idx++) {
        div = isNumber ? b : b[idx];
        if (div == 0) {
            out.push(0);
        } else {
            out.push(a[idx] / div);
        }
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


function arrayEqual(a, b) {
    if (a.length != b.length) {
        return false;
    }

    for (var i = 0, l=a.length; i < l; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}


function NiceScale (lowerBound, upperBound, _maxTicks) {
    // Copied from https://gist.github.com/igodorogea/4f42a95ea31414c3a755a8b202676dfd

    var maxTicks = _maxTicks || 10;
    var tickSpacing;
    var range;
    var niceLowerBound;
    var niceUpperBound;

    calculate();

    this.setMaxTicks = function (_maxTicks) {
        maxTicks = _maxTicks;
        calculate();
    };

    this.getNiceUpperBound = function() {
        return niceUpperBound;
    };

    this.getNiceLowerBound = function() {
        return niceLowerBound;
    };

    this.getTickSpacing = function() {
        return tickSpacing;
    };

    function setMinMaxPoints (min, max) {
        lowerBound = min;
        upperBound = max;
        calculate();
    }

    function calculate () {
        range = niceNum(upperBound - lowerBound, false);
        tickSpacing = niceNum(range / (maxTicks - 1), true);
        niceLowerBound = Math.floor(lowerBound / tickSpacing) * tickSpacing;
        niceUpperBound = Math.ceil(upperBound / tickSpacing) * tickSpacing;
    }

    function niceNum (range, round) {
        var exponent = Math.floor(Math.log10(range));
        var fraction = range / Math.pow(10, exponent);
        var niceFraction;

        if (round) {
            if (fraction < 1.5) niceFraction = 1;
            else if (fraction < 3) niceFraction = 2;
            else if (fraction < 7) niceFraction = 5;
            else niceFraction = 10;
        } else {
            if (fraction <= 1) niceFraction = 1;
            else if (fraction <= 2) niceFraction = 2;
            else if (fraction <= 5) niceFraction = 5;
            else niceFraction = 10;
        }

        return niceFraction * Math.pow(10, exponent);
    }
}
