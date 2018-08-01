var options = {
  url: "http://localhost:8545",
  contract: "0x4d8fc1453a0f359e99c9675954e656d80d996fbf"
};

var Web3 = require('web3');
var web3 = new Web3();

// From https://github.com/ethereum/wiki/wiki/Contract-ERC20-ABI
var erc20 = require('./bee.json');
var token = new web3.eth.Contract(erc20, options.contract);

web3.setProvider(new web3.providers.HttpProvider(options.url));

web3.eth.call({
  to: options.contract,
  data: token.methods.name().encodeABI()
}).then(function (result) {
  console.log(result);
}).catch(function (error) {
  console.log(error);
});
