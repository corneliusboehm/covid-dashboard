const columns = {
    FLAG: 0,
    COUNTRY: 1,
    CONFIRMED_TOTAL: 2,
    DEATHS_TOTAL: 3,
    RECOVERED_TOTAL: 4,
    CONFIRMED_RELATIVE: 5,
    DEATHS_RELATIVE: 6,
    RECOVERED_RELATIVE: 7,
    CONFIRMED_INCREASE: 8,
    DEATHS_INCREASE: 9,
    RECOVERED_INCREASE: 10,
    CONFIRMED_INCREASE_RELATIVE: 11,
    DEATHS_INCREASE_RELATIVE: 12,
    RECOVERED_INCREASE_RELATIVE: 13,
    SELECTED: 14,
}

let selectedCountries = [
    WORLD_NAME,
    'Germany',
    'US'
];

let table;


$(document).ready( function () {
    // Setup table
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
                columns.CONFIRMED_INCREASE,
                columns.DEATHS_INCREASE,
                columns.RECOVERED_INCREASE,
                columns.CONFIRMED_INCREASE_RELATIVE,
                columns.DEATHS_INCREASE_RELATIVE,
                columns.RECOVERED_INCREASE_RELATIVE,
                columns.SELECTED,
            ]},
            {'visible': false, 'targets': [
                // columns.CONFIRMED_TOTAL,
                // columns.DEATHS_TOTAL,
                columns.RECOVERED_TOTAL,
                // columns.CONFIRMED_RELATIVE,
                columns.DEATHS_RELATIVE,
                columns.RECOVERED_RELATIVE,
                columns.CONFIRMED_INCREASE,
                columns.DEATHS_INCREASE,
                columns.RECOVERED_INCREASE,
                // columns.CONFIRMED_INCREASE_RELATIVE,
                columns.DEATHS_INCREASE_RELATIVE,
                columns.RECOVERED_INCREASE_RELATIVE,
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
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_INCREASE
            {orderSequence: ['desc', 'asc']},  // DEATHS_INCREASE
            {orderSequence: ['desc', 'asc']},  // RECOVERED_INCREASE
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_INCREASE_RELATIVE
            {orderSequence: ['desc', 'asc']},  // DEATHS_INCREASE_RELATIVE
            {orderSequence: ['desc', 'asc']},  // RECOVERED_INCREASE_RELATIVE
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
    
    // Make rows clickable
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
} );


function updateTableData() {
    let lastDate = data.deaths.dates[data.deaths.dates.length - 1];
    let secondToLastDate = data.deaths.dates[data.deaths.dates.length - 2];

    for (const row of data.deaths.data) {
        let country = row[COUNTRY_KEY];
        
        // Population
        let pop = getPopulation(country);
        let pop100k = pop != null ? pop / 100000 : null

        // Flag
        let flagURL = getFlag(country);
        let flag = flagURL != null ? '<img src="' + flagURL + '" class="flag">' : null;

        // Deaths
        let deaths = row[lastDate];
        let deathsIncrease = deaths - row[secondToLastDate];
        let deathsRelative = 0;
        let deathsIncreaseRelative = 0;
        if (pop100k != null) {
            deathsRelative = Math.round(deaths / pop100k);
            deathsIncreaseRelative = Math.round(deathsIncrease / pop100k);
        }

        // Confirmed
        let confirmedRow = getCountryData(country, 'confirmed', 'total', false, false);
        let confirmed = 0;
        let confirmedIncrease = 0;
        let confirmedRelative = 0;
        let confirmedIncreaseRelative = 0;
        if (confirmedRow != null) {
            confirmed = confirmedRow[confirmedRow.length - 1];
            confirmedIncrease = confirmed - confirmedRow[confirmedRow.length - 2];

            if (pop100k != null) {
                confirmedRelative = Math.round(confirmed / pop100k);
                confirmedIncreaseRelative = Math.round(confirmedIncrease / pop100k);
            }
        }

        // Recovered
        let recoveredRow = getCountryData(country, 'recovered', 'total', false, false);
        let recovered = 0;
        let recoveredIncrease = 0;
        let recoveredRelative = 0;
        let recoveredIncreaseRelative = 0;
        if (recoveredRow != null) {
            recovered = recoveredRow[recoveredRow.length - 1];
            recoveredIncrease = recovered - recoveredRow[recoveredRow.length - 2];

            if (pop100k != null) {
                recoveredRelative = Math.round(recovered / pop100k);
                recoveredIncreaseRelative = Math.round(recoveredIncrease / pop100k);
            }
        } else {
            recovered = 0;
        }

        // Add row
        rowNode = table.row.add([
            flag,
            country,
            confirmed.toLocaleString('en-US'),
            deaths.toLocaleString('en-US'),
            recovered.toLocaleString('en-US'),
            confirmedRelative.toLocaleString('en-US'),
            deathsRelative.toLocaleString('en-US'),
            recoveredRelative.toLocaleString('en-US'),
            confirmedIncrease.toLocaleString('en-US'),
            deathsIncrease.toLocaleString('en-US'),
            recoveredIncrease.toLocaleString('en-US'),
            confirmedIncreaseRelative.toLocaleString('en-US'),
            deathsIncreaseRelative.toLocaleString('en-US'),
            recoveredIncreaseRelative.toLocaleString('en-US'),
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
    updateButtons();
    updateGraph(
        data,
        selectedCountries,
        selectedCategories,
        selectedMetric,
        relative,
        logScale,
        smoothed,
    );
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
