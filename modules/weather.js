'use strict';
const superagent = require('superagent');

let all_weather = {};


all_weather.weatherHandler= function(request, response) {
  let lat = request.query.latitude;
  let lon = request.query.longitude;
  all_weather.getWeather(lat, lon)
      .then(val => {
          response.status(200).json(val);
      });
}

all_weather.getWeather= function(lat, lon) {
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
              return new all_weather.Weather(val)
          });
          return weatherSummaries
      });
}

all_weather.Weather=function(day) {
  this.forecast = day.weather.description;
  this.time = new Date(day.valid_date).toString().slice(0, 15);
}




module.exports = all_weather;