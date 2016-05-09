var config = require('./config');
var ShipStation = require('./orders');
var sss = new ShipStation(config.ss_api_key, config.ss_api_secret);
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./aws_config.json');
var lambda = new AWS.Lambda();

exports.handler = function(event, context) {
  /*
  add properties to event
  params: startDate/endDate
  */
  console.log("Running...");

  switch (event.type) {
    case 'orders':
      console.log('Doing Orders');
      sss.getOrders()
      .end(function(res) {
        var pages = res.body.pages
        for (var i = 1; i < (pages + 1); i++) {
          sss.getOrders(i)
          .end(function(pagesResponse) {
            var orders = sss.serializeOrdersForPg(res.body.orders)
            if (orders.length == 0) {
              context.done("Zero Orders")
              return
            }
            orders = JSON.stringify({type: 'orders', orders: orders})
            lambda.invoke({FunctionName: 'OrdersToDB', Payload: orders}, function(err, data) {
              if (err) { context.fail(err);}
              console.log("Sending Page " + i + " of Orders to OrdersToDB Lambda");
            });
          });
        }
      });
      break;
    case 'shipments':
    console.log('Doing Shipments');
      sss.getShipments()
      .end(function(res) {
        var pages = res.body.pages
        for (var i = 1; i < (pages + 1); i++) {
          sss.getShipments(i)
          .end(function(pagesResponse) {
            var shipments = sss.serializeShipmentsForPg(res.body.shipments)
            if (shipments.length == 0) {
              context.done("Zero Shipments")
              return
            }
            shipments = JSON.stringify({type: 'shipments', shipments: shipments})
            lambda.invoke({FunctionName: 'OrdersToDB', Payload: shipments}, function(err, data) {
              if (err) { context.fail(err);}
              console.log("Sending Page " + i + " of Shipments to OrdersToDB Lambda");
            });
          });
        }
      });
      break;
    default:
      context.done("Don't Know What To Do")
  }
};
