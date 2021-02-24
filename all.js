'use strict';

const pg = require('pg');

// const client2 = new pg.Client(process.env.DATABASE_URL);

const client2 = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });

let all_try = {}


all_try.tryhandler = function (req,res){
  let SQL = `SELECT * FROM locations;`;
  client2.query(SQL)
  .then(results =>{
      res.send(results.rows);
  })
}

client2.connect()

module.exports = all_try;