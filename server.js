'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

app.use(express.static('./public'));

app.use(cors());

app.get('/location', (req, res) => {
  const location_Json = require('./data/location.json');
  const cityREQ = req.query.city;
  let locationData = new Location(cityREQ, location_Json);
  res.status(200).send(locationData);

})

app.get('/weather', (req, res) => {
  const weather = require('./data/weather.json');

  let weatherArr = [];
  weather.data.forEach(element => {
      let time = element.datetime;
      let forecast = element.weather.description
      let weatherData = new Weather(forecast, time);
      weatherArr.push(weatherData);

  });
  res.status(200).send(weatherArr);
  

});

function Location(cityREQ, location_Json) {
  this.search_query = cityREQ;
  this.formatted_query = location_Json[0].display_name;
  this.latitude = location_Json[0].lat;
  this.longitude = location_Json[0].lon;
}

function Weather(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}

app.use('*', (request, response) => response.status(500).send('Sorry, something went wrong'));

app.listen(PORT,() => console.log(`Listening on port ${PORT}`));

