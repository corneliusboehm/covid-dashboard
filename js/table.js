const columns = {
    FLAG: 0,
    COUNTRY: 1,
    CONFIRMED_TOTAL: 2,
    DEATHS_TOTAL: 3,
    CONFIRMED_RELATIVE: 4,
    DEATHS_RELATIVE: 5,
    CONFIRMED_INCREASE: 6,
    DEATHS_INCREASE: 7,
    CONFIRMED_INCREASE_RELATIVE: 8,
    DEATHS_INCREASE_RELATIVE: 9,
    SELECTED: 10,
}

const constVisibleColumns = [
    columns.FLAG,
    columns.COUNTRY,
]

let visibleColumns = [
    columns.CONFIRMED_TOTAL,
    columns.DEATHS_TOTAL,
    columns.CONFIRMED_RELATIVE,
    // columns.DEATHS_RELATIVE,
    // columns.CONFIRMED_INCREASE,
    // columns.DEATHS_INCREASE,
    columns.CONFIRMED_INCREASE_RELATIVE,
    // columns.DEATHS_INCREASE_RELATIVE,
]

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
                columns.CONFIRMED_RELATIVE,
                columns.DEATHS_RELATIVE,
                columns.CONFIRMED_INCREASE,
                columns.DEATHS_INCREASE,
                columns.CONFIRMED_INCREASE_RELATIVE,
                columns.DEATHS_INCREASE_RELATIVE,
                columns.SELECTED,
            ]},
            {'visible': false, 'targets': Object.values(columns).filter(column => !constVisibleColumns.includes(column) && !visibleColumns.includes(column))}
        ],
        aoColumns: [
            null,  // FLAG
            null,  // COUNTRY
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_TOTAL
            {orderSequence: ['desc', 'asc']},  // DEATHS_TOTAL
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_RELATIVE
            {orderSequence: ['desc', 'asc']},  // DEATHS_RELATIVE
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_INCREASE
            {orderSequence: ['desc', 'asc']},  // DEATHS_INCREASE
            {orderSequence: ['desc', 'asc']},  // CONFIRMED_INCREASE_RELATIVE
            {orderSequence: ['desc', 'asc']},  // DEATHS_INCREASE_RELATIVE
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

    // Setup "Toggle columns" dropdown
    setupColumnToggles();
} );


function setupColumnToggles() {
    // Update styling of the containing div
    $('#countryTable_wrapper .col-md-6:eq(0)').addClass('text-center');
    $('#countryTable_wrapper .col-md-6:eq(0)').addClass('text-md-left');

    // Give the button group an ID for later reference
    $('#countryTable_wrapper .btn-group').attr('id', 'tableButtons');

    // Add dropdown menu for "Toggle columns"
    $(`
<div class="btn-group dropdown" id="columnToggles">
    <button class="btn btn-secondary dropdown-toggle text-left" type="button" id="dropdownMenuButton" data-toggle="dropdown" data-flip="false" aria-haspopup="true" aria-expanded="false">
        <img class="icon" src="img/Columns.svg"/>
        Toggle columns
    </button>
    <div class="dropdown-menu dropdown-menu-lg-right">
        <h6 class="dropdown-header">Total cases</h6>
        <button class="dropdown-item" id="CONFIRMED_TOTAL_TOGGLE" type="button">Confirmed</button>
        <button class="dropdown-item" id="DEATHS_TOTAL_TOGGLE" type="button">Deaths</button>
        <div class="dropdown-divider"></div>

        <h6 class="dropdown-header">Per 100k</h6>
        <button class="dropdown-item" id="CONFIRMED_RELATIVE_TOGGLE" type="button">Confirmed</button>
        <button class="dropdown-item" id="DEATHS_RELATIVE_TOGGLE" type="button">Deaths</button>
        <div class="dropdown-divider"></div>

        <h6 class="dropdown-header">New cases</h6>
        <button class="dropdown-item" id="CONFIRMED_INCREASE_TOGGLE" type="button">Confirmed</button>
        <button class="dropdown-item" id="DEATHS_INCREASE_TOGGLE" type="button">Deaths</button>
        <div class="dropdown-divider"></div>

        <h6 class="dropdown-header">New cases per 100k</h6>
        <button class="dropdown-item" id="CONFIRMED_INCREASE_RELATIVE_TOGGLE" type="button">Confirmed</button>
        <button class="dropdown-item" id="DEATHS_INCREASE_RELATIVE_TOGGLE" type="button">Deaths</button>
    </div>
</div>`).appendTo('#tableButtons');

    for (column in columns) {
        // Skip columns that should not be toggled
        if (['FLAG', 'COUNTRY', 'SELECTED'].includes(column)) {
            continue;
        }

        let columnIdx = columns[column];
        let tableColumn = table.column(columnIdx);
        let button = $('#' + column + '_TOGGLE')

        // Initialize buttons for active columns
        if (tableColumn.visible()) {
            button.addClass('active');
        }

        // Change column visibility on click
        button.click( function () {
            let visibleBefore = tableColumn.visible();
            tableColumn.visible(!visibleBefore);

            if (visibleBefore) {
                $(this).removeClass('active');
                const idx = visibleColumns.indexOf(columnIdx);
                if (idx > -1) {
                    visibleColumns.splice(idx, 1);
                }
            } else {
                $(this).addClass('active');
                visibleColumns.push(columnIdx);
            }

            updateURL();
        } );
    }

    // Prevent the dropdown menu from closing after each click
    $(document).on('click', '#columnToggles .dropdown-menu', function (e) {
        e.stopPropagation();
    });

    // Make sure button group is correctly oriented
    flipButtonGroups();
}


function getCountryTableData(country, category, pop100k) {
    let row = getCountryData(country, category, 'total', false, false);
    let total = 0;
    let increase = 0;
    let totalRelative = 0;
    let increaseRelative = 0;
    if (row != null) {
        total = row[row.length - 1];
        increase = total - row[row.length - 2];

        if (pop100k != null) {
            totalRelative = Math.round(total / pop100k);
            increaseRelative = Math.round(increase * 10 / pop100k) / 10;
        }
    }
    
    return {
        total: total,
        increase: increase,
        totalRelative: totalRelative,
        increaseRelative: increaseRelative
    };
}


function updateTableData() {
    for (const row of data.deaths.data) {
        let country = row[COUNTRY_KEY];

        // Population
        let pop = getPopulation(country);
        let pop100k = pop != null ? pop / 100000 : null

        // Flag
        let flagURL = getFlag(country);
        let flag = flagURL != null ? '<img src="' + flagURL + '" class="flag">' : null;

        // Deaths
        deathData = getCountryTableData(country, 'deaths', pop100k);

        // Confirmed
        confirmedData = getCountryTableData(country, 'confirmed', pop100k);

        // Add row
        rowNode = table.row.add([
            flag,
            country,
            confirmedData.total.toLocaleString('en-US'),
            deathData.total.toLocaleString('en-US'),
            confirmedData.totalRelative.toLocaleString('en-US'),
            deathData.totalRelative.toLocaleString('en-US'),
            confirmedData.increase.toLocaleString('en-US'),
            deathData.increase.toLocaleString('en-US'),
            confirmedData.increaseRelative.toLocaleString('en-US'),
            deathData.increaseRelative.toLocaleString('en-US'),
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
