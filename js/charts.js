const chart = require('chart.js');
const Papa = require('papaparse');

Papa.parse("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv", {
	download: true,
	header: true,
	dynamicTyping: true,
	complete: function(results) {
		showData(results.data, results.meta);
	}
});


function findCountry(row, state, country) {
    return row['Province/State'] === state && row['Country/Region'] === country;
}

function getCountryData(data, dates, state, country) {
    var dataCountry = data.find(row => findCountry(row, state, country));
    return Array.from(dates, x => dataCountry[x]);
}

function showData(data, meta) {
    console.log(data)

    var ctx = document.getElementById('myChart').getContext('2d');

    var dates = meta.fields.slice(meta.fields.indexOf('1/22/20'), meta.fields.length);
    var numbersGermany = getCountryData(data, dates, null, 'Germany');
    var numbersChina = getCountryData(data, dates, 'Hubei', 'China');
    var numbersFrance = getCountryData(data, dates, 'France', 'France');
    var numbersItaly = getCountryData(data, dates, null, 'Italy');

    var myChart = new chart.Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Germany',
                    data: numbersGermany,
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 0.7)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: 'rgba(255, 99, 132, 1)'
                },
                {
                    label: 'France, France',
                    data: numbersFrance,
                    fill: false,
                    borderColor: 'rgba(54, 162, 235, 0.7)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: 'rgba(54, 162, 235, 1)'
                },
                {
                    label: 'Hubei, China',
                    data: numbersChina,
                    fill: false,
                    borderColor: 'rgba(255, 206, 86, 0.7)',
                    pointBackgroundColor: 'rgba(255, 206, 86, 1)',
                    pointBorderColor: 'rgba(255, 206, 86, 1)'
                },
                {
                    label: 'Italy',
                    data: numbersItaly,
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 0.7)',
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    pointBorderColor: 'rgba(75, 192, 192, 1)'
                }
            ]
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
            }
        }
    });
};
