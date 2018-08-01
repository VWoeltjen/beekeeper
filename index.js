var options = {
  url: "http://localhost:8545",
  contract: "0x4d8fc1453a0f359e99c9675954e656d80d996fbf"
};

var Web3 = require('web3');
var web3 = new Web3();

// From https://github.com/ethereum/wiki/wiki/Contract-ERC20-ABI
var erc20 = require('./erc20.json');
var token = new web3.eth.Contract(erc20, options.contract);

web3.setProvider(new web3.providers.HttpProvider(options.url));

console.log(token);