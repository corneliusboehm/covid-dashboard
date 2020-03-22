const chart = require('chart.js');
const Papa = require('papaparse');
const palette = require('google-palette');

var myChart;
var data;
var dates;
var colors = palette('mpn65', 65);
var countries = [];

let defaultCountries = {
    Germany: null,
    China: 'Hubei',
    France: 'France',
    Italy: null
}

Papa.parse("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv", {
	download: true,
	header: true,
	dynamicTyping: true,
	complete: function(results) {
	    data = results.data;
	    dates = results.meta.fields.slice(results.meta.fields.indexOf('1/22/20'), results.meta.fields.length);

		showGraph();
	    showCountrySelection(results.data);
	}
});


function hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}


function addToGraph(country) {
    var countryData = getCountryData(country.state, country.country);
    var baseColor = colors[country.idx % colors.length]

    myChart.data.datasets.push({
        label: country.name,
        data: countryData,
        fill: false,
        borderColor: hexToRGBA(baseColor, 0.7),
        pointBackgroundColor: hexToRGBA(baseColor, 1),
        pointBorderColor: hexToRGBA(baseColor, 1)
    });

    myChart.update();
}


function updateGraph(checkbox) {
    country = countries[checkbox.value];

    if (checkbox.checked) {
        addToGraph(country)
    } else {
        // TODO: Remove entry
    }
}


function showCountrySelection(data) {
    container = document.getElementById('countrySelection');

    var rowIdx;
    for (rowIdx in data) {
        var row = data[rowIdx];
        state = row['Province/State'];
        country = row['Country/Region'];

        var name;
        if (state) {
            name = state + ', ' + country;
        } else {
            name = country;
        }

        countryDict = {
            state: state,
            country: country,
            name: name,
            idx: rowIdx
        }
        countries.push(countryDict)

        var div = document.createElement('div');

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = name;
        checkbox.value = rowIdx;
        checkbox.id = name;
        checkbox.onclick = function() {updateGraph(this)};

        var label = document.createElement('label')
        label.htmlFor = name;
        label.appendChild(document.createTextNode(name));

        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);

        // Check for defaults to be enabled
        if (country in defaultCountries && defaultCountries[country] === state) {
            checkbox.checked = true;
            addToGraph(countryDict);
        }
    }
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

    var numbersGermany = getCountryData(null, 'Germany');
    var numbersChina = getCountryData('Hubei', 'China');
    var numbersFrance = getCountryData('France', 'France');
    var numbersItaly = getCountryData(null, 'Italy');

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
