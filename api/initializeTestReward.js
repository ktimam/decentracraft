const { waitForEvent } = require('../app/utils/utils');

const Contracts = require('../app/contracts.js');
const { web3, ServerPublicURL } = require('../app/contracts.js');

// Get resources packages listed for wholesale
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering initializeTestData");
    var bodyjson = JSON.parse(req.body);
    // console.log("bodyjson = " + bodyjson);
    var player = bodyjson.player;
    console.log("player = " + player);
    // var resourceId = bodyjson.resourceId;
    // console.log("resourceId = " + resourceId);
    var rewardRatio = bodyjson.rewardRatio;
    console.log("rewardRatio = " + rewardRatio);
    var ownerKey = bodyjson.ownerKey;
    console.log("ownerKey = " + ownerKey);

    var reservedToPublicKey = bodyjson.reservedToPublicKey;
    console.log("reservedToPublicKey = " + reservedToPublicKey);
    var reservedToKey = bodyjson.reservedToKey;
    console.log("reservedToKey = " + reservedToKey);

    var decentracraftWorld = await Contracts.DecentracraftWorld;
    var decentracraft = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();
    var mockRNGContract = await Contracts.MockRNG;//.deployed();

    ////////////***************************************************************************           Reward to player */
    ///   Resources Reward range from 0-1000   /////////////////
    ///   Items Reward luck from 0-10,000   (0 guranteed & 10,000 will not receive)/////////////////
    console.log("Rewarding 0");
    var contractFunction = await decentracraftWorld.methods.rewardPlayer(0, rewardRatio, player);
    result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, reservedToKey); 
    await sendMockRNG(result, 0, mockRNGContract, ownerKey);   
    
    console.log("Rewarding 1");
    contractFunction = await decentracraftWorld.methods.rewardPlayer(0, rewardRatio, player);
    result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, reservedToKey); 
    await sendMockRNG(result, 0, mockRNGContract, ownerKey);   
    
    console.log("Rewarding 2");
    contractFunction = await decentracraftWorld.methods.rewardPlayer(2, rewardRatio * 5, player);
    result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, reservedToKey);  
    await sendMockRNG(result, 0, mockRNGContract, ownerKey);   
    
    res.json(result);
}

function extractTokenID(tx) {
    for (let l of tx) {
        if (l.event === 'TransferSingle') {
            return l.args._id;
        }
    }
}

async function sendMockRNG(tx, rng, mockRNGContract, ownerKey) {
    if(Contracts.networkId != 50){
        // console.log("Returning from sendMockRNG");
        return;
    }
    console.log("EnteringMockRNG");
    for (let l of tx) {
        if (l.event === 'LogRandomQueryCreated') {   
            var contractFunction = await mockRNGContract.methods.randomReceived(l.args.queryId, rng);
            var result = await Contracts.sendTransaction(mockRNGContract, contractFunction, ownerKey);  
        }
    }
}
