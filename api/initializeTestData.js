const { waitForEvent } = require('../app/utils/utils');

const Contracts = require('../app/contracts.js');
const { web3, ServerPublicURL } = require('../app/contracts.js');

// Get resources packages listed for wholesale
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering initializeTestData");
    var bodyjson = JSON.parse(req.body);
    console.log("bodyjson = " + bodyjson);
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

    var createFunction = await decentracraftWorld.methods.create('', false);
    var result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    let woodTypeID = extractTokenID(result);
    console.log("Wood ID = " + woodTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    let resourceTypeID = extractTokenID(result);
    console.log("Rock ID = " + resourceTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    resourceTypeID = extractTokenID(result);
    console.log("Gold ID = " + resourceTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    resourceTypeID = extractTokenID(result);
    console.log("Diamond ID = " + resourceTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    resourceTypeID = extractTokenID(result);
    console.log("Silicon ID = " + resourceTypeID);

    let hammerUri = ServerPublicURL + 'hammer.json';
    createFunction = await decentracraftWorld.methods.create(hammerUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    let hammerTypeID = extractTokenID(result);
    console.log("Hammer ID = " + hammerTypeID);
    
    let swordUri = ServerPublicURL + 'sword.json';
    createFunction = await decentracraftWorld.methods.create(swordUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    resourceTypeID = extractTokenID(result);
    console.log("Sword ID = " + resourceTypeID);
    
    let stickUri = ServerPublicURL + 'stick.json';
    createFunction = await decentracraftWorld.methods.create(stickUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    resourceTypeID = extractTokenID(result);
    console.log("Computer Chip ID = " + resourceTypeID);

    createFunction = await decentracraftWorld.methods.setDailySupply(woodTypeID, 2000);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    let hammerAttributes = '{"attack": "6","defense": "1","speed": "1"}';
    //Create Resource Package
    createFunction = await decentracraftWorld.methods.addResourcesPackage(web3.utils.toWei("0.5","ether"), [woodTypeID], [1000]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);
    createFunction = await decentracraftWorld.methods.setResourcesNFTsMeta(0, [hammerTypeID], [hammerAttributes], [hammerUri], [100000], [100]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);

    createFunction = await decentracraftWorld.methods.reserveResources(0, reservedToPublicKey);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    // console.log(result);

    var contractFunction = await decentracraftWorld.methods.rewardPlayer(0, rewardRatio, player);
    result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, reservedToKey);  
    // console.log(result);
    var queryID = extractQueryID(result);  
    // console.log("queryID = " + queryID);
    
    contractFunction = await mockRNGContract.methods.randomReceived(queryID, 100);
    result = await Contracts.sendTransaction(mockRNGContract, contractFunction, ownerKey);   
    
    res.json(result);
}

function extractTokenID(tx) {
    for (let l of tx) {
        if (l.event === 'TransferSingle') {
            return l.args._id;
        }
    }
}

function extractQueryID(tx) {
    for (let l of tx) {
        if (l.event === 'LogRandomQueryCreated') {
            return l.args.queryId;
        }
    }
}
