'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');


const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());


// handle the main route

app.get('/', (request, response) => {
    response.status(200).send('Welcome to my page for testing API');
});

// localhost: 3030 / location ? city = lynwood 
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks', parkHandler);

app.use('*', notFoundHandler);
app.use(errorHandler);



function locationHandler(request, response) {
    const city = request.query.city;
    // console.log(city);
    // getLocation(city)
    let key = process.env.LOCATIONIO_KEY;

    let URL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    superagent.get(URL)
        .then(geoData => {
            const locationData = new Location(city, geoData.body);
            response.status(200).send(locationData);
        })
        .catch(() => {
            errorHandler('something went wrong in gtting the data from locationiq web', request, response)
        })

}



function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}


function weatherHandler(request, response) {
    let lat = request.query.latitude;
    let lon = request.query.longitude;
    getWeather(lat, lon)
        .then(val => {
            response.status(200).json(val);
        });
}

function getWeather(lat, lon) {
    let weatherSummaries = [];
    let key = process.env.WEATHER_KEY;
    // console.log('lon= ' + lon + '>>>>>>', 'lat= ' + lat + '>>>>>>>', 'key=' + key);
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=8&units=S&key=${key}`;

    return superagent.get(url)
        .then(weatherData => {
            let data = weatherData.body.data;
            console.log(data);
            return data;
        })
        .then(weatherData => {

            weatherSummaries = weatherData.map(val => {
                return new Weather(val)
            });
            return weatherSummaries
        });
}

function Weather(day) {
    this.forecast = day.weather.description;
    this.time = new Date(day.valid_date).toString().slice(0, 15);
}



function parkHandler(request, response) {
    const city = request.query.search_query;
    // console.log(city);
    let key = process.env.PARK_KEY;

    let URL = `https://developer.nps.gov/api/v1/parks?limit=10&q=${city}&api_key=${key}`;
    // console.log(URL);

    superagent.get(URL)
        .then(geoData => {
            console.log(geoData.body.data);
            let localpark = [];
            geoData.body.data.forEach(element => {
                let parkel = new park(element);
                localpark.push(parkel);
            }); 
            response.status(200).send(localpark);
        })
        .catch(() => {
            errorHandler('something went wrong in gtting the data from locationiq web', request, response)
        })

}
function park(geoData) {
    this.name = geoData.fullName;
    this.address = geoData.addresses[0].line1 +' ' + geoData.addresses[0].city +' '+  geoData.addresses[0].stateCode +' ' + geoData.addresses[0].postalCode;
    this.fee = geoData.entranceFees[0].cost;
    this.description = geoData.description;
    this.url = geoData.url;
}

// function parkHandler(request, response) {
//     response.status(404).send("parkHandler");
// }





function notFoundHandler(req, res) {
    res.status(404).send('Not Found');
};

function errorHandler(error, req, res) {
    res.status(500).send(error);
};


app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})