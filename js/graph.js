const colors = palette('mpn65', 65);

let graph;


function addToGraph(country, state) {
    var countryData = getCountryData(state, country);
    var baseColor = colors[graph.data.datasets.length % colors.length]

    graph.data.datasets.push({
        label: country,
        data: countryData,
        fill: false,
        borderColor: hexToRGBA(baseColor, 0.7),
        pointBackgroundColor: hexToRGBA(baseColor, 1),
        pointBorderColor: hexToRGBA(baseColor, 1)
    });

    graph.update();
}


function updateGraph(row, selected) {
    if (selected) {
        addToGraph(row[0], row[1])
    } else {
        // TODO: Remove entry
    }
}


function initializeGraph(dates) {
    if (!graph) {
        let ctx = document.getElementById('myChart').getContext('2d');
        ctx.canvas.width = window.innerWidth * 0.9
        ctx.canvas.height = window.innerHeight * 0.3

        let dateLabels = Array.from(dates, date => new Date(date));

        graph = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: []
            },
            options: {
                title: {
                    display: true,
                    text: 'Deaths',
                    fontSize: 24
                },
                layout: {
                    padding: {
                        left: 50,
                        right: 50,
                        top: 0,
                        bottom: 0
                    }
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    }]
                }
            }
        });
    }
};
