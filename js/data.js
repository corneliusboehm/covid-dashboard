const baseDataURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/";
const firstDate = "1/22/20";
const categories = ["deaths", "confirmed", "recovered"];

let selectedCountries = {
    _World: null,
    Germany: null,
    China: 'Hubei',
    Italy: null,
    US: null
};

let logScale = false;

let selectedCategories = ["deaths"];

let selectedMode = 'absolute';

let aligned = false;

let table;
let data = {
    total: {},
    trend: {}
};
let population;

let populationNameDict = {
    'Bolivia': 'Bolivia (Plurinational State of)',
    'Brunei': 'Brunei Darussalam',
    'Burma': 'Myanmar',
    'Congo (Brazzaville)': 'Congo',
    'Congo (Kinshasa)': 'Congo (Democratic Republic of the)',
    'Cote d\'Ivoire': 'Côte d\'Ivoire',
    'Czechia': 'Czech Republic',
    'Eswatini': 'Swaziland',
    'Iran': 'Iran (Islamic Republic of)',
    'Korea, South': 'Korea (Republic of)',
    'Kosovo': 'Republic of Kosovo',
    'Laos': 'Lao People\'s Democratic Republic',
    'Moldova': 'Moldova (Republic of)',
    'North Macedonia': 'Macedonia (the former Yugoslav Republic of)',
    'Russia': 'Russian Federation',
    'Syria': 'Syrian Arab Republic',
    'Taiwan*': 'Taiwan',
    'Tanzania': 'Tanzania, United Republic of',
    'United Kingdom': 'United Kingdom of Great Britain and Northern Ireland',
    'US': 'United States of America',
    'Venezuela': 'Venezuela (Bolivarian Republic of)',
    'Vietnam': 'Viet Nam',
    'West Bank and Gaza': 'Palestine, State of'
}


$(document).ready( function () {
    // Load COVID data
    for (const category of categories) {
        loadCSV(category, "time_series_covid19_" + category + "_global.csv");
    }

    // Load population data
    $.getJSON('https://restcountries.eu/rest/v2/all?fields=name;population', function(populationData) {
        population = populationData;
        updateData();
    } );

    // Initialize country selection table
    table = $('#countryTable').DataTable({
        "scrollX": true,
        "scrollY": "300px",
        "scrollCollapse": true,
        "paging": false,
        "order": [[8, 'desc'], [ 0, 'asc' ], [ 1, 'asc' ]],
        "columnDefs": [
            { "visible": false, "targets": 8 }
        ]
    } );

    $('#countryTable tbody').on( 'click', 'tr', function () {
        let selected = !($(this).hasClass('table-primary'));
        let rowData = table.row(this).data();
        let country = rowData[0];
        let state = rowData[1];

        if (selected) {
            selectedCountries[country] = state;
        } else {
            delete selectedCountries[country];
        }

        updateSelected();
    } );


    // Log-scale button
    $('#buttonLog').click( function () {
        $(this).toggleClass('btn-info');
        $(this).toggleClass('btn-secondary');
        logScale = ($(this).hasClass('btn-info'));

        updateSelected();
    } );


    // Category buttons
    $('#buttonConfirmed').click( function () {
        $(this).toggleClass('btn-info');
        $(this).toggleClass('btn-secondary');
        let selected = ($(this).hasClass('btn-info'));
        const value = 'confirmed'

        if (selected) {
            selectedCategories.push(value);
        } else {
            selectedCategories = selectedCategories.filter(category => category !== value)
        }

        updateSelected();
    } );

    $('#buttonDeaths').click( function () {
        $(this).toggleClass('btn-info');
        $(this).toggleClass('btn-secondary');
        let selected = ($(this).hasClass('btn-info'));
        const value = 'deaths'

        if (selected) {
            selectedCategories.push(value);
        } else {
            selectedCategories = selectedCategories.filter(category => category !== value)
        }

        updateSelected();
    } );

    $('#buttonRecovered').click( function () {
        $(this).toggleClass('btn-info');
        $(this).toggleClass('btn-secondary');
        let selected = ($(this).hasClass('btn-info'));
        const value = 'recovered'

        if (selected) {
            selectedCategories.push(value);
        } else {
            selectedCategories = selectedCategories.filter(category => category !== value)
        }

        updateSelected();
    } );


    // Absolute vs relative vs change radio buttons
    $('#radioAbsolute').click( function () {
        if (selectedMode !== 'absolute') {
            $(this).removeClass('btn-secondary');
            $(this).addClass('btn-info');

            let radioRelative = $('#radioRelative');
            let radioChangeAbsolute = $('#radioChangeAbsolute');
            let radioChangeRelative = $('#radioChangeRelative');
            radioRelative.removeClass('btn-info');
            radioChangeAbsolute.removeClass('btn-info');
            radioChangeRelative.removeClass('btn-info');
            radioRelative.addClass('btn-secondary');
            radioChangeAbsolute.addClass('btn-secondary');
            radioChangeRelative.addClass('btn-secondary');

            selectedMode = 'absolute';

            updateSelected();
        }
    } );

    $('#radioRelative').click( function () {
        if (selectedMode !== 'relative') {
            $(this).removeClass('btn-secondary');
            $(this).addClass('btn-info');

            let radioAbsolute = $('#radioAbsolute');
            let radioChangeAbsolute = $('#radioChangeAbsolute');
            let radioChangeRelative = $('#radioChangeRelative');
            radioAbsolute.removeClass('btn-info');
            radioChangeAbsolute.removeClass('btn-info');
            radioChangeRelative.removeClass('btn-info');
            radioAbsolute.addClass('btn-secondary');
            radioChangeAbsolute.addClass('btn-secondary');
            radioChangeRelative.addClass('btn-secondary');

            selectedMode = 'relative';

            updateSelected();
        }
    } );

    $('#radioChangeAbsolute').click( function () {
        if (selectedMode !== 'change-absolute') {
            $(this).removeClass('btn-secondary');
            $(this).addClass('btn-info');

            let radioAbsolute = $('#radioAbsolute');
            let radioRelative = $('#radioRelative');
            let radioChangeRelative = $('#radioChangeRelative');
            radioAbsolute.removeClass('btn-info');
            radioRelative.removeClass('btn-info');
            radioChangeRelative.removeClass('btn-info');
            radioAbsolute.addClass('btn-secondary');
            radioRelative.addClass('btn-secondary');
            radioChangeRelative.addClass('btn-secondary');

            selectedMode = 'change-absolute';

            updateSelected();
        }
    } );

    $('#radioChangeRelative').click( function () {
        if (selectedMode !== 'change-relative') {
            $(this).removeClass('btn-secondary');
            $(this).addClass('btn-info');

            let radioAbsolute = $('#radioAbsolute');
            let radioRelative = $('#radioRelative');
            let radioChangeAbsolute = $('#radioChangeAbsolute');
            radioAbsolute.removeClass('btn-info');
            radioRelative.removeClass('btn-info');
            radioChangeAbsolute.removeClass('btn-info');
            radioAbsolute.addClass('btn-secondary');
            radioRelative.addClass('btn-secondary');
            radioChangeAbsolute.addClass('btn-secondary');

            selectedMode = 'change-relative';

            updateSelected();
        }
    } );


    // Aligned button
    $('#buttonAligned').click( function () {
        $(this).toggleClass('btn-info');
        $(this).toggleClass('btn-secondary');
        aligned = ($(this).hasClass('btn-info'));

        updateSelected();
    } );
} );


function loadCSV(category, file) {
    let results = Papa.parse(baseDataURL + file, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            let fields =  results.meta.fields;
            let dates = fields.slice(fields.indexOf(firstDate), fields.length)

            data[category] = {
                data: results.data,
                dates: dates
            };

            updateData();
        }
    } );
}


function updateData() {
    if (categories.every(category => category in data) && population) {
        aggregateData();
        updateHeader();
        updateTableData();
    }
}


function aggregateData() {
    for (const category of categories) {
        let categoryData = data[category];
        let dates = categoryData.dates;

        // Sum up global data
        let globalData = Object.fromEntries(dates.map(date => [date, 0]));
        for (const row of categoryData.data) {
            for (const date of dates) {
                globalData[date] += row[date];
            }
        }

        globalData['Province/State'] = null;
        globalData['Country/Region'] = '_World';
        categoryData.data.push(globalData);

        let globalPopulation = 0;
        for (const entry of population) {
            globalPopulation += entry.population
        }
        population.push({
            name: '_World',
            population: globalPopulation
        });

        // Save total
        data.total[category] = globalData[dates[dates.length - 1]];

        // Calculate trend over last three days
        let diffs = [];
        for (let idx = dates.length - 3; idx < dates.length; idx++) {
            diffs.push(globalData[dates[idx]] - globalData[dates[idx - 1]]);
        }
        data.trend[category] = Math.round(diffs.reduce((a,b) => a + b, 0) / diffs.length);
    }
}


function updateHeader() {
    for (const category of categories) {
        let total = data.total[category].toLocaleString('en-US');
        let trend = data.trend[category].toLocaleString('en-US');
        if (data.trend[category] >= 0) {
            trend = "+" + trend;
        }
        $('#' + category + 'Header').html(total + " (" + trend + ")");
    }
}


function updateTableData() {
    let lastDate = data.deaths.dates[data.deaths.dates.length - 1];
    for (const row of data.deaths.data) {
        let state = row['Province/State'];
        let country = row['Country/Region'];

        let popName = populationNameDict.hasOwnProperty(country) ? populationNameDict[country] : country;
        let pop = population.find(function(entry) {
            // TODO: How to handle states?
            return entry.name === popName;
        } );

        if (pop != null) {
            pop = pop.population;
        } else {
            console.log('Population data not found: ', country);
        }

        let deaths = row[lastDate];
        let deathsRelative = '';
        if (pop != null) {
            deathsRelative = Math.round((deaths / pop) * 10000) / 100 + '%';
        }

        let confirmed = getCountryData(state, country, 'confirmed', 'absolute', false);
        let confirmedRelative = '';
        if (confirmed != null) {
            confirmed = confirmed[confirmed.length - 1];

            if (pop != null) {
                confirmedRelative = Math.round((confirmed / pop) * 10000) / 100 + '%';
            }
        } else {
            confirmed = 0;
        }

        let recovered = getCountryData(state, country, 'recovered', 'absolute', false);
        let recoveredRelative = ''
        if (recovered != null) {
            recovered = recovered[recovered.length - 1];

            if (pop != null) {
                recoveredRelative = Math.round((recovered / pop) * 10000) / 100 + '%';
            }
        } else {
            recovered = 0;
        }

        rowNode = table.row.add([
            country,
            state,
            confirmed.toLocaleString('en-US'),
            deaths.toLocaleString('en-US'),
            recovered.toLocaleString('en-US'),
            confirmedRelative,
            deathsRelative,
            recoveredRelative,
            0
        ]).node();

        // TODO: Use row().child() for adding children to a row
    }

    table.draw(true);

    // Show default selected countries
    updateSelected();
}


function updateSelected() {
    updateTableHighlights();
    updateButtons();
    updateGraph(data, selectedCountries, selectedCategories, selectedMode, logScale, aligned);
}


function updateTableHighlights() {
    table.rows().every(function() {
        let rowData = this.data();
        let country = rowData[0];
        let state = rowData[1];

        if (country in selectedCountries && selectedCountries[country] === state) {
            $(this.node()).addClass('table-primary');
            rowData[8] = 1;
        } else {
            $(this.node()).removeClass('table-primary');
            rowData[8] = 0;
        }
    })

    table.rows().invalidate().draw(true);
}


function updateButtons() {
    // TODO
}


function getCountryData(state, country, category, mode, aligned) {
    let dataCountry = data[category].data.find(function(row) {
        return row['Province/State'] === state && row['Country/Region'] === country;
    } );

    if (!dataCountry) {
        console.log('Data not found: ', state, country, category)
        return null;
    }

    let dataArray = Array.from(data[category].dates, date => dataCountry[date]);
    let dataArrayBefore;

    switch (mode) {
        case 'absolute':
            return dataArray;

        case 'relative':
            // TODO: Implement
            return null;

        case 'change-absolute':
            dataArrayBefore = dataArray.slice(0, dataArray.length - 1);
            dataArrayBefore.unshift(0);
            return tf.sub(tf.tensor(dataArray), tf.tensor(dataArrayBefore)).arraySync();

        case 'change-relative':
            dataArrayBefore = dataArray.slice(0, dataArray.length - 1);
            dataArrayBefore.unshift(0);
            let dataTensor = tf.tensor(dataArray);
            let dataTensorBefore = tf.tensor(dataArrayBefore);

            let min = 0;
            for (v of dataArray) {
                if (min == 0 || (v > 0 && v < min)) {
                    min = v;
                }
            }
            if (min == 0) {
                min = 1;
            }
            let dataTensorBeforeFilled = tf.tensor(dataArrayBefore.map(x => x == 0 ? min : x));

            return tf.div(tf.sub(dataTensor, dataTensorBefore), dataTensorBeforeFilled).arraySync();

        default:
            return null;
    }
}
