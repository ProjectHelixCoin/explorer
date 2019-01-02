var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request')
  , cmp = require('semver-compare');

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
        var version = body[i].subver.replace('/', '').replace('/', '');
        var semver = version.split(":")[1];
        livepeers[i] = address;
        db.find_peer(address, function(peer) {
          if (peer) {
              //console.log('Live version is: ', semver); //remove this if you'd like
              for(i=0; i<peer.length; i++){
                // cmp(a,b)
                // result 1 = a is greater than b
                // result 0 = a is the same as b
                // result -1 = a is less than b
                if(cmp(peer[i].version.split(":")[1], semver) == -1){
                  db.delete_peer({_id:peer[i]._id});
                  request({uri: 'http://api.ipstack.com/' + address + '?access_key=' + settings.iplookup.apikey, json: true}, function (error, response, geo) {
                    db.create_peer({
                      address: address,
                      protocol: body[i].version,
                      version: version,
                      //semver: semver,
                      country: geo.country_name
                    }, function(){
                      loop.next();
                    });
                  });
                  //console.log('Delete the db version:', peer[i].version.split(":")[1]); //remove
                } else if(cmp(peer[i].version.split(":")[1], semver) == 0){
                    //console.log('Do nothing, they\'re the same');
                } else {
                  //db.delete_peer({_id:peer[i]._id}); //not sure how this should be handled
                  //console.log('This should never occur, Live Version:', semver, " Is less than:", peer[i].version.split(":")[1]); //remove
                }
              }
              loop.next();
          } else {
            request({uri: 'http://api.ipstack.com/' + address + '?access_key=' + settings.iplookup.apikey, json: true}, function (error, response, geo) {
              db.create_peer({
                address: address,
                protocol: body[i].version,
                version: version,
                //semver: semver,
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
              db.delete_peer({address:peers[i].address});
            }
          }
		      //console.log('done');
		      exit();
        });
      });
    });
  };
});