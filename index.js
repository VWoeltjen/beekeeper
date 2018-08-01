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

["from", "to"].forEach(function (type) {
  var path = "/" + type;
  app.get(path, function (req, res, next) {
    console.log("Requesting all addresses of the " + type + " field, at " + path);
    db.allDocs({ include_docs: true }).then(function (response) {
      var addresses = response.rows.map(function (row) {
        return {
          address: row.doc.event.returnValues[type],
          count: 1,
          value: row.doc.event.returnValues.value,
          url: path + "/" + row.doc.event.returnValues[type]
        };
      }).sort(function (a, b) {
        return a.address.localeCompare(b.address);
      }).reduce(function (array, item) {
        var last = array[array.length - 1]
        if (last && last.address === item.address) {
          last.count += item.count;
          last.value = web3.utils.toBN(last.value).add(web3.utils.toBN(item.value)).toString(10)
        } else {
          array.push(item);
        }
        return array;
      }, []);
      res.send(JSON.stringify(addresses));
    });
  });

  var details = path + "/:address";
  app.get(details, function (req, res, next) {
    var address = req.params.address;
    console.log("Requesting transfers " + type + " address " + address + " at " + details);
    db.allDocs({ include_docs: true }).then(function (response) {
      var transfers = response.rows.filter(function (row) {
        return row.doc.event.returnValues[type] === address;
      }).map(function (row) {
        var event = row.doc.event;
        return {
          transactionHash: event.transactionHash,
          transactionIndex: event.transactionIndex,
          blockNumber: event.blockNumber,
          from: event.returnValues.from,
          to: event.returnValues.to,
          value: event.returnValues.value,
          logIndex: event.logIndex,
          removed: event.removed,
          id: event.id
        };
      });
      res.send(JSON.stringify(transfers));
    });
  });
});

app.use(express.static('static'));

app.listen(8080);
