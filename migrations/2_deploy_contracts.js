var DecentracraftItem = artifacts.require("./DecentracraftItem.sol");
var Decentracraft = artifacts.require("./Decentracraft.sol");
var DecentracraftWorld = artifacts.require("./DecentracraftWorld.sol");
var ProvableRNG = artifacts.require("./Utils/ProvableRNG.sol");
var MockRNG = artifacts.require("./Utils/MockRNG.sol");

module.exports = function(deployer) {
  process.env.NETWORK = deployer.network;

  deployer.deploy(DecentracraftItem).then(function() {
    return DecentracraftItem.deployed();
  }).then(function(){
    console.log("DecentracraftItem = " + DecentracraftItem.address);
    return deployer.deploy(Decentracraft, DecentracraftItem.address);
  }).then(function() {
    DecentracraftItem.deployed().then(function(instance){
      instance.setOwner(Decentracraft.address);
    });
    console.log("Decentracraft = " + Decentracraft.address);
    if(deployer.network != "ropsten"){
      return deployer.deploy(MockRNG);
    }
    else{
      return deployer.deploy(ProvableRNG);
    }
  }).then(function() {
    if(deployer.network != "ropsten"){
      console.log("MockRNG = " + MockRNG.address);
      return deployer.deploy(DecentracraftWorld, Decentracraft.address, MockRNG.address);
    }
    else{
      console.log("ProvableRNG = " + ProvableRNG.address);
      return deployer.deploy(DecentracraftWorld, Decentracraft.address, ProvableRNG.address);
    }
  }).then(function(){
    console.log("DecentracraftWorld = " + DecentracraftWorld.address);
    return Decentracraft.deployed();
  }).then(function(instance){
    instance.setOwner(DecentracraftWorld.address);

    return DecentracraftWorld.deployed();
  });
};