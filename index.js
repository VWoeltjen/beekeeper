var options = {
  url: "http://localhost:8545",
  contract: "0x4d8fc1453a0f359e99c9675954e656d80d996fbf",
  step: 100000,
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
  return db.put({
    _id: event.blockNumber + "/" + event.id,
    event: event
  });
}

function retrieveEvents(start, end) {
  var step = options.step;
  return (end - start >= step) ?
    retrieveEvents(start, start + step - 1).then(
      retrieveEvents.bind(null, start + step, end)
    ) :
    token.getPastEvents("Transfer", { 
      fromBlock: start, 
      toBlock: end 
    }).then(function (events) {
      return events.map(keep);
    });
}

db.allDocs({
  include_docs: true,
  limit: 1,
  descending: true
}).then(function (response) {
  return response.rows.length > 0 ? 
    response.rows[0].doc.event.blockNumber + 1 : 0;
}).then(function (start) {
  return web3.eth.getBlock('latest').then(function (block) {
    return retrieveEvents(start, block.number);
  });
});

// web3.eth.getBlock('latest').then(function (block) {
//   var step = options.step;
//   var end = block.number;
//   var start = Math.floor((end - 1) / step) * step;
//   queryEvents(start, end, step);
// });
//
// app.use(express.static('static'));
// app.listen(8080);