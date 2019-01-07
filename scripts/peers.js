var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request');

var COUNT = 5000; //number of blocks to index

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    request({uri: 'http://127.0.0.1:' + settings.port + '/api/getpeerinfo', json: true}, function (error, response, body) {
      var livepeers = [];
      lib.syncLoop(body.length, function (loop) {
        var i = loop.iteration();
        var address = body[i].addr.split(':')[0];
        livepeers[i] = address;
	db.purge_peers();
        db.find_peer(address, function(peer) {
          if (peer) {
            // peer already exists
            loop.next();
          } else {
            request({uri: 'http://api.ipstack.com/' + address +'?access_key=' + settings.peers.ipstack_api_key, json: true}, function (error, response, geo) {
              db.create_peer({
                address: address,
                protocol: body[i].version,
                version: body[i].subver.replace('/', '').replace('/', ''),
                country: geo.country_name
              }, function(){
                loop.next();
              });
            });
          }
        });
      },function(){
        db.get_peers(function(peers){
			for( var i = 0; i < peers.length; i++){
				if(!livepeers.includes(peers[i].address)){
				  console.log("Address doesnt exist: ", peers[i].address);
				  db.delete_peer(peers[i].address);
				}else{
					console.log("Address exists: ", peers[i].address);
				}
            }
		  console.log('done');
		  exit();
        });
      });
    });
  };
});
