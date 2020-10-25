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

        let confirmed = getCountryData(country, 'confirmed', 'total', false, false);
        let confirmedRelative = '';
        if (confirmed != null) {
            confirmed = confirmed[confirmed.length - 1];

            if (pop100k != null) {
                confirmedRelative = Math.round(confirmed / pop100k);
            }
        } else {
            confirmed = 0;
        }

        let recovered = getCountryData(country, 'recovered', 'total', false, false);
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
