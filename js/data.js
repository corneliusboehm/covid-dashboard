const baseDataURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/";
const firstDate = "1/22/20";
let latestDate = null;
const inputCategories = ["deaths", "confirmed", "recovered"];
const categories = ["deaths", "confirmed", "recovered", "active"];

// Table status
let selectedCountries = {
    _World: null,
    Germany: null,
    China: 'Hubei',
    Italy: null,
    US: null
};

// Button group status
let selectedCategories = ["active"];
let selectedMode = 'absolute';
let relative = false;
let logScale = false;
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
    // Get parameters from URL
    parseURLParams();

    // Load COVID data
    for (const category of inputCategories) {
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
                text: '<img class="icon" src="img/Selection.svg"/> Show selected entries',
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

    $('#buttonActive').click( function () {
        updateCategories('active', $(this).prop('checked'));
        updateSelected();
    } );


    // Absolute vs change radio buttons
    $('#buttonAbsolute').click( function () {
        selectedMode = 'absolute';
        updateSelected();
    } );

    $('#buttonChangeAbsolute').click( function () {
        selectedMode = 'change-absolute';
        updateSelected();
    } );


    // Relative button
    $('#buttonRelative').click( function () {
        relative = $(this).prop('checked');
        updateSelected();
    } );


    // Log-scale button
    $('#buttonLog').click( function () {
        logScale = $(this).prop('checked');
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
            let fields = results.meta.fields;
            const firstDateIdx = fields.indexOf(firstDate);
            let keys = fields.slice(0, firstDateIdx);
            let dates = fields.slice(firstDateIdx, fields.length);

            data[category] = {
                data: results.data,
                keys: keys,
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
    // Category buttons
    setButtonState('Confirmed', selectedCategories.includes('confirmed'));
    setButtonState('Deaths', selectedCategories.includes('deaths'));
    setButtonState('Recovered', selectedCategories.includes('recovered'));
    setButtonState('Active', selectedCategories.includes('active'));

    // Absolute vs relative vs change radio buttons
    setButtonState('Absolute', selectedMode === 'absolute');
    setButtonState('ChangeAbsolute', selectedMode === 'change-absolute');

    // Relative button
    setButtonState('Relative', relative);

    // Log-scale button
    setButtonState('Log', logScale);

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
    if (inputCategories.every(category => category in data) && population) {
        aggregateData();
        updateHeader();
        updateTableData();
    }
}


function aggregateData() {
    let keys = data.deaths.keys;
    let dates = data.deaths.dates;
    
    // Get latest date
    latestDate = dates[dates.length - 1];
    
    // Calculate active cases from other categories
    data['active'] = {
        data: [],
        keys: keys,
        dates: dates
    }
    for (const deathRow of data.deaths.data) {
        const state = deathRow['Province/State'];
        const country = deathRow['Country/Region'];
        let confirmedRow = findCountryData(state, country, 'confirmed');
        let recoveredRow = findCountryData(state, country, 'recovered');

        if (!confirmedRow || !recoveredRow) {
            continue;
        }

        let activeRow = {};

        // Insert fixed keys
        for (const key of keys) {
            activeRow[key] = deathRow[key];
        }

        // Insert active case numbers
        for (const date of dates) {
            activeRow[date] = confirmedRow[date] - deathRow[date] - recoveredRow[date];
        }

        data.active.data.push(activeRow);
    }

    // Compute global population
    let globalPopulation = 0;
    for (const entry of population) {
        globalPopulation += entry.population
    }
    population.push({
        name: '_World',
        population: globalPopulation
    });

    // Aggregate global data
    for (const category of categories) {
        let categoryData = data[category];

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
    // Update latest data date
    $('#latestData').html('Latest data: ' + new Date(latestDate).toDateString());
    
    // Update global count boxes
    for (const category of categories) {
        let total = data.total[category].toLocaleString('en-US');
        let trend = data.trend[category].toLocaleString('en-US');
        if (data.trend[category] >= 0) {
            trend = "+" + trend;
        }
        $('#' + category + 'Header').html(total + '<br />(' + trend + ')');
    }
}


function updateTableData() {
    let lastDate = data.deaths.dates[data.deaths.dates.length - 1];
    for (const row of data.deaths.data) {
        let state = row['Province/State'];
        let country = row['Country/Region'];
        let pop = getPopulation(country);
        let pop100k = pop != null ? pop / 100000 : null

        let deaths = row[lastDate];
        let deathsRelative = '';
        if (pop100k != null) {
            deathsRelative = Math.round(deaths / pop100k);
        }

        let confirmed = getCountryData(state, country, 'confirmed', 'absolute', false, false, false);
        let confirmedRelative = '';
        if (confirmed != null) {
            confirmed = confirmed[confirmed.length - 1];

            if (pop100k != null) {
                confirmedRelative = Math.round(confirmed / pop100k);
            }
        } else {
            confirmed = 0;
        }

        let recovered = getCountryData(state, country, 'recovered', 'absolute', false, false, false);
        let recoveredRelative = ''
        if (recovered != null) {
            recovered = recovered[recovered.length - 1];

            if (pop100k != null) {
                recoveredRelative = Math.round(recovered / pop100k);
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
            confirmedRelative.toLocaleString('en-US'),
            deathsRelative.toLocaleString('en-US'),
            recoveredRelative.toLocaleString('en-US'),
            0
        ]).node();

        // TODO: Use row().child() for adding children to a row
    }

    // Show default selected countries
    updateSelected();
    table.draw(true);
}


function updateSelected() {
    updateURL();
    updateTableHighlights();
    updateGraph(data, selectedCountries, selectedCategories, selectedMode, relative, logScale, aligned, smoothed);
}


function parseURLParams() {
    let url = new URL(window.location.href);
    let params = url.searchParams;

    let paramCountries = params.get('countries');
    if (paramCountries) {
        paramCountries = decodeURIComponent(paramCountries).split(',');

        selectedCountries = {};

        for (const paramCountry of paramCountries) {
            countryState = paramCountry.split(':');
            country = countryState[0];
            state = countryState.length > 1 ? countryState[1] : null;
            selectedCountries[country] = state;
        }
    }

    let paramCategories = params.get('data');
    if (paramCategories) {
        selectedCategories = decodeURIComponent(paramCategories).split(',');
    }

    let paramMode = params.get('metric');
    if (paramMode) {
        selectedMode = paramMode;
    }
    
    let paramRelative = params.get('relative');
    relative = paramRelative === 'true' ? true : false;

    let paramLogscale = params.get('logscale');
    logScale = paramLogscale === 'true' ? true : false;

    let paramAligned = params.get('aligned');
    aligned = paramAligned === 'true' ? true : false;

    let paramSmoothed = params.get('smoothed');
    smoothed = paramSmoothed === 'true' ? true : false;
}


function updateURL() {
    let currentURL = new URL(window.location.href);
    let newURLParams = new URLSearchParams();

    let countries = Array.from(Object.entries(selectedCountries), function (countryState) {
        country = countryState[0]
        state = countryState[1]
        if (state) {
            return country + ':' + state;
        } else {
            return country;
        }
    })

    newURLParams.append('countries', countries.join(','));
    newURLParams.append('data', selectedCategories.join(','));
    newURLParams.append('metric', selectedMode);
    
    if (relative) {
        newURLParams.append('relative', true);
    }

    if (logScale) {
        newURLParams.append('logscale', true);
    }

    if (aligned) {
        newURLParams.append('aligned', true);
    }

    if (smoothed) {
        newURLParams.append('smoothed', true);
    }

    if (newURLParams.toString() !== currentURL.search) {
        window.history.replaceState(null, '', currentURL.pathname + '?' + newURLParams.toString());
    }
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


function findCountryData(state, country, category) {
    return data[category].data.find(function(row) {
        return row['Province/State'] === state && row['Country/Region'] === country;
    } );
}


function getCountryData(state, country, category, mode, relative, aligned, smoothed) {
    let dataCountry = findCountryData(state, country, category);

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

        case 'change-absolute':
            dataArrayBefore = dataArray.slice(0, dataArray.length - 1);
            dataArrayBefore.unshift(0);
            output = arraySub(dataArray, dataArrayBefore);
            break;

        default:
            return null;
    }
    
    if (relative) {
        let pop = getPopulation(country);
        if (pop == null) {
            return null;
        }

        let pop100k = pop / 100000;
        output = arrayDiv(output, pop100k);
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
        let deathData = getCountryData(state, country, 'deaths', 'absolute', false, false, smoothed);
        let alignmentIndex = deathData.findIndex(function(value) {
            return value >= 10;
        } );

        if (alignmentIndex >= 0) {
            output = output.slice(alignmentIndex);

            // Provide scatter data for linear x-axis
            for (idx = 0; idx < output.length; idx++) {
                output[idx] = {
                    x: idx,
                    y: output[idx]
                };
            }
        } else {
            output = [];
        }
    }

    return output;
}
