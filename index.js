var options = {
  url: "http://localhost:8545"
};

var Web3 = require('web3');
var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider(options.url));

console.log(web3);