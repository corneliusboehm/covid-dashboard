
$(document).ready( function () {
    const seconds = 3;
    const url = 'index.html' + document.location.search;
    console.log('Redirecting to ' + url + 'in ' + seconds + ' seconds');
    
    setTimeout(function() {
        document.location.href = url;
    }, (seconds * 1000));
} );
