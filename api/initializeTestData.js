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

    
    //Send ethers to rng contract 
    var sendEthersresult = await Contracts.sendEthers(dciContract.options.address, ownerKey, "0.5");
    // console.log("Ethers sent = " + sendEthersresult);   

    ////////////***************************************************************************           Resources */
    var createFunction = await decentracraftWorld.methods.create('', false);
    var result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let woodTypeID = extractTokenID(result);
    console.log("Wood ID = " + woodTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let rockTypeID = extractTokenID(result);
    console.log("Rock ID = " + rockTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let goldTypeID = extractTokenID(result);
    console.log("Gold ID = " + goldTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let diamondTypeID = extractTokenID(result);
    console.log("Diamond ID = " + diamondTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let siliconTypeID = extractTokenID(result);
    console.log("Silicon ID = " + siliconTypeID);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let ironTypeID = extractTokenID(result);
    console.log("Iron ID = " + ironTypeID);

    createFunction = await decentracraftWorld.methods.setDailySupply(woodTypeID, 2000);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setDailySupply(rockTypeID, 1500);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setDailySupply(ironTypeID, 900);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setDailySupply(goldTypeID, 70);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setDailySupply(diamondTypeID, 15);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setDailySupply(siliconTypeID, 400);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    ////////////***************************************************************************           Items */
    let hammerUri = ServerPublicURL + 'hammer.json';
    createFunction = await decentracraftWorld.methods.create(hammerUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let hammerTypeID = extractTokenID(result);
    console.log("Hammer ID = " + hammerTypeID);
    
    let swordUri = ServerPublicURL + 'sword.json';
    createFunction = await decentracraftWorld.methods.create(swordUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let swordTypeID = extractTokenID(result);
    console.log("Sword ID = " + swordTypeID);
    
    let stickUri = ServerPublicURL + 'stick.json';
    createFunction = await decentracraftWorld.methods.create(stickUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let stickTypeID = extractTokenID(result);
    console.log("Stick ID = " + stickTypeID);

    let axeUri = ServerPublicURL + 'axe.json';
    createFunction = await decentracraftWorld.methods.create(axeUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let axeTypeID = extractTokenID(result);
    console.log("Axe ID = " + axeTypeID);

    let computerChipUri = ServerPublicURL + 'computerchip.json';
    createFunction = await decentracraftWorld.methods.create(computerChipUri, true);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    let computerChipTypeID = extractTokenID(result);
    console.log("Computer Chip ID = " + computerChipTypeID);

    let hammerAttributes = '{"strength": "6","power": "6","attack": "3","defense": "1","speed": "1"}';
    let swordAttributes = '{"strength": "4","power": "3","attack": "6","defense": "3","speed": "5"}';
    let stickAttributes = '{"strength": "1","power": "1","attack": "1","defense": "1","speed": "3"}';
    let axeAttributes = '{"strength": "5","power": "5","attack": "4","defense": "1","speed": "2"}';
    let computeChipAttributes = '{"frequency": "100","processors": "1","threads": "1","tdp": "200"}';

    ////////////***************************************************************************           Packages */
    //Create Common Resources Package
    createFunction = await decentracraftWorld.methods.addResourcesPackage(web3.utils.toWei("0.5","ether"), [woodTypeID], [100]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setResourcesNFTsMeta(0, [stickTypeID], [stickAttributes], [stickUri], [1000], [10]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    //Create Basic Resources Package
    createFunction = await decentracraftWorld.methods.addResourcesPackage(web3.utils.toWei("0.9","ether"), [rockTypeID, ironTypeID], [60, 35]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setResourcesNFTsMeta(1, [hammerTypeID, axeTypeID], [hammerAttributes, axeAttributes], 
                                                                                    [hammerUri, axeUri], [200, 150], [5, 5]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    //Create Valuable Resources Package
    createFunction = await decentracraftWorld.methods.addResourcesPackage(web3.utils.toWei("1.7","ether"), [goldTypeID, diamondTypeID], [5, 1]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);
    createFunction = await decentracraftWorld.methods.setResourcesNFTsMeta(2, [swordTypeID], [swordAttributes], [swordUri], [80], [2]);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    ////////////***************************************************************************           Reserve to wholesellers */
    createFunction = await decentracraftWorld.methods.reserveResources(0, reservedToPublicKey);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    createFunction = await decentracraftWorld.methods.reserveResources(1, reservedToPublicKey);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    createFunction = await decentracraftWorld.methods.reserveResources(2, reservedToPublicKey);
    result = await Contracts.sendTransaction(decentracraftWorld, createFunction, ownerKey);

    ////////////***************************************************************************           Reward to player */
    var contractFunction = await decentracraftWorld.methods.rewardPlayer(0, rewardRatio, player);
    result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, reservedToKey); 
    var queryID = extractQueryID(result);  
    // console.log("queryID = " + queryID);    
    contractFunction = await mockRNGContract.methods.randomReceived(queryID, 100000);
    result = await Contracts.sendTransaction(mockRNGContract, contractFunction, ownerKey);   
    
    contractFunction = await decentracraftWorld.methods.rewardPlayer(1, rewardRatio, player);
    result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, reservedToKey); 
    queryID = extractQueryID(result);  
    // console.log("queryID = " + queryID);    
    contractFunction = await mockRNGContract.methods.randomReceived(queryID, 100000);
    result = await Contracts.sendTransaction(mockRNGContract, contractFunction, ownerKey);   
    
    contractFunction = await decentracraftWorld.methods.rewardPlayer(2, rewardRatio, player);
    result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, reservedToKey); 
    queryID = extractQueryID(result);  
    // console.log("queryID = " + queryID);    
    contractFunction = await mockRNGContract.methods.randomReceived(queryID, 100000);
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
