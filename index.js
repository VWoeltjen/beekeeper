var options = {
  url: "http://localhost:8545",
  contract: "0x4d8fc1453a0f359e99c9675954e656d80d996fbf",
  step: 10000,
  epoch: 5184660
};

try {
  var overrides = require('./options.json');
  Object.keys(overrides).forEach(function (key) {
    options[key] = overrides[key];
  });
} catch (e) {
  // ...use default options when options.json is not present
}

var express = require('express');
var app = express();

var Web3 = require('web3');
var web3 = new Web3();

var PouchDB = require('pouchdb');
var db = new PouchDB('events');

var abi = require('./static/bee.json');
var token = new web3.eth.Contract(abi, options.contract);

var transfers = [];

web3.setProvider(new web3.providers.HttpProvider(options.url));

function keep(event) {
  console.log("Storing event " + event.id + " from block " + event.blockNumber);
  return db.put({
    _id: event.blockNumber + "/" + event.id,
    event: event
  });
}

function retrieveEvents(start, end) {
  var toBlock = Math.min(end, start + options.step - 1);
  console.log("Retrieving events from block " + start + " to " + toBlock);
  return token.getPastEvents("Transfer", {
    fromBlock: start,
    toBlock: toBlock
  }).then(function (events) {
    return events.map(keep);
  }).then(function () {
    if (end > toBlock) {
      return retrieveEvents(toBlock + 1, end);
    }
  }).catch(function (err) {
    console.log("Failed to retrieve events.");
    console.log(err);
  });
}

db.allDocs({
  include_docs: true,
  limit: 1,
  descending: true
}).then(function (response) {
  return response.rows.length > 0 ? 
    response.rows[0].doc.event.blockNumber + 1 : options.epoch;
}).then(function (start) {
  console.log("Updating event database...");
  return web3.eth.getBlock('latest').then(function (block) {
    return retrieveEvents(start, block.number);
  });
}).then(function () {
  console.log("Event database updated.");
});

app.get("/from", function (req, res, next) {
  console.log("Requesting all addresses from which we see transfers, at /from");
  db.allDocs({ include_docs: true }).then(function (response) {
    var addresses = response.rows.map(function (row) {
      return row.doc.event.returnValues.from;
    }).sort().reduce(function (array, address) {
      return array[array.length - 1] === address ? array : array.concat([address]);
    }, []);
    res.send(JSON.stringify(addresses));
  });  
});

app.get("/to", function (req, res, next) {
  console.log("Requesting all addresses from which we see transfers, at /from");
  db.allDocs({ include_docs: true }).then(function (response) {
    var addresses = response.rows.map(function (row) {
      return row.doc.event.returnValues.to;
    }).sort().reduce(function (array, address) {
      return array[array.length - 1] === address ? array : array.concat([address]);
    }, []);
    res.send(JSON.stringify(addresses));    
  });
});

app.use(express.static('static'));

app.listen(8080);
