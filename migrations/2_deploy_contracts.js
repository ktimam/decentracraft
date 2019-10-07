var DecentracraftItem = artifacts.require("./DecentracraftItem.sol");
var Decentracraft = artifacts.require("./Decentracraft.sol");

module.exports = function(deployer) {
  //var dci = await deployer.deploy(DecentracraftItem);
  //deployer.deploy(Decentracraft, dci);

  deployer.deploy(DecentracraftItem).then(function() {
    return deployer.deploy(Decentracraft, DecentracraftItem.address)
  });
};