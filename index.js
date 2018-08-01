var options = {
  url: "http://localhost:8545",
  contract: "0x4d8fc1453a0f359e99c9675954e656d80d996fbf"
};

var Web3 = require('web3');
var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider(options.url));

console.log(web3);