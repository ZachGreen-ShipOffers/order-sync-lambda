var unirest = require('unirest');
var config = require('./config');


var ShipStationSyncOrders = function(key, secret) {
  this.baseUrl = 'https://ssapi.shipstation.com'
  this.key = key
  this.secret = secret
  const b = new Buffer(config.ss_api_key + ':' + config.ss_api_secret);
  this.headers = {
    "Authorization": "Basic " + b.toString('base64'),
    "Content-Type": "application/json"
  }
}

ShipStationSyncOrders.prototype.buildUrl = function(path, params) {
  var p = this.baseUrl + path + '?' + this.toQuery(params)
  this.fullURL = p
}

ShipStationSyncOrders.prototype.toQuery = function(params) {
  var a = []
  for (var p in params) {
    a.push(p + '=' + params[p])
  }
  return a.join('&');
}

ShipStationSyncOrders.prototype.getOrders = function(page) {
  if (page == 0) {
    var url = this.fullURL
  } else {
    var url = this.fullURL + "&page=" + page
  }
  // console.log("Calling " + this.fullURL);
  return unirest.get(url, this.headers)
}

ShipStationSyncOrders.prototype.formatItems = function(id, items) {
  s = []
  for (var i = 0; i < items.length; i++) {
    var other = {}
    other['ship_station_order_id'] = id
    other['order_item_id'] = items[i].orderItemId
    other['line_item_key'] = items[i].lineItemKey
    other['sku'] = items[i].sku
    other['name'] = items[i].name
    other['image_url'] = items[i].imageUrl

    if (items[i].weight == null) {
      other['weight_value'] = null
      other['weight_unit'] = null
    } else {
      other['weight_value'] = items[i].weight.value
      other['weight_unit'] = items[i].weight.unit
    }

    other['quantity'] = items[i].quantity
    other['unit_price'] = items[i].unitPrice
    other['tax_amount'] = items[i].taxAmount
    other['shipping_amount'] = items[i].shippingAmount
    other['warehouse_location'] = items[i].warehouseLocation
    other['options'] = items[i].options
    other['product_id'] = items[i].productId
    other['fulfillment_sku'] = items[i].fulfillmentSku
    other['adjustment'] = items[i].adjustment
    other['upc'] = items[i].upc
    other['create_date'] = items[i].createDate
    other['modify_date'] = items[i].modifyDate
    s.push(other)
  }
  return s;
}

ShipStationSyncOrders.prototype.serializeForPg = function(orders) {
  var o = []
  for (var i = 0; i < orders.length; i++) {
    o.push({
      id: orders[i].orderId,
      ship_station_store_id: orders[i].advancedOptions.storeId,
      order_number: orders[i].orderNumber,
      order_key: orders[i].orderKey,
      order_date: orders[i].orderDate,
      order_status: orders[i].orderStatus,
      email: orders[i].customerEmail,
      carrier_code: orders[i].carrierCode,
      service_code: orders[i].serviceCode,
      package_code: orders[i].packageCode,
      name: orders[i].shipTo.name,
      company: orders[i].shipTo.company,
      street1: orders[i].shipTo.street1,
      street2: orders[i].shipTo.street2,
      street3: orders[i].shipTo.street3,
      city: orders[i].shipTo.city,
      state: orders[i].shipTo.state,
      postal_code: orders[i].shipTo.postalCode,
      country: orders[i].shipTo.country,
      phone: orders[i].shipTo.phone,
      residential: orders[i].shipTo.residential,
      address_verified: orders[i].shipTo.addressVerified,
      ship_date: orders[i].shipDate,
      customer_notes: orders[i].customerNotes,
      internal_notes: orders[i].internalNotes,
      custom_field1: orders[i].advancedOptions.customField1,
      custom_field2: orders[i].advancedOptions.customField2,
      custom_field3: orders[i].advancedOptions.customField3,
      parent_id: orders[i].advancedOptions.parentId,
      merged_or_split: orders[i].advancedOptions.mergedOrSplit,
      items: this.formatItems(orders[i].orderId, orders[i].items)
    })
  }
  return o;
}




module.exports = ShipStationSyncOrders
