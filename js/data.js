const baseDataURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/";
const firstDate = "1/22/20";
const categories = ["deaths", "confirmed", "recovered"];

// Table status
let selectedCountries = {
    _World: null,
    Germany: null,
    China: 'Hubei',
    Italy: null,
    US: null
};

// Button group status
let logScale = false;
let selectedCategories = ["deaths"];
let selectedMode = 'absolute';
let aligned = false;
let smoothed = false;

// Data
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
        scrollX: true,
        scrollY: "300px",
        scrollCollapse: true,
        paging: false,
        order: [[8, 'desc'], [ 0, 'asc' ], [ 1, 'asc' ]],
        columnDefs: [
            { "searchable": false, "targets": [2, 3, 4, 5, 6, 7, 8] },
            { "visible": false, "targets": 8 }
        ],
        aoColumns: [
            null,
            null,
            {orderSequence: ['desc', 'asc']},
            {orderSequence: ['desc', 'asc']},
            {orderSequence: ['desc', 'asc']},
            {orderSequence: ['desc', 'asc']},
            {orderSequence: ['desc', 'asc']},
            {orderSequence: ['desc', 'asc']},
            null
        ],
        buttons: [
            {
                text: 'Show selected entries',
                action: function ( e, dt, node, config ) {
                    table.search('').order([[8, 'desc'], [ 0, 'asc' ], [ 1, 'asc' ]]).draw();
                }
            }
        ]
    } );
    table.buttons().container().appendTo( '#countryTable_wrapper .col-md-6:eq(0)' );

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
        logScale = $(this).prop('checked');
        updateSelected();
    } );


    // Category buttons
    $('#buttonConfirmed').click( function () {
        updateCategories('confirmed', $(this).prop('checked'));
        updateSelected();
    } );

    $('#buttonDeaths').click( function () {
        updateCategories('deaths', $(this).prop('checked'));
        updateSelected();
    } );

    $('#buttonRecovered').click( function () {
        updateCategories('recovered', $(this).prop('checked'));
        updateSelected();
    } );


    // Absolute vs relative vs change radio buttons
    $('#radioAbsolute').click( function () {
        selectedMode = 'absolute';
        updateSelected();
    } );

    $('#radioRelative').click( function () {
        selectedMode = 'relative';
        updateSelected();
    } );

    $('#radioChangeAbsolute').click( function () {
        selectedMode = 'change-absolute';
        updateSelected();
    } );

    $('#radioChangeRelative').click( function () {
        selectedMode = 'change-relative';
        updateSelected();
    } );


    // Aligned button
    $('#buttonAligned').click( function () {
        aligned = $(this).prop('checked');
        updateSelected();
    } );


    // Smoothed button
    $('#buttonSmoothed').click( function () {
        smoothed = $(this).prop('checked');
        updateSelected();
    } );

    initializeButtons();
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


function setButtonState(name, checked) {
    $('#button' + name).prop('checked', checked);

    let label = $('#label' + name);
    if (checked) {
        label.addClass('active');
    } else {
        label.removeClass('active');
    }
}


function initializeButtons() {
    // Log-scale button
    setButtonState('Log', logScale);

    // Category buttons
    setButtonState('Confirmed', selectedCategories.includes('confirmed'));
    setButtonState('Deaths', selectedCategories.includes('deaths'));
    setButtonState('Recovered', selectedCategories.includes('recovered'));

    // Absolute vs relative vs change radio buttons
    setButtonState('Absolute', selectedMode === 'absolute');
    setButtonState('Relative', selectedMode === 'relative');
    setButtonState('ChangeAbsolute', selectedMode === 'change-absolute');
    setButtonState('ChangeRelative', selectedMode === 'change-relative');

    // Aligned button
    setButtonState('Aligned', aligned);

    // Smoothed button
    setButtonState('Smoothed', smoothed);
}


function updateCategories(category, selected) {
    if (selected) {
        selectedCategories.push(category);
    } else {
        selectedCategories = selectedCategories.filter(cat => cat !== category);
    }
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
        let pop = getPopulation(country);

        let deaths = row[lastDate];
        let deathsRelative = '';
        if (pop != null) {
            deathsRelative = Math.round((deaths / pop) * 10000) / 100 + '%';
        }

        let confirmed = getCountryData(state, country, 'confirmed', 'absolute', false, false);
        let confirmedRelative = '';
        if (confirmed != null) {
            confirmed = confirmed[confirmed.length - 1];

            if (pop != null) {
                confirmedRelative = Math.round((confirmed / pop) * 10000) / 100 + '%';
            }
        } else {
            confirmed = 0;
        }

        let recovered = getCountryData(state, country, 'recovered', 'absolute', false, false);
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

    // Show default selected countries
    updateSelected();
    table.draw(true);
}


function updateSelected() {
    updateTableHighlights();
    updateGraph(data, selectedCountries, selectedCategories, selectedMode, logScale, aligned, smoothed);
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

    table.rows().invalidate();
}


function getPopulation(country) {
    let popName = populationNameDict.hasOwnProperty(country) ? populationNameDict[country] : country;
    let pop = population.find(function(entry) {
        // TODO: How to handle states?
        return entry.name === popName;
    } );

    if (pop != null) {
        return pop.population;
    } else {
        console.log('Population data not found: ', country);
        return null;
    }
}


function getCountryData(state, country, category, mode, aligned, smoothed) {
    let dataCountry = data[category].data.find(function(row) {
        return row['Province/State'] === state && row['Country/Region'] === country;
    } );

    if (!dataCountry) {
        console.log('Data not found: ', state, country, category)
        return null;
    }

    let dataArray = Array.from(data[category].dates, date => dataCountry[date]);
    let dataArrayBefore;
    let output;

    switch (mode) {
        case 'absolute':
            output = dataArray;
            break;

        case 'relative':
            let pop = getPopulation(country)
            output = tf.div(tf.tensor(dataArray), pop).arraySync();
            break;

        case 'change-absolute':
            dataArrayBefore = dataArray.slice(0, dataArray.length - 1);
            dataArrayBefore.unshift(0);
            output = tf.sub(tf.tensor(dataArray), tf.tensor(dataArrayBefore)).arraySync();
            break;

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

            output = tf.div(tf.sub(dataTensor, dataTensorBefore), dataTensorBeforeFilled).arraySync();
            break;

        default:
            return null;
    }

    if (smoothed) {
        let newOutput = [];
        for (idx = 3; idx < output.length - 3; idx++) {
            const sum = output.slice(idx - 3, idx + 4).reduce((a, b) => a + b, 0)
            newOutput.push(sum / 7);
        }

        output = newOutput;
    }

    if (aligned) {
        let deathData = getCountryData(state, country, 'deaths', 'absolute', false, smoothed);
        let alignmentIndex = deathData.findIndex(function(value) {
            return value >= 10;
        } );

        if (alignmentIndex >= 0) {
            output = output.slice(alignmentIndex);
        } else {
            output = [];
        }
    }

    return output;
}
