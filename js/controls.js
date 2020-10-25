let selectedCategories = ['active'];
let selectedMetric = 'total';
let relative = false;
let logScale = false;
let smoothed = false;


$(document).ready( function () {
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

    initializeButtons();
} );


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
