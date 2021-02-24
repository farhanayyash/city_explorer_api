'use strict';
const superagent = require('superagent');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);


let all_location = {};




all_location.locationHandling = function (req, res) {
  const cityData = req.query.city;
  let locationAPIKey = process.env.GEOCODE_API_KEY;
  const url = `https://eu1.locationiq.com/v1/search.php?key=${locationAPIKey}&q=${cityData}&format=json`;

  let selectAllSQL = `SELECT * FROM locations;`;
  let selectSQL = `SELECT * FROM locations WHERE search_query=$1;`;
  let safeValues = [];
  console.log("hi1");
  console.log(client.query(selectAllSQL));
  client.query(selectAllSQL).then((result) => {
      if (result.rows.length <= 0) {
          superagent.get(url).then((data) => {
              console.log(`from API`);
              const locationData = new this.Location( cityData ,data.body);
              this.insertLocationInDB(locationData);
              console.log(locationData);
              res.status(200).josn(locationData);
          });
      } else {
        console.log("hi4");

          safeValues = [cityData];
          client.query(selectSQL, safeValues).then((result) => {
              if (result.rows.length <= 0) {
                  superagent.get(url).then((data1) => {
                      console.log(`From API Again`);
                      const locationData = new this.Location( cityData ,data1.body);
                      
                      this.insertLocationInDB(locationData);
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
  console.log("hi3");

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
console.log(all_location.locationHandling);

module.exports = all_location;