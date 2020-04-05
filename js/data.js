const baseDataURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/"
const firstDate = "1/22/20"

let selectedCountries = {
    Germany: null,
    China: 'Hubei',
    France: null,
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
        let selected = $(this).hasClass('table-primary')
        let rowData = table.row(this).data()
        let country = rowData[0]
        let state = rowData[1]

        if (selected) {
            selectedCountries[country] = state
        } else {
            delete selectedCountries[country]
        }

        updateSelected();
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

            updateTableData();
        }
    } );
}


function updateTableData() {
    if ("deaths" in data && "confirmed" in data && "recovered" in data) {
        var rowIdx;
        // TODO: Iterate over categories or aggregate data first

        for (rowIdx in data.deaths.data) {
            var row = data.deaths.data[rowIdx];
            state = row['Province/State'];
            country = row['Country/Region'];

            rowNode = table.row.add([country, state]).node();

            // Use row().child() for adding children to a row
        }

        table.draw(true)

        // Show default selected countries
        updateSelected()
    }
}


function updateSelected() {
    updateTableHighlights();
    updateGraph(data, selectedCountries);
}


function updateTableHighlights() {
    table.rows().every(function() {
        let rowData = this.data()
        let country = rowData[0]
        let state = rowData[1]

        if (country in selectedCountries && selectedCountries[country] === state) {
            $(this.node()).addClass('table-primary');
        } else {
            $(this.node()).removeClass('table-primary');
        }
    })
}


function findCountry(row, state, country) {
    return row['Province/State'] === state && row['Country/Region'] === country;
}


function getCountryData(state, country) {
    // TOOD: Which category? Get dates from category
    let dataCountry = data.deaths.data.find(row => findCountry(row, state, country));
    return Array.from(data.deaths.dates, x => dataCountry[x]);
}
