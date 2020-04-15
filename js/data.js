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

let selectedCategories = ["deaths"];

let selectedMode = 'absolute';

let aligned = false;

let table;
let data = {
    total: {},
    trend: {}
};


$(document).ready( function () {
    for (const category of categories) {
        loadCSV(category, "time_series_covid19_" + category + "_global.csv");
    }

    // Initialize country selection table
    table = $('#countryTable').DataTable({
        "scrollY": "300px",
        "scrollCollapse": true,
        "paging": false,
        "order": [[5, 'desc'], [ 0, 'asc' ], [ 1, 'asc' ]],
        // "columnDefs": [
        //     { "visible": false, "targets": 5 }
        // ]
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
    if (categories.every(category => category in data)) {
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
    lastDate = data.deaths.dates[data.deaths.dates.length - 1];
    for (const row of data.deaths.data) {
        state = row['Province/State'];
        country = row['Country/Region'];
        deaths = row[lastDate].toLocaleString('en-US');

        confirmed = getCountryData(state, country, 'confirmed');
        if (confirmed) {
            confirmed = confirmed[confirmed.length - 1].toLocaleString('en-US');
        } else {
            confirmed = 0;
        }

        recovered = getCountryData(state, country, 'recovered');
        if (recovered) {
            recovered = recovered[recovered.length - 1].toLocaleString('en-US');
        } else {
            recovered = 0;
        }

        rowNode = table.row.add([country, state, confirmed, deaths, recovered, 0]).node();

        // Use row().child() for adding children to a row
    }

    table.draw(true);

    // Show default selected countries
    updateSelected();
}


function updateSelected() {
    updateTableHighlights();
    updateButtons();
    updateGraph(data, selectedCountries, selectedCategories, selectedMode);
}


function updateTableHighlights() {
    table.rows().every(function() {
        let rowData = this.data();
        let country = rowData[0];
        let state = rowData[1];

        if (country in selectedCountries && selectedCountries[country] === state) {
            $(this.node()).addClass('table-primary');
            rowData[5] = 1;
        } else {
            $(this.node()).removeClass('table-primary');
            rowData[5] = 0;
        }
    })

    table.rows().invalidate().draw(true);
}


function updateButtons() {
    // TODO
}


function getCountryData(state, country, category, mode) {
    let dataCountry = data[category].data.find(function(row) {
        return row['Province/State'] === state && row['Country/Region'] === country;
    } );

    if (dataCountry) {
        return Array.from(data[category].dates, date => dataCountry[date]);
    } else {
        console.log('Data not found: ', state, country, category)
        return null;
    }
}
