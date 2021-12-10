let selectedCategories = ['confirmed'];
let selectedMetric = 'change';
let relative = true;
let logScale = false;
let smoothed = true;


$(document).ready( function () {
    // Quick buttons
    $('#buttonQuickNewConfirmed').click( function () {
        selectedCategories = ['confirmed'];
        selectedMetric = 'change';
        relative = true;
        logScale = false;
        smoothed = true;

        updateSelected();
    } );

    $('#buttonQuickActive').click( function () {
        selectedCategories = ['active'];
        selectedMetric = 'total';
        relative = true;
        logScale = false;
        smoothed = false;

        updateSelected();
    } );

    $('#buttonQuickTotals').click( function () {
        selectedCategories = ['confirmed', 'deaths'];
        selectedMetric = 'total';
        relative = false;
        logScale = false;
        smoothed = false;

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


    // Smoothed button
    $('#buttonSmoothed').click( function () {
        smoothed = $(this).prop('checked');
        updateSelected();
    } );

    updateButtons();
    flipButtonGroups();
} );


$(window).on('resize', function() {
    flipButtonGroups();
});


function flipButtonGroups() {
    let width = $(window).width();

    if (width > 979) {
        $('#quickControls').removeClass('btn-group-vertical');
        $('#quickControls').addClass('btn-group');
    } else {
        $('#quickControls').removeClass('btn-group');
        $('#quickControls').addClass('btn-group-vertical');
    }

    if (width > 979) {
        $('#dataButtonGroup').removeClass('btn-group-vertical');
        $('#dataButtonGroup').addClass('btn-group');
    } else {
        $('#dataButtonGroup').removeClass('btn-group');
        $('#dataButtonGroup').addClass('btn-group-vertical');
    }

    if (width > 979) {
        $('#tableButtons').removeClass('btn-group-vertical');
        $('#tableButtons').addClass('btn-group');
    } else {
        $('#tableButtons').removeClass('btn-group');
        $('#tableButtons').addClass('btn-group-vertical');
    }
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


function updateButtons() {
    // Quick buttons
    let quickConfirmed = (arrayEqual(selectedCategories, ['confirmed'])
                          && selectedMetric === 'change'
                          && relative
                          && !logScale
                          && smoothed);
    setButtonState('QuickNewConfirmed', quickConfirmed);
    let quickActive = (arrayEqual(selectedCategories, ['active'])
                       && selectedMetric === 'total'
                       && relative
                       && !logScale
                       && !smoothed);
    setButtonState('QuickActive', quickActive);
    let quickTotals = ((arrayEqual(selectedCategories, ['confirmed', 'deaths'])
                        || arrayEqual(selectedCategories, ['deaths', 'confirmed']))
                       && selectedMetric === 'total'
                       && !relative
                       && !logScale
                       && !smoothed);
    setButtonState('QuickTotals', quickTotals);
    
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
