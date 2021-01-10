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

let data = {
    total: {},
    increase: {},
    // Categories added later:
    // deaths
    // confirmed
    // recovered
    // active
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
    // Load COVID data
    for (const category of INPUT_CATEGORIES) {
        loadCSV(category, 'time_series_covid19_' + category + '_global.csv');
    }

    // Load population data
    $.getJSON(REST_COUNTRIES_URL, function(populationData) {
        population = populationData;
        updateData();
    } );
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
    numDates = dates.length
    latestDate = dates[numDates - 1];

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
        data.total[category] = globalData[dates[numDates - 1]];

        // Calculate latest increase
        data.increase[category] = globalData[dates[numDates - 1]] - globalData[dates[numDates - 2]];
    }
}


function updateHeader() {
    // Update latest data date
    $('#latestData').html('Latest data from ' + new Date(latestDate).toLocaleDateString(
        "en-US", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
    ));

    // Update global count boxes
    for (const category of CATEGORIES) {
        let total = data.total[category].toLocaleString('en-US');
        let increase = data.increase[category].toLocaleString('en-US');
        if (data.increase[category] >= 0) {
            increase = '+' + increase;
        }
        $('#' + category + 'Global').html(total);
        $('#' + category + 'GlobalIncrease').html(increase + ' new cases');
    }
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


function computeDailyChange(dataArray) {
    let dataArrayBefore = dataArray.slice(0, dataArray.length - 1);
    dataArrayBefore.unshift(0);
    return arraySub(dataArray, dataArrayBefore);
}


function getCountryData(country, category, metric, relative, smoothed) {
    let output;
    if (category === 'fatality rate') {
        let deathData = findCountryData(country, 'deaths');
        let confirmedData = findCountryData(country, 'confirmed');

        if (!deathData || !confirmedData) {
            console.log('Data not found: ', country, category)
            return null;
        }

        deathDataArray = Array.from(data['deaths'].dates, date => deathData[date]);
        confirmedDataArray = Array.from(data['confirmed'].dates, date => confirmedData[date]);

        if (metric === 'change') {
            deathDataArray = computeDailyChange(deathDataArray);
            confirmedDataArray = computeDailyChange(confirmedDataArray);
        }

        output = arrayDiv(deathDataArray, confirmedDataArray);
    } else {
        let dataCountry = findCountryData(country, category);

        if (!dataCountry) {
            console.log('Data not found: ', country, category)
            return null;
        }

        output = Array.from(data['deaths'].dates, date => dataCountry[date]);
    }

    if (metric === 'change' && category !== 'fatality rate') {
        output = computeDailyChange(output);
    }

    if (relative && category !== 'fatality rate') {
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

    return output;
}
