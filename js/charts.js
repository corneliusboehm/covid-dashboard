const chart = require('chart.js');
const Papa = require('papaparse');
const palette = require('google-palette');

var myChart;
var data;
var dates;
var colors = palette('mpn65', 65);

let defaultCountries = {
    Germany: null,
    China: 'Hubei',
    France: 'France',
    Italy: null,
    US: null
}

$(document).ready( function () {
    Papa.parse("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv", {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            data = results.data;
            dates = results.meta.fields.slice(results.meta.fields.indexOf('1/22/20'), results.meta.fields.length);

            var table = $('#countrySelection').DataTable({
                "scrollY": "300px",
                "scrollCollapse": true,
                "paging": false
            });

            $('#countrySelection tbody').on( 'click', 'tr', function () {
                $(this).toggleClass('table-primary');
                selected = $(this).hasClass('table-primary')
                updateGraph(table.row(this).data(), selected);
            } );

            showGraph();
            showCountrySelection(table, results.data);
        }
    });
} );


function hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);

    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}


function addToGraph(country, state) {
    var countryData = getCountryData(state, country);
    var baseColor = colors[myChart.data.datasets.length % colors.length]

    myChart.data.datasets.push({
        label: country,
        data: countryData,
        fill: false,
        borderColor: hexToRGBA(baseColor, 0.7),
        pointBackgroundColor: hexToRGBA(baseColor, 1),
        pointBorderColor: hexToRGBA(baseColor, 1)
    });

    myChart.update();
}


function updateGraph(row, selected) {
    if (selected) {
        addToGraph(row[0], row[1])
    } else {
        // TODO: Remove entry
    }
}


function showCountrySelection(table, data) {
    var rowIdx;
    for (rowIdx in data) {
        var row = data[rowIdx];
        state = row['Province/State'];
        country = row['Country/Region'];

        rowNode = table.row.add([country, state]).node();

        if (country in defaultCountries && defaultCountries[country] === state) {
            $(rowNode).addClass('table-primary');
            addToGraph(country, state);
        }
    }

    table.draw(true)
}


function findCountry(row, state, country) {
    return row['Province/State'] === state && row['Country/Region'] === country;
}

function getCountryData(state, country) {
    var dataCountry = data.find(row => findCountry(row, state, country));
    return Array.from(dates, x => dataCountry[x]);
}

function showGraph() {
    var ctx = document.getElementById('myChart').getContext('2d');
    ctx.canvas.width = window.innerWidth * 0.9
    ctx.canvas.height = window.innerHeight * 0.3

    var dateLabels = Array.from(dates, date => new Date(date));

    myChart = new chart.Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: []
        },
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
    });
};
