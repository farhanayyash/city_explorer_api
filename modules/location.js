'use strict';
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');

// const client = new pg.Client(process.env.DATABASE_URL);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

let all_location = {};




all_location.locationHandling = function (req, res) {
  const cityData = req.query.city;
  let locationAPIKey = process.env.GEOCODE_API_KEY;
  const url = `https://eu1.locationiq.com/v1/search.php?key=${locationAPIKey}&q=${cityData}&format=json`;
  let selectAllSQL = `SELECT * FROM locations;`;
  let selectSQL = `SELECT * FROM locations WHERE search_query=$1;`;
  let safeValues = [];

  client.query(selectAllSQL).then((result) => {
      if (result.rows.length <= 0) {
          superagent.get(url).then((data) => {
              console.log(`from API`);
              const locationData = new all_location.Location( cityData ,data.body);
              all_location.insertLocationInDB(locationData);
              res.status(200).josn(locationData);
          });
      } else {

          safeValues = [cityData];
          client.query(selectSQL, safeValues).then((result) => {
              if (result.rows.length <= 0) {
                  superagent.get(url).then((data1) => {
                      console.log(`From API Again`);
                      const locationData = new all_location.Location( cityData ,data1.body);
                      
                      all_location.insertLocationInDB(locationData);
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



all_location.insertLocationInDB = function(obj) {
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

all_location.Location = function(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

client.connect()


module.exports = all_location;