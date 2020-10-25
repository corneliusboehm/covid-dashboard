
$(document).ready( function () {
    // Get parameters from URL
    parseURLParams();
} );


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

    if (smoothed) {
        newURLParams.append('smoothed', true);
    }

    if (newURLParams.toString() !== currentURL.search) {
        window.history.replaceState(null, '', currentURL.pathname + '?' + newURLParams.toString());
    }
}
