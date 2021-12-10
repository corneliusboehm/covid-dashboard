const COLORS = palette('mpn65', 65);
const LINE_STYLES = [
    [],
    [5, 2],
    [1, 1],
    [10, 2, 2, 2],
];

let graph;
let datasets = {};
let currentCategories = [];


$(document).ready( function () {
    // Set explicit background color for chart, important for PNG export
    Chart.plugins.register({
        beforeDraw: function(chartInstance) {
            var ctxInstance = chartInstance.chart.ctx;
            ctxInstance.fillStyle = 'white';
            ctxInstance.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
        }
    });

    // Setup graph
    let ctx = document.getElementById('graph').getContext('2d');
    ctx.canvas.height = 400;

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
                    ticks: {
                        callback: function(value, index, values) {
                            // Block decimal ticks when panning or zooming
                            if (typeof value === 'string' || Number.isInteger(value)) {
                                return value;
                            }
                        }
                    }
                }],
                yAxes: [{
                    type: 'linear',
                    scaleLabel: {
                        display: true,
                        labelString: 'Total number of cases'
                    },
                }]
            },
            maintainAspectRatio: false,
            tooltips: {
                mode: 'nearest',
                callbacks: {
                    title: function (tooltips, data) {
                        return new Date(tooltips[0].label).toLocaleDateString(
                            "en-US",
                            { year: 'numeric', month: 'short', day: 'numeric' }
                        );
                    },
                    label: function (tooltip, data) {
                        let dataset = data.datasets[tooltip.datasetIndex];
                        let value = parseFloat(tooltip.value);
                        value = Math.round((value + Number.EPSILON) * 100) / 100;
                        value = value.toLocaleString('en-US');
                        return dataset.label + " [" + dataset.category + "]: " + value;
                    }
                }
            },
            plugins: {
                zoom: {
                    // Container for pan options
                    pan: {
                        // Boolean to enable panning
                        enabled: true,

                        // Panning directions
                        mode: 'x',

                        rangeMin: {
                            x: null,
                        },
                        rangeMax: {
                            x: null,
                        },

                        // On category scale, factor of pan velocity
                        speed: 20,

                        // Minimal pan distance required before actually applying pan
                        threshold: 10,

                        // Function called while the user is panning
                        onPan: adjustYScale,
                        // Function called once panning is completed
                        onPanComplete: null
                    },

                    // Container for zoom options
                    zoom: {
                        // Boolean to enable zooming
                        enabled: true,

                        // Zooming directions
                        mode: 'x',

                        rangeMin: {
                            x: null,
                        },
                        rangeMax: {
                            x: null,
                        },

                        // Speed of zoom via mouse wheel
                        // (percentage of zoom on a wheel event)
                        speed: 0.1,

                        // Minimal zoom distance required before actually applying zoom
                        threshold: 2,

                        // On category scale, minimal zoom level before actually applying zoom
                        sensitivity: 3,

                        // Function called while the user is zooming
                        onZoom: adjustYScale,
                        // Function called once zooming is completed
                        onZoomComplete: null
                    }
                },
                deferred: {
                    yOffset: '50%', // defer until 50% of the canvas height are inside the viewport
                    delay: 300      // delay after the canvas is considered inside the viewport
                }
            }
        }
    } );

    // Enable tooltips
    $('[data-toggle="tooltip"]').tooltip()

    // Setup "Reset Zoom" button
    $('#buttonResetZoom').click( function () {
        graph.resetZoom();
        $('#buttonResetZoom').prop('disabled', true);
    });

    // Setup "Share URL" button
    let clipboard = new ClipboardJS('#buttonShare', {
        text: function(trigger) {
            return window.location.href;
        }
    });

    clipboard.on('success', function(e) {
        // Show success alert
        $('#alertURLSuccess').fadeIn('fast');
        setTimeout('$("#alertURLSuccess").fadeOut("fast")', 2000);
    });

    clipboard.on('error', function(e) {
        // Show error alert
        $('#alertURLError').fadeIn('fast');
        setTimeout('$("#alertURLError").fadeOut("fast")', 2000);
    });

    // Setup "Download Image" button
    $('#buttonDownloadImg').click( function () {
        let img = graph.toBase64Image();
        let dlLink = document.createElement('a');
        dlLink.download = 'COVID-19-graph';
        dlLink.href = img;
        dlLink.dataset.downloadurl = ['image/png', dlLink.download, dlLink.href].join(':');

        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
    } );
} );


function generateUniqueLabels(x) {
    let labels = [];

    // Create country labels
    for (const name in datasets) {
        let baseColor = COLORS[datasets[name].colorIdx];

        labels.push({
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

    // Add some space
    labels.push({
        text: '',
        fillStyle: 'rgba(0, 0, 0, 0.0)',
        hidden: false,
        lineCap: 'butt',
        lineDash: [],
        lineDashOffset: 0,
        lineJoin: 'miter',
        lineWidth: 3,
        strokeStyle: 'rgba(0, 0, 0, 0)',
        pointStyle: null,
        rotation: null
    });

    // Create category labels
    for (idx = 0; idx < currentCategories.length; idx++) {
        labels.push({
            text: currentCategories[idx],
            fillStyle: 'rgba(0, 0, 0, 0)',
            hidden: false,
            lineCap: 'butt',
            lineDash: LINE_STYLES[idx],
            lineDashOffset: 0,
            lineJoin: 'miter',
            lineWidth: 3,
            strokeStyle: 'rgba(0.2, 0.2, 0.2, 0.5)',
            pointStyle: null,
            rotation: null
        });
    }

    return labels;
}


function createDataset(country, category, metric, relative, smoothed) {
    let colorIdx = 0;

    if (!(country in datasets)) {
        // Find next free color index
        let colorIndices = Array.from(Object.values(datasets),
                                      function(dataset) {return dataset.colorIdx});
        let numDatasets = Object.keys(datasets).length;
        if (numDatasets > 0) {
            colorIdx = [...Array(numDatasets + 1).keys()].find(function(idx) {
                return !colorIndices.includes(idx);
            }) % COLORS.length;
        }

        datasets[country] = {
            categories: {},
            colorIdx: colorIdx,
            metric: metric,
            relative: relative,
            smoothed: smoothed
        };
    } else {
        colorIdx = datasets[country].colorIdx;
    }

    // Create dataset
    let baseColor = COLORS[colorIdx];
    let countryData = getCountryData(country, category, metric, relative, smoothed);

    let dataset = {
        label: country,
        data: countryData,
        fill: false,
        borderColor: hexToRGBA(baseColor, 0.7),
        pointBackgroundColor: hexToRGBA(baseColor, 1),
        pointBorderColor: hexToRGBA(baseColor, 1),
        pointRadius: 0,
        pointHoverRadius: 3,
        pointHitRadius: 3,
        borderDash: function() {
            return LINE_STYLES[currentCategories.findIndex(c => c === category)];
        },
        category: category,
    };

    datasets[country].categories[category] = dataset;

    return dataset;
}


function updateDataset(country, selectedCategories, metric, relative, smoothed) {
    let dataset = datasets[country];

    if (!arrayEqual(selectedCategories, Object.keys(dataset.categories))) {
        // Prevent weird error that happens when categories and smoothed change at same time
        // by clearing the datasets with their meta information
        dataset.categories = {};
    } else {
        for (const category in dataset.categories) {
            dataset.categories[category].data = getCountryData(
                country,
                category,
                metric,
                relative,
                smoothed,
            );
        }
    }

    dataset.relative = relative;
    dataset.metric = metric;
    dataset.smoothed = smoothed;
}


function updateGraph(data,
                     selectedCountries,
                     selectedCategories,
                     selectedMetric,
                     relative,
                     logScale,
                     smoothed)
{
    graph.data.datasets = [];
    currentCategories = selectedCategories;

    // Apply scale
    if (logScale) {
        graph.options.scales.yAxes[0].type = 'logarithmic';
    } else {
        graph.options.scales.yAxes[0].type = 'linear';
    }

    // Remove old datasets
    for (const country in datasets) {
        if (!selectedCountries.includes(country)) {
            delete datasets[country];
        } else {
            for (const category in datasets[country].categories) {
                if (!selectedCategories.includes(category)) {
                    delete datasets[country].categories[category];
                }
            }
        }
    }

    // Add new datasets
    for (const country of selectedCountries) {

        // Check for correct options
        if (country in datasets
            && (datasets[country].metric !== selectedMetric
                || datasets[country].relative !== relative
                || datasets[country].smoothed !== smoothed))
        {
            updateDataset(country, selectedCategories, selectedMetric, relative, smoothed);
        }

        // Check for categories
        for (const category of selectedCategories) {
            if (country in datasets && category in datasets[country].categories) {
                graph.data.datasets.push(datasets[country].categories[category]);
            } else {
                graph.data.datasets.push(createDataset(
                    country,
                    category,
                    selectedMetric,
                    relative,
                    smoothed,
                ));
            }
        }
    }

    // Update labels
    graph.data.labels = Array.from(data.deaths.dates, date => new Date(date));

    if (smoothed) {
        graph.data.labels = graph.data.labels.slice(3, -3);
    }

    // Update axis label
    let yLabel;
    if (selectedMetric === 'total') {
        yLabel = 'Total number of cases';
    } else {
        yLabel = 'Daily new cases';
    }

    if (relative) {
        yLabel += ' per 100k inhabitants';
    }
    
    if (smoothed) {
        yLabel += ' (smoothed)';
    }

    graph.options.scales.yAxes[0].scaleLabel.labelString = yLabel;

    // Update pan/zoom ranges
    let labels = graph.data.labels;
    let numLabels = labels.length;
    graph.options.plugins.zoom.pan.rangeMin.x = labels[0];
    graph.options.plugins.zoom.pan.rangeMax.x = labels[numLabels - 1];
    graph.options.plugins.zoom.zoom.rangeMin.x = labels[0];
    graph.options.plugins.zoom.zoom.rangeMax.x = labels[numLabels - 1];

    // Reset zoom and update graph
    graph.resetZoom();
    $('#buttonResetZoom').prop('disabled', true);
}


function adjustYScale({chart}) {
    // Hide "Zoom me" alert and enable "Reset zoom" button
    $('#zoomMe').fadeOut(200);
    $('#buttonResetZoom').prop('disabled', false);

    // Get axes
    let xAxis = chart.scales['x-axis-0'];
    let yAxis = chart.scales['y-axis-0'];

    // Get currently visible segment on the x-axis
    let labels = chart.data.labels;
    let xMin, xMax;
    if (labels == null) {
        // Numerical scale
        xMin = Math.floor(xAxis.min);
        xMax = Math.ceil(xAxis.max);
    } else {
        // Time scale
        let axisMin = new Date(xAxis.min);
        xMin = labels.findIndex(function(date) {
            return date > axisMin;
        } );
        xMin = xMin > 0 ? xMin - 1 : xMin;
        xMin = xMin < 0 ? 0 : xMin;

        let axisMax = new Date(xAxis.max)
        xMax = labels.findIndex(function(date) {
            return date >= axisMax;
        } );
        xMax = xMax < 0 ? labels.length - 1 : xMax;
    }

    let yMin = Infinity;
    let yMax = -Infinity;

    // Find minimum and maximum value in visible parts of datasets
    for (dataset of chart.data.datasets) {
        let slice = dataset.data.slice(xMin, xMax + 1);

        if (slice.length > 0 && typeof slice[0] === 'object') {
            // Get y-value from scatter points
            slice = slice.map(p => p.y);
        }

        let sliceMin = Math.min(...slice);
        let sliceMax = Math.max(...slice);

        if (sliceMin < yMin) {
            yMin = sliceMin;
        }
        if (sliceMax > yMax) {
            yMax = sliceMax;
        }
    }

    // Find values for min and max so that ticks can be displayed nicely
    let niceScale = new NiceScale(yMin, yMax, chart.options.scales.yAxes[0].ticks.maxTicksLimit);
    yAxis.options.ticks.min = niceScale.getNiceLowerBound();
    yAxis.options.ticks.max = niceScale.getNiceUpperBound();

    chart.update();
}
