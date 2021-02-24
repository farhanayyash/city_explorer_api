'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const all_location = require('./modules/location');
const all_weather = require('./modules/weather');

const superagent = require('superagent');

// console.log(all_location);

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

// const client = new pg.Client(process.env.DATABASE_URL);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });


// handle the main route

app.get('/', (request, response) => {
    response.status(200).send('Welcome to my page for testing API');
});

app.get('/location', locationHandling);
app.get('/weather', all_weather.weatherHandler);
app.get('/parks', parkHandler);
app.get('/movies', moviesHandiling);
app.get('/yelp', yelpHandiling);

app.get('/all',(req,res)=>{
    let SQL = `SELECT * FROM locations;`;
    client.query(SQL)
    .then(results =>{
        // console.log(results);
        res.send(results.rows);
    })
   
})




app.use('*', notFoundHandler);
app.use(errorHandler);




function locationHandling(req, res) {
    const cityData = req.query.city;
    let locationAPIKey = process.env.GEOCODE_API_KEY;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${locationAPIKey}&q=${cityData}&format=json`;

    let selectAllSQL = `SELECT * FROM locations;`;
    let selectSQL = `SELECT * FROM locations WHERE search_query=$1;`;
    let safeValues = [];
    console.log(client.query(selectAllSQL));
    client.query(selectAllSQL).then((result) => {
        if (result.rows.length <= 0) {
            superagent.get(url).then((data) => {
                console.log(`from API`);
                const locationData = new Location( cityData ,data.body);
                insertLocationInDB(locationData);
                console.log(locationData);
                res.status(200).josn(locationData);
            });
        } else {
            safeValues = [cityData];
            client.query(selectSQL, safeValues).then((result) => {
                if (result.rows.length <= 0) {
                    superagent.get(url).then((data1) => {
                        console.log(`From API Again`);
                        const locationData = new Location( cityData ,data1.body);
                        
                        insertLocationInDB(locationData);
                        // console.log(locationData);
                        res.status(200).json(locationData);
                    });
                } else {
                    console.log('form data base');
                    res.status(200).json(result.rows[0]);
                }
            });
        }
    });
}



function insertLocationInDB(obj) {
    let insertSQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4);`;
    let safeValues = [
        obj.search_query,
        obj.formatted_query,
        obj.latitude,
        obj.longitude,
    ];
    client.query(insertSQL, safeValues).then(() => {
        console.log('storing data in database');
    });
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


function moviesHandiling(req, res) {
    let formated_query = req.query.search_query;
    const moviesAPIKey = process.env.MOVIE_API_KEY;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${moviesAPIKey}&query=${formated_query}&page=1`;
    superagent
        .get(url)
        .then((data) => {
            console.log(data.body.results);
            let moviesArray = data.body.results.map((data) => {
                // console.log(moviesArray);
                return new Movies(data);
            });
            res.status(200).json(moviesArray);
        })
        .catch(() => {
            errorPage(req, res, 'Something wrong wiht movies API');
        });
}

function Movies(data) {
    this.title = data.title;
    this.overview = data.overview;
    this.average_votes = data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/original${data.poster_path}`;
    this.popularity = data.popularity;
    this.released_on = data.release_date;
}

function yelpHandiling(req, res) {
    let lat = req.query.latitude;
    let lon = req.query.longitude;
    let pagenum = req.query.page;
    let x = (pagenum-1)*5;
    let url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${lat}&longitude=${lon}&limit=5&offset=${x}`;
    console.log(url);
    superagent
        .get(url)
        .set({
            Authorization: 'Bearer ' + process.env.YELP_API_KEY,
        })
        .accept('application/json')
        .then((data) => {
            let yelpArray = data.body.businesses.map((resturant) => {
                return new Yelp(resturant);
            });
            res.status(200).json(yelpArray);
        })
        .catch(() => {
            errorPage(req, res, 'Somthing Went Error in Yelp API');
        });
}
function Yelp(data) {
    (this.name = data.name),
        (this.image_url = data.image_url),
        (this.price = data.price),
        (this.rating = data.rating),
        (this.url = data.url);
}


// function tryskHandler(request, response) {
//     console.log("hii");
//     response.status(200).send('HI');
// }



function notFoundHandler(req, res) {
    res.status(404).send('Not Found');
};

function errorHandler(error, req, res) {
    res.status(500).send(error);
};




client.connect()
.then(()=>{
    app.listen(PORT, () =>
    console.log(`listening on ${PORT}`)
    );
})
