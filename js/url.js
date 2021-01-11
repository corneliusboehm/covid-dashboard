
$(document).ready( function () {
    // Get parameters from URL
    parseURLParams();
} );


function parseURLParams() {
    let url = new URL(window.location.href);
    let params = url.searchParams;
    
    if (Array.from(params).length == 0) {
        // Use parameters from local storage if available, otherwise default parameters
        loadLocalStorage();
        return;
    }

    let paramColumns = params.get('columns');
    if (paramColumns) {
        visibleColumns = Array.from(decodeURIComponent(paramColumns).split(','), 
                                    idxStr => parseInt(idxStr));
    }

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


function loadLocalStorage() {
    storage = window.localStorage;

    if (storage.getItem('metric')) {
        visibleColumns = JSON.parse(storage.getItem('columns'));
        selectedCountries = JSON.parse(storage.getItem('countries'));
        selectedCategories = JSON.parse(storage.getItem('data'));
        selectedMetric = storage.getItem('metric');
        relative = JSON.parse(storage.getItem('relative'));
        logScale = JSON.parse(storage.getItem('logscale'));
        smoothed = JSON.parse(storage.getItem('smoothed'));
    }
}


function updateURL() {
    let currentURL = new URL(window.location.href);
    let newURLParams = new URLSearchParams();

    newURLParams.append('columns', visibleColumns.join(','));
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

    updateLocalStorage();
}


function updateLocalStorage() {
    storage = window.localStorage;

    storage.setItem('columns', JSON.stringify(visibleColumns));
    storage.setItem('countries', JSON.stringify(selectedCountries));
    storage.setItem('data', JSON.stringify(selectedCategories));
    storage.setItem('metric', selectedMetric);
    storage.setItem('relative', JSON.stringify(relative));
    storage.setItem('logscale', JSON.stringify(logScale));
    storage.setItem('smoothed', JSON.stringify(smoothed));
}
