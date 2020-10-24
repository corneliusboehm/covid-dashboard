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
                    scaleLabel: {
                        display: false,
                        labelString: '# of days after 10th death case'
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
                    type: 'linear'
                }]
            },
            maintainAspectRatio: false,
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


function createDataset(country, category, metric, relative, aligned, smoothed) {
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
            aligned: aligned,
            smoothed: smoothed
        };
    } else {
        colorIdx = datasets[country].colorIdx;
    }

    // Create dataset
    let baseColor = COLORS[colorIdx];
    let countryData = getCountryData(country, category, metric, relative, aligned, smoothed);

    let dataset = {
        label: country,
        data: countryData,
        fill: false,
        borderColor: hexToRGBA(baseColor, 0.7),
        pointBackgroundColor: hexToRGBA(baseColor, 1),
        pointBorderColor: hexToRGBA(baseColor, 1),
        pointRadius: 0,
        pointHoverRadius: 0,
        borderDash: function() {
            return LINE_STYLES[currentCategories.findIndex(c => c === category)];
        }
    };

    datasets[country].categories[category] = dataset;

    return dataset;
}


function updateDataset(country, metric, relative, aligned, smoothed) {
    let dataset = datasets[country];

    for (const category in dataset.categories) {
        dataset.categories[category].data = getCountryData(
            country,
            category,
            metric,
            relative,
            aligned,
            smoothed,
        );
    }

    dataset.relative = relative;
    dataset.metric = metric;
    dataset.aligned = aligned;
    dataset.smoothed = smoothed;
}


function updateGraph(data,
                     selectedCountries,
                     selectedCategories,
                     selectedMetric,
                     relative,
                     logScale,
                     aligned,
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

            if (jQuery.isEmptyObject(datasets[country].categories)) {
                delete datasets[country];
            }
        }
    }

    // Add new datasets
    for (const country of selectedCountries) {

        // Check for correct options
        if (country in datasets
            && (datasets[country].metric !== selectedMetric
                || datasets[country].relative !== relative
                || datasets[country].aligned !== aligned
                || datasets[country].smoothed !== smoothed))
        {
            updateDataset(country, selectedMetric, relative, aligned, smoothed);
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
                    aligned,
                    smoothed,
                ));
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

        // Update axes
        graph.options.scales.xAxes[0].type = 'linear';
        graph.options.scales.xAxes[0].scaleLabel.display = true;

        // Update labels
        graph.data.labels = null;

        // Update pan/zoom ranges
        graph.options.plugins.zoom.pan.rangeMin.x = 0;
        graph.options.plugins.zoom.pan.rangeMax.x = maxLen - 1;
        graph.options.plugins.zoom.zoom.rangeMin.x = 0;
        graph.options.plugins.zoom.zoom.rangeMax.x = maxLen - 1;
    } else {
        // Update axes
        graph.options.scales.xAxes[0].type = 'time';
        graph.options.scales.xAxes[0].scaleLabel.display = false;

        // Update labels
        graph.data.labels = Array.from(data.deaths.dates, date => new Date(date));

        if (smoothed) {
            let labels = graph.data.labels;
            graph.data.labels = graph.data.labels.slice(3, -3);
        }

        // Update pan/zoom ranges
        graph.options.plugins.zoom.pan.rangeMin.x = new Date(FIRST_DATE);
        graph.options.plugins.zoom.pan.rangeMax.x = new Date(latestDate);
        graph.options.plugins.zoom.zoom.rangeMin.x = new Date(FIRST_DATE);
        graph.options.plugins.zoom.zoom.rangeMax.x = new Date(latestDate);
    }

    // Reset zoom and update graph
    graph.resetZoom();
}


function adjustYScale({chart}) {
    let xAxis = chart.scales['x-axis-0'];
    let yAxis = chart.scales['y-axis-0'];

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
