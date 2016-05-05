var unirest = require('unirest');
var moment = require('moment-timezone');

var ShipStation = function(key, secret) {
  this.baseUrl = 'https://ssapi.shipstation.com'
  const b = new Buffer(key + ':' + secret);
  this.headers = {
    "Authorization": "Basic " + b.toString('base64'),
    "Content-Type": "application/json"
  }

  this.orderParams = {
    "modifyDateEnd": moment().tz('America/Denver').add(2, 'h').add(15, 'm').format('YYYY-MM-DD HH:mm:ss'),
    "modifyDateStart": moment().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss'),
    "pageSize": 500
  }
  this.shipmentParams = {
    "shipDateEnd": moment().tz('America/Denver').add(2, 'h').add(15, 'm').format('YYYY-MM-DD HH:mm:ss'),
    "shipDateStart": moment().tz('America/Denver').format('YYYY-MM-DD HH:mm:ss'),
    "includeShipmentItems": true,
    "pageSize": 500
  }
}

ShipStation.prototype.buildUrl = function(path, params) {
  var p = this.baseUrl + path + '?' + this.toQuery(params)
  this.fullURL = p
}

ShipStation.prototype.toQuery = function(params) {
  var a = []
  for (var p in params) {
    a.push(p + '=' + params[p])
  }
  return a.join('&');
}

ShipStation.prototype.getOrders = function(page) {
  var url = this.baseUrl + '/orders?' + this.toQuery(this.orderParams)
  if (page && page > 0) {
    url = url + "&page=" + page
  }
  return unirest.get(url, this.headers)
}

ShipStation.prototype.getShipments = function(page) {
  var url = this.baseUrl + '/shipments?' + this.toQuery(this.shipmentParams)
  if (page && page > 0) {
    url = url + "&page=" + page
  }
  return unirest.get(url, this.headers)
}

ShipStation.prototype.formatOrderItems = function(id, items) {
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

ShipStation.prototype.serializeOrdersForPg = function(orders) {
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
      items: this.formatOrderItems(orders[i].orderId, orders[i].items)
    })
  }
  return o;
}

ShipStation.prototype.serializeShipmentsForPg = function(shipments) {
  var o = []
  for (var i = 0; i < shipments.length; i++) {
    o.push({
      id: shipments[i].shipmentId,
      ship_station_order_id: shipments[i].orderId,
      ship_station_store_id: shipments[i].advancedOptions.storeId,
      order_number: shipments[i].orderNumber,
      tracking_number: shipments[i].trackingNumber,
      batch_number: shipments[i].batchNumber,
      confirmation: shipments[i].confirmation,
      email: shipments[i].customerEmail,
      carrier_code: shipments[i].carrierCode,
      service_code: shipments[i].serviceCode,
      package_code: shipments[i].packageCode,
      return_label: shipments[i].isReturnLabel,
      voided: shipments[i].voided,
      void_date: shipments[i].voidDate,
      name: shipments[i].shipTo.name,
      company: shipments[i].shipTo.company,
      street1: shipments[i].shipTo.street1,
      street2: shipments[i].shipTo.street2,
      street3: shipments[i].shipTo.street3,
      city: shipments[i].shipTo.city,
      state: shipments[i].shipTo.state,
      postal_code: shipments[i].shipTo.postalCode,
      country: shipments[i].shipTo.country,
      phone: shipments[i].shipTo.phone,
      ship_date: shipments[i].shipDate,
      shipment_cost: shipments[i].shipmentCost,
      insurance_cost: shipments[i].insuranceCost,
      items: this.formatShipmentItems(shipments[i].shipmentId, shipments[i].orderId, shipments[i].shipmentItems)
    })
  }
  return o;
}

ShipStation.prototype.formatShipmentItems = function(id, orderId, items) {
  s = []
  for (var i = 0; i < items.length; i++) {
    var other = {}
    other['ship_station_shipment_id'] = id
    other['ship_station_order_id'] = orderId
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





module.exports = ShipStation
