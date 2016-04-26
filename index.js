var config = require('./config');
var pg = require('./db');
var ShipStationSyncOrders = require('./orders');
var moment = require('moment-timezone');
var db = pg.db;
var pgp = pg.pgp;
var sss = new ShipStationSyncOrders(config.ss_api_key, config.ss_api_secret);
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./aws_config.json');

var lambda = new AWS.Lambda();

exports.handler = function(event, context) {


  var params = {
    "modifyDateEnd": moment().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss'),
    "modifyDateStart": moment().tz('America/Denver').subtract(2, 'hours').format('YYYY-MM-DD HH:mm:ss'),
    "pageSize": 500
  }

  sss.buildUrl('/orders', params);
  console.log("Running...");
  sss.getOrders(0)
  .end(function(res) {
    var pages = res.body.pages
    for (var i = 1; i < (pages + 1); i++) {
      sss.getOrders(i)
      .end(function(pagesResponse) {
        var orders = sss.serializeForPg(res.body.orders)
        orders = JSON.stringify({orders: orders})
        if (orders.length == 0) {
          console.log(res.body);
          context.done("Zero Orders")
        }
        lambda.invoke({FunctionName: 'OrdersToDB', Payload: orders}, function(err, data) {
          if (err) { context.fail(err);}
        });
      });
    }
  });
};
