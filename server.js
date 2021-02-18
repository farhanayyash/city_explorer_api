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

function Location(cityREQ, location_Json) {
  this.search_query = cityREQ;
  this.formatted_query = location_Json[0].display_name;
  this.latitude = location_Json[0].lat;
  this.longitude = location_Json[0].lon;
}

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

app.listen(PORT,() => console.log(`Listening on port ${PORT}`));

