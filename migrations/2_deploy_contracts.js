var DecentracraftItem = artifacts.require("./DecentracraftItem.sol");
var Decentracraft = artifacts.require("./Decentracraft.sol");
var DecentracraftWorld = artifacts.require("./DecentracraftWorld.sol");
var ProvableRNG = artifacts.require("./Utils/ProvableRNG.sol");
var MockRNG = artifacts.require("./Utils/MockRNG.sol");

module.exports = function(deployer) {
  //var dci = await deployer.deploy(DecentracraftItem);
  //deployer.deploy(Decentracraft, dci);

  // var dci = await DecentracraftItem.new();//deployer.deploy(DecentracraftItem);
  // var dcc = await Decentracraft.new(dci);//deployer.deploy(Decentracraft, dci);
  // var rng = await ProvableRNG.new(ProvableRNG);//deployer.deploy(ProvableRNG);
  // var dccworld = await DecentracraftWorld.new(dcc, rng);//deployer.deploy(DecentracraftWorld, dcc, rng);
  // await dcc.setOwner(dccworld);

  process.env.NETWORK = deployer.network;
  
  // console.log("deployer.network = " + deployer.network);

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
    // console.log("Decentracraft = " + Decentracraft.address);
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
    // console.log("Decentracraft = " + instance.address);
    // console.log("DecentracraftWorld = " + DecentracraftWorld.address);
    instance.setOwner(DecentracraftWorld.address);

    return DecentracraftWorld.deployed();
  });
};