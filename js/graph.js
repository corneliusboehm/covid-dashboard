const colors = palette('mpn65', 65);
const lineStyles = {
    deaths: [],
    confirmed: [5, 2],
    recovered: [1, 1]
};

let graph;
let datasets = {}


$(document).ready( function () {
    let ctx = document.getElementById('graph').getContext('2d');
    ctx.canvas.height = 400

    graph = new Chart(ctx, {
        type: 'line',
        options: {
            legend: {
                display: true,
                labels: {
                    generateLabels: generateUniqueLabels
                },
                onClick: null
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    scaleLabel: {
                        display: false,
                        labelString: '# of days after 10th death case'
                    }
                }],
                yAxes: [{
                    type: 'linear'
                }]
            },
            maintainAspectRatio: false
        }
    } );

    $('[data-toggle="tooltip"]').tooltip()
} );


function generateUniqueLabels(x) {
    let labels = [];

    for (const name in datasets) {
        let baseColor = colors[datasets[name].colorIdx];

        labels .push({
            text: name,
            fillStyle: hexToRGBA(baseColor, 0.7),
            hidden: false,
            lineCap: 'butt',
            lineDash: [],
            lineDashOffset: 0,
            lineJoin: 'miter',
            lineWidth: 3,
            strokeStyle: hexToRGBA(baseColor, 0.7),
            pointStyle: null,
            rotation: null
        });
    }

    return labels;
}


function getDisplayName(country, state) {
    if (state) {
        return country + ", " + state;
    } else {
        return country;
    }
}


function createDataset(country, state, category, mode, aligned) {
    let displayName = getDisplayName(country, state);
    let colorIdx = 0;

    if (!(displayName in datasets)) {
        // Find next free color index
        let colorIndices = Array.from(Object.values(datasets), function(dataset) {return dataset.colorIdx});
        let numDatasets = Object.keys(datasets).length;
        if (numDatasets > 0) {
            colorIdx = [...Array(numDatasets + 1).keys()].find(function(idx) {
                return !colorIndices.includes(idx);
            }) % colors.length;
        }

        datasets[displayName] = {
            categories: {},
            colorIdx: colorIdx,
            mode: mode,
            aligned: aligned
        };
    } else {
        colorIdx = datasets[displayName].colorIdx;
    }

    // Create dataset
    let baseColor = colors[colorIdx];
    let countryData = getCountryData(state, country, category, mode, aligned);

    let dataset = {
        label: displayName,
        data: countryData,
        fill: false,
        borderColor: hexToRGBA(baseColor, 0.7),
        pointBackgroundColor: hexToRGBA(baseColor, 1),
        pointBorderColor: hexToRGBA(baseColor, 1),
        pointRadius: 0,
        pointHoverRadius: 0,
        borderDash: lineStyles[category]
    };

    datasets[displayName].categories[category] = dataset;

    return dataset;
}


function updateDataset(country, state, mode, aligned) {
    let displayName = getDisplayName(country, state);
    let dataset = datasets[displayName];

    for (const category in dataset.categories) {
        dataset.categories[category].data = getCountryData(state, country, category, mode, aligned);
    }

    dataset.mode = mode;
    dataset.aligned = aligned;
}


function updateGraph(data, selectedCountries, selectedCategories, selectedMode, logScale, aligned) {
    graph.data.datasets = [];

    // Apply scale
    if (logScale) {
        graph.options.scales.yAxes[0].type = 'logarithmic';
    } else {
        graph.options.scales.yAxes[0].type = 'linear';
    }

    // Remove old datasets
    let displayNames = Array.from(Object.keys(selectedCountries),
                                  country => getDisplayName(country, selectedCountries[country]));
    for (const name in datasets) {
        if (!displayNames.includes(name)) {
            delete datasets[name];
        } else {
            for (const category in datasets[name].categories) {
                if (!selectedCategories.includes(category)) {
                    delete datasets[name].categories[category];
                }
            }

            if (jQuery.isEmptyObject(datasets[name].categories)) {
                delete datasets[name];
            }
        }
    }

    // Add new datasets
    for (const country in selectedCountries) {
        let state = selectedCountries[country];
        let displayName = getDisplayName(country, state);

        // Check for correct mode
        if (displayName in datasets
            && (datasets[displayName].mode !== selectedMode || datasets[displayName].aligned !== aligned))
        {
            updateDataset(country, state, selectedMode, aligned);
        }

        // Check for categories
        for (const category of selectedCategories) {
            if (displayName in datasets && category in datasets[displayName].categories) {
                graph.data.datasets.push(datasets[displayName].categories[category]);
            } else {
                graph.data.datasets.push(createDataset(country, state, category, selectedMode, aligned));
            }
        }
    }

    // Change labels for aligned mode
    if (aligned) {
        let maxLen = 0;
        for (const dataset of Object.values(datasets)) {
            for (const category of Object.values(dataset.categories)) {
                if (category.data.length > maxLen) {
                    maxLen = category.data.length;
                }
            }
        }
        graph.options.scales.xAxes[0].type = 'category';
        graph.options.scales.xAxes[0].scaleLabel.display = true;
        graph.data.labels = [...Array(maxLen).keys()];
    } else {
        graph.options.scales.xAxes[0].type = 'time';
        graph.options.scales.xAxes[0].scaleLabel.display = false;
        graph.data.labels = Array.from(data.deaths.dates, date => new Date(date));
    }

    graph.update();
}
