# crekowski.github.io

### Data
Data is sourced from [2019 Novel Coronavirus COVID-19 (2019-nCoV) Data Repository by Johns Hopkins CSSE](https://github.com/CSSEGISandData/COVID-19).

### Installation
Install `browserify` or optionally `watchify` globally:
```shell script
npm install -g browserify
npm install -g watchify
```

Install local `npm` modules:
```shell script
npm install
```


### Deployment
If you edited `js/charts.js`, make sure to update `bundle.js` either by running
```shell script
browserify js/charts.js -o js/bundle.js
```
or by keeping
```shell script
watchify js/charts.js -o js/bundle.js
```
running in the background.

Then simply open `index.html` locally in your browser.


### More Information
[Chart.js](https://www.chartjs.org/).
[PapaParse](https://www.papaparse.com/)
