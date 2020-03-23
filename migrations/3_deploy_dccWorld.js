var DecentracraftItem = artifacts.require("./DecentracraftItem.sol");
var Decentracraft = artifacts.require("./Decentracraft.sol");
var DecentracraftWorld = artifacts.require("./DecentracraftWorld.sol");
var ProvableRNG = artifacts.require("./Utils/ProvableRNG.sol");
var MockRNG = artifacts.require("./Utils/MockRNG.sol");

module.exports = async function(deployer) {
  process.env.NETWORK = deployer.network;

  let dccItem = await DecentracraftItem.deployed();
  console.log("DecentracraftItem = " + dccItem.address);

  let dcc     = await Decentracraft.deployed();
  console.log("Decentracraft = " + dcc.address);

  let olddccWorld = await DecentracraftWorld.deployed();
  console.log("Old DecentracraftWorld = " + olddccWorld.address);

  if(deployer.network != "ropsten"){
    let mockrng = await MockRNG.deployed();
    console.log("MockRNG = " + MockRNG.address);
    await deployer.deploy(DecentracraftWorld, Decentracraft.address, MockRNG.address);
  }
  else{
    let provablerng = await ProvableRNG.deployed();
    console.log("ProvableRNG = " + ProvableRNG.address);
    await deployer.deploy(DecentracraftWorld, Decentracraft.address, ProvableRNG.address);
  }
  await DecentracraftWorld.deployed();
  console.log("New DecentracraftWorld = " + DecentracraftWorld.address);
  console.log("Old DecentracraftWorld = " + olddccWorld.address);

  let dccowner = await dcc.owner.call();
  console.log("Decentracraft Old Owner = " + dccowner);
  await olddccWorld.updateDCCWorldAddress(DecentracraftWorld.address);
  dccowner = await dcc.owner.call();
  console.log("Decentracraft New Owner = " + dccowner);

};