const baseDataURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/"
const firstDate = "1/22/20"

let defaultCountries = {
    Germany: null,
    China: 'Hubei',
    France: 'France',
    Italy: null,
    US: null
}

let table;
let data = {};


$(document).ready( function () {
    loadCSV("deaths", "time_series_covid19_deaths_global.csv");
    loadCSV("confirmed", "time_series_covid19_confirmed_global.csv");
    loadCSV("recovered", "time_series_covid19_recovered_global.csv");

    // Initialize country selection table
    table = $('#countrySelection').DataTable({
        "scrollY": "300px",
        "scrollCollapse": true,
        "paging": false
    } );

    $('#countrySelection tbody').on( 'click', 'tr', function () {
        $(this).toggleClass('table-primary');
        selected = $(this).hasClass('table-primary')
        updateGraph(table.row(this).data(), selected);
    } );
} );


function loadCSV(key, file) {
    let results = Papa.parse(baseDataURL + file, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            let fields =  results.meta.fields;
            let dates = fields.slice(fields.indexOf(firstDate), fields.length)

            data[key] = {
                data: results.data,
                dates: dates
            };

            // TODO: Don't do this every time
            initializeGraph(dates);
            updateTable()
        }
    } );
}


function updateTable() {
    var rowIdx;
    // TODO: Iterate over categories or aggregate data first
    for (rowIdx in data.deaths.data) {
        var row = data.deaths.data[rowIdx];
        state = row['Province/State'];
        country = row['Country/Region'];

        rowNode = table.row.add([country, state]).node();

        // Use row().child() for adding children to a row

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
    // TOOD: Which category? Get dates from category
    var dataCountry = data.deaths.data.find(row => findCountry(row, state, country));
    return Array.from(data.deaths.dates, x => dataCountry[x]);
}
