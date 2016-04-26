var config = require('./config');
var promise = require('bluebird');

var options = {
  promiseLib: promise
};
var cn = {
  host: config.host, // server name or IP address;
  port: 5432,
  database: config.database,
  user: config.username,
  password: config.password
};

var pgp = require('pg-promise')(options);
var db = pgp(cn);
module.exports = {
  pgp: pgp,
  db: db
};
