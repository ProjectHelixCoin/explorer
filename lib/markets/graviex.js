var request = require('request');

var base_url = 'https://api.coingecko.com/api/v3/coins/helix';

//
//  Get Market From GravieX
//
function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=base_url;
  request({"rejectUnauthorized": false, uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {
      summary['ask'] = parseFloat(body['ticker']['buy']).toFixed(8);
      summary['bid'] = parseFloat(body['ticker']['sell']).toFixed(8);
      summary['volume'] = parseFloat(body['ticker']['vol']).toFixed(8);
      summary['volume_btc'] = parseFloat(body['ticker']['volbtc']).toFixed(8);
      summary['high'] = parseFloat(body['ticker']['high']).toFixed(8);
      summary['low'] = parseFloat(body['ticker']['low']).toFixed(8);
      summary['last'] = parseFloat(body['tickers'][0]['converted_last']['btc']).toFixed(8);
      summary['change'] = parseFloat(body['ticker']['change']);
      return cb(null, summary);
    } else {
      return cb(error, null);
    }
  });   
}
// Get Trades
function get_trades(coin, exchange, cb) {
    return cb('not realized', summary);
}
//Get Orders
function get_orders(coin, exchange, cb) {
    return cb('not realized', summary);
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
   // get_orders(coin, exchange, function(err, buys, sells) {
     // if (err) { error = err; }
      //get_trades(coin, exchange, function(err, trades) {
        //if (err) { error = err; }
        get_summary(coin, exchange,  function(err, stats) {
          if (err) { error = err; }
          //return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
          return cb(error, {buys: [], sells: [], chartdata: [], trades: [], stats: stats});
        });
      //});
   // });
  }
};
