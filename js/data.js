const BASE_DATA_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/' + 
                      'csse_covid_19_data/csse_covid_19_time_series/';
const REST_COUNTRIES_URL = 'https://restcountries.eu/rest/v2/all?fields=name;population;flag'
const FIRST_DATE = '1/22/20';
let latestDate = null;
const INPUT_CATEGORIES = ['deaths', 'confirmed', 'recovered'];
const CATEGORIES = ['deaths', 'confirmed', 'recovered', 'active'];
const COUNTRY_KEY = 'Country/Region';
const PROVINCE_KEY = 'Province/State';
const WORLD_NAME = 'World';

// Table status
let selectedCountries = [
    WORLD_NAME,
    'Germany',
    'US'
];

const columns = {
    FLAG: 0,
    COUNTRY: 1,
    CONFIRMED_TOTAL: 2,
    DEATHS_TOTAL: 3,
    RECOVERED_TOTAL: 4,
    CONFIRMED_RELATIVE: 5,
    DEATHS_RELATIVE: 6,
    RECOVERED_RELATIVE: 7,
    SELECTED: 8,
}

// Button group status
let selectedCategories = ['active'];
let selectedMetric = 'total';
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
    'British Virgin Islands': 'Virgin Islands (British)',
    'Brunei': 'Brunei Darussalam',
    'Burma': 'Myanmar',
    'Congo (Brazzaville)': 'Congo',
    'Congo (Kinshasa)': 'Congo (Democratic Republic of the)',
    'Cote d\'Ivoire': 'Côte d\'Ivoire',
    'Curacao': 'Curaçao',
    'Czechia': 'Czech Republic',
    'Eswatini': 'Swaziland',
    'Iran': 'Iran (Islamic Republic of)',
    'Korea, South': 'Korea (Republic of)',
    'Kosovo': 'Republic of Kosovo',
    'Laos': 'Lao People\'s Democratic Republic',
    'Moldova': 'Moldova (Republic of)',
    'North Macedonia': 'Macedonia (the former Yugoslav Republic of)',
    'Reunion': 'Réunion',
    'Russia': 'Russian Federation',
    'Saint Barthelemy': 'Saint Barthélemy',
    'Sint Maarten': 'Sint Maarten (Dutch part)',
    'St Martin': 'Saint Martin (French part)',
    'Syria': 'Syrian Arab Republic',
    'Taiwan*': 'Taiwan',
    'Tanzania': 'Tanzania, United Republic of',
    'United Kingdom': 'United Kingdom of Great Britain and Northern Ireland',
    'US': 'United States of America',
    'Venezuela': 'Venezuela (Bolivarian Republic of)',
    'Vietnam': 'Viet Nam',
    'West Bank and Gaza': 'Palestine, State of'
}

let missingPopulations = {
    'Channel Islands': {
        // Source: https://en.wikipedia.org/wiki/Channel_Islands
        population: 170499,
        flag: null,
    },
    'Diamond Princess': {
        // Source: https://en.wikipedia.org/wiki/COVID-19_pandemic_on_cruise_ships
        population: 3711,
        flag: null,
    },
    'MS Zaandam': {
        // Source: https://en.wikipedia.org/wiki/COVID-19_pandemic_on_cruise_ships
        population: 1829,
        flag: null,
    }
}


$(document).ready( function () {
    // Get parameters from URL
    parseURLParams();

    // Load COVID data
    for (const category of INPUT_CATEGORIES) {
        loadCSV(category, 'time_series_covid19_' + category + '_global.csv');
    }

    // Load population data
    $.getJSON(REST_COUNTRIES_URL, function(populationData) {
        population = populationData;
        updateData();
    } );

    // Initialize country selection table
    table = $('#countryTable').DataTable({
        scrollX: true,
        scrollY: '300px',
        scrollCollapse: true,
        paging: false,
        order: [[columns.SELECTED, 'desc'], [ columns.COUNTRY, 'asc' ]],
        columnDefs: [
            {'orderable': false, 'targets': [columns.FLAG]},
            {'className': 'dt-body-center', 'targets': [columns.FLAG]},
            // Prevent visibility toggling
            {'className': 'noVis', 'targets': [columns.FLAG, columns.COUNTRY, columns.SELECTED]},
            {'searchable': false, 'targets': [
                columns.FLAG,
                columns.CONFIRMED_TOTAL,
                columns.DEATHS_TOTAL,
                columns.RECOVERED_TOTAL,
                columns.CONFIRMED_RELATIVE,
                columns.DEATHS_RELATIVE,
                columns.RECOVERED_RELATIVE,
                columns.SELECTED,
            ]},
            {'visible': false, 'targets': [
                columns.RECOVERED_TOTAL,
                columns.RECOVERED_RELATIVE,
                columns.SELECTED,
            ]}
        ],
        aoColumns: [
            null,  // FLAG
            null,  // COUNTRY
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_TOTAL
            {orderSequence: ['desc', 'asc']},  // DEATHS_TOTAL
            {orderSequence: ['desc', 'asc']},  // RECOVERED_TOTAL
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_RELATIVE
            {orderSequence: ['desc', 'asc']},  // DEATHS_RELATIVE
            {orderSequence: ['desc', 'asc']},  // RECOVERED_RELATIVE
            null,  // SELECTED
        ],
        buttons: [
            {
                text: '<img class="icon" src="img/Selection.svg"/> Show selected entries',
                action: function (e, dt, node, config) {
                    table.search('').order([
                        [columns.SELECTED, 'desc'], 
                        [columns.COUNTRY, 'asc']
                    ]).draw();
                }
            },
            {
                extend: 'colvis',
                columns: ':not(.noVis)',
                text: '<img class="icon" src="img/Columns.svg"/> Toggle columns',
            }
        ]
    } );
    table.buttons().container().appendTo( '#countryTable_wrapper .col-md-6:eq(0)' );

    $('#countryTable tbody').on( 'click', 'tr', function () {
        let selected = !($(this).hasClass('table-primary'));
        let rowData = table.row(this).data();
        let country = rowData[columns.COUNTRY];

        if (selected) {
            selectedCountries.push(country);
        } else {
            const idx = selectedCountries.indexOf(country);
            selectedCountries.splice(idx, 1);
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


    // Total vs change radio buttons
    $('#buttonTotal').click( function () {
        selectedMetric = 'total';
        updateSelected();
    } );

    $('#buttonChange').click( function () {
        selectedMetric = 'change';
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
    let results = Papa.parse(BASE_DATA_URL + file, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            let fields = results.meta.fields;
            const firstDateIdx = fields.indexOf(FIRST_DATE);
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

    // Total vs change radio buttons
    setButtonState('Total', selectedMetric === 'total');
    setButtonState('Change', selectedMetric === 'change');

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
    if (INPUT_CATEGORIES.every(category => category in data) && population) {
        cleanData();
        aggregateData();
        updateHeader();
        updateTableData();
    }
}


function cleanData() {
    for (const category of INPUT_CATEGORIES) {
        provinces = [];
        countries = {};
        categoryData = data[category].data;
        dates = data[category].dates;

        // Sort data into countries and provinces
        for (row of categoryData) {
            if (row[PROVINCE_KEY] === null) {
                countries[row[COUNTRY_KEY]] = row;
            } else {
                provinces.push(row);
            }
        }

        // Sum up provinces or make them their own countries
        summedCountries = {};
        for (province of provinces) {
            country = province[COUNTRY_KEY];
            provinceName = province[PROVINCE_KEY];

            if (country in countries) {
                // The mainland of this country already has an entry,
                // make this one it's own entry
                province[COUNTRY_KEY] = provinceName;
                countries[provinceName] = province;
            } else if (country in summedCountries) {
                summedRow = summedCountries[country];
                for (const date of dates) {
                    summedRow[date] += province[date];
                }
            } else {
                summedCountries[country] = province;
            }
        }

        data[category].data = Object.values(countries).concat(Object.values(summedCountries));
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
        const country = deathRow[COUNTRY_KEY];
        let confirmedRow = findCountryData(country, 'confirmed');
        let recoveredRow = findCountryData(country, 'recovered');

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
        name: WORLD_NAME,
        population: globalPopulation,
        flag: 'img/Globe.png',  // Source: http://www.pngplay.com/image/11497
    });

    // Aggregate global data
    for (const category of CATEGORIES) {
        let categoryData = data[category];

        // Sum up global data
        let globalData = Object.fromEntries(dates.map(date => [date, 0]));
        for (const row of categoryData.data) {
            for (const date of dates) {
                globalData[date] += row[date];
            }
        }

        globalData[COUNTRY_KEY] = WORLD_NAME;
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
    for (const category of CATEGORIES) {
        let total = data.total[category].toLocaleString('en-US');
        let trend = data.trend[category].toLocaleString('en-US');
        if (data.trend[category] >= 0) {
            trend = '+' + trend;
        }
        $('#' + category + 'Header').html(total + '<br />(' + trend + ')');
    }
}


function updateTableData() {
    let lastDate = data.deaths.dates[data.deaths.dates.length - 1];
    for (const row of data.deaths.data) {
        let country = row[COUNTRY_KEY];
        let pop = getPopulation(country);
        let pop100k = pop != null ? pop / 100000 : null

        let flagURL = getFlag(country);
        let flag = flagURL != null ? '<img src="' + flagURL + '" class="flag">' : null;

        let deaths = row[lastDate];
        let deathsRelative = '';
        if (pop100k != null) {
            deathsRelative = Math.round(deaths / pop100k);
        }

        let confirmed = getCountryData(country, 'confirmed', 'total', false, false, false);
        let confirmedRelative = '';
        if (confirmed != null) {
            confirmed = confirmed[confirmed.length - 1];

            if (pop100k != null) {
                confirmedRelative = Math.round(confirmed / pop100k);
            }
        } else {
            confirmed = 0;
        }

        let recovered = getCountryData(country, 'recovered', 'total', false, false, false);
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
            flag,
            country,
            confirmed.toLocaleString('en-US'),
            deaths.toLocaleString('en-US'),
            recovered.toLocaleString('en-US'),
            confirmedRelative.toLocaleString('en-US'),
            deathsRelative.toLocaleString('en-US'),
            recoveredRelative.toLocaleString('en-US'),
            0
        ]).node();
    }

    // Show default selected countries
    updateSelected();
    table.draw(true);
}


function updateSelected() {
    updateURL();
    updateTableHighlights();
    updateGraph(
        data,
        selectedCountries,
        selectedCategories,
        selectedMetric,
        relative,
        logScale,
        aligned,
        smoothed,
    );
}


function parseURLParams() {
    let url = new URL(window.location.href);
    let params = url.searchParams;

    let paramCountries = params.get('countries');
    if (paramCountries) {
        selectedCountries = decodeURIComponent(paramCountries).split(',');
    }

    let paramCategories = params.get('data');
    if (paramCategories) {
        selectedCategories = decodeURIComponent(paramCategories).split(',');
    }

    let paramMetric = params.get('metric');
    if (paramMetric) {
        selectedMetric = paramMetric;
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

    newURLParams.append('countries', selectedCountries.join(','));
    newURLParams.append('data', selectedCategories.join(','));
    newURLParams.append('metric', selectedMetric);

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
        let country = rowData[columns.COUNTRY];

        if (selectedCountries.includes(country)) {
            $(this.node()).addClass('table-primary');
            if (country === WORLD_NAME) {
                rowData[columns.SELECTED] = 3;
            } else {
                rowData[columns.SELECTED] = 2;
            }
        } else {
            $(this.node()).removeClass('table-primary');
            if (country === WORLD_NAME) {
                rowData[columns.SELECTED] = 1;
            } else {
                rowData[columns.SELECTED] = 0;
            }
        }
    })

    table.rows().invalidate();
}


function getRestCountriesEntry(country) {
    // Map names to population data naming
    let popName = country in populationNameDict ? populationNameDict[country] : country;

    let pop = population.find(entry => entry.name === popName);

    if (pop != null) {
        return pop;
    } else if (country in missingPopulations) {
        return missingPopulations[country]
    } else {
        console.log('No REST Countries entry: ', country);
        return null;
    }
}


function getPopulation(country) {
    pop = getRestCountriesEntry(country);
    return pop != null ? pop.population : null;
}


function getFlag(country) {
    pop = getRestCountriesEntry(country);
    return pop != null ? pop.flag : null;
}


function findCountryData(country, category) {
    return data[category].data.find(row => row[COUNTRY_KEY] === country);
}


function getCountryData(country, category, metric, relative, aligned, smoothed) {
    let dataCountry = findCountryData(country, category);

    if (!dataCountry) {
        console.log('Data not found: ', country, category)
        return null;
    }

    let dataArray = Array.from(data[category].dates, date => dataCountry[date]);
    let dataArrayBefore;
    let output;

    switch (metric) {
        case 'total':
            output = dataArray;
            break;

        case 'change':
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
        let deathData = getCountryData(country, 'deaths', 'total', false, false, smoothed);
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
