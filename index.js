var options = {
  url: "http://localhost:8545",
  contract: "0x4d8fc1453a0f359e99c9675954e656d80d996fbf"
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

web3.setProvider(new web3.providers.HttpProvider(options.url));

token.methods.name().call().then(function (name) {
  console.log(name);
});

// app.use(express.static('static'));
// app.listen(8080);