const colors = palette('mpn65', 65);

let graph;
let datasets = {}


$(document).ready( function () {
    let ctx = document.getElementById('graph').getContext('2d');
    ctx.canvas.width = window.innerWidth * 0.9
    ctx.canvas.height = window.innerHeight * 0.5

    graph = new Chart(ctx, {
        type: 'line',
        options: {
            title: {
                display: true,
                text: 'Deaths',
                fontSize: 24
            },
            layout: {
                padding: {
                    left: 50,
                    right: 50,
                    top: 0,
                    bottom: 0
                }
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }]
            }
        }
    } );
} );


function getDisplayName(country, state) {
    if (state) {
        return country + ", " + state;
    } else {
        return country;
    }
}


function createDataset(country, state) {
    // Find next free color index
    let colorIndices = Array.from(Object.values(datasets), function(dataset) {return dataset.colorIdx});
    let numDatasets = Object.keys(datasets).length;
    let colorIdx = 0;
    if (numDatasets > 0) {
        colorIdx = [...Array(numDatasets + 1).keys()].find(function(idx) {
            return !colorIndices.includes(idx);
        }) % colors.length;
    }

    // Create dataset
    let baseColor = colors[colorIdx];
    let displayName = getDisplayName(country, state);
    let countryData = getCountryData(state, country, 'deaths');

    let dataset = {
        label: displayName,
        data: countryData,
        fill: false,
        borderColor: hexToRGBA(baseColor, 0.7),
        pointBackgroundColor: hexToRGBA(baseColor, 1),
        pointBorderColor: hexToRGBA(baseColor, 1)
    };

    datasets[displayName] = {
        dataset: dataset,
        colorIdx: colorIdx
    };

    return dataset;
}


function updateGraph(data, selectedCountries) {
    graph.data.labels = Array.from(data.deaths.dates, date => new Date(date));
    graph.data.datasets = []

    // Remove old datasets
    let displayNames = Array.from(Object.keys(selectedCountries),
                                  country => getDisplayName(country, selectedCountries[country]));
    for (const name in datasets) {
        if (!displayNames.includes(name)) {
            delete datasets[name];
        }
    }

    // Add new datasets
    for (const country in selectedCountries) {
        let state = selectedCountries[country];
        let displayName = getDisplayName(country, state);

        if (displayName in datasets) {
            graph.data.datasets.push(datasets[displayName].dataset);
        } else {
            graph.data.datasets.push(createDataset(country, state));
        }
    }

    graph.update();
}
