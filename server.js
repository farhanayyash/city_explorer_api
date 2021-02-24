'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const all_location = require('./modules/location');
const all_weather = require('./modules/weather');
const all_try = require('./all');

const superagent = require('superagent');


const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

// const client = new pg.Client(process.env.DATABASE_URL);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });


// handle the main route

app.get('/', (request, response) => {
    response.status(200).send('Welcome to my page for testing API');
});

app.get('/location', all_location.locationHandling);
app.get('/weather', all_weather.weatherHandler);
app.get('/parks', parkHandler);
app.get('/movies', moviesHandiling);
app.get('/yelp', yelpHandiling);
app.get('/try', all_try.tryhandler);



app.get('/all',(req,res)=>{
    let SQL = `SELECT * FROM locations;`;
    client.query(SQL)
    .then(results =>{
        res.send(results.rows);
    })
   
})




app.use('*', notFoundHandler);
app.use(errorHandler);




function parkHandler(request, response) {
    const city = request.query.search_query;
    // console.log(city);
    let key = process.env.PARK_KEY;

    let URL = `https://developer.nps.gov/api/v1/parks?limit=10&q=${city}&api_key=${key}`;
    // console.log(URL);

    superagent.get(URL)
        .then(geoData => {
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
