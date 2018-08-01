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

var abi = require('./static/bee.json');
var token = new web3.eth.Contract(abi, options.contract);

var transfers = [];

web3.setProvider(new web3.providers.HttpProvider(options.url));

token.methods.name().call().then(function (name) {
  console.log(name);
});

function queryEvents(start, end, step) {
  token.getPastEvents("Transfer", { fromBlock: start, toBlock: end }).then(function (events) {
    console.log(start, end, events.length);
    transfers = events.concat(transfers);
    if (start > options.epoch) {
      start = Math.max(start - step, options.epoch);
      end = start + step - 1;
      queryEvents(start, end, step);
    } else {
      var fs = require('fs');
      fs.writeFileSync("events.json", JSON.stringify(events));
    }
  });
}

web3.eth.getBlock('latest').then(function (block) {
  var step = options.step;
  var end = block.number;
  var start = Math.floor((end - 1) / step) * step;
  queryEvents(start, end, step);
});

// token.getPastEvents("Transfer", { fromBlock: 5184660, toBlock: 5284660 }).then(function (events) {
//   console.log(events);
// });

app.use(express.static('static'));
app.listen(8080);