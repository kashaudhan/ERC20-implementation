const dToken = artifacts.require("dToken");
const dTokenSale = artifacts.require("dTokenSale");
const tokenPrice = 1000000000000000;
module.exports = function (deployer) {
  deployer.deploy(dToken, 1000000).then(()=>{
    return deployer.deploy(dTokenSale, dToken.address, tokenPrice);
  });
};
