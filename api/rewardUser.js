// const Web3 = require('web3');
// const express = require('express');
// const https = require('https');
// const next = require('next')
// var bodyParser = require('body-parser');
// const cors = require('cors');
// const fs = require('fs');
const { waitForEvent } = require('../app/utils/utils');

const Contracts = require('../app/contracts.js');

// Get resources packages listed for wholesale
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering userResourcesPackages");
    console.log("req = " + req);
    console.log("req.method = " + req.method);
    var packagesjson = {
        packages: []
    };
    if (req.method === 'OPTIONS') {
        res.json(packagesjson.packages);
        return;
    }
    console.log("req.body = " + req.body);
    var bodyjson = JSON.parse(req.body);
    console.log("bodyjson = " + bodyjson);
    var player = bodyjson.player;
    console.log("player = " + player);
    var resourceId = bodyjson.resourceId;
    console.log("resourceId = " + resourceId);
    var rewardRatio = bodyjson.rewardRatio;
    console.log("rewardRatio = " + rewardRatio);
    var ownerKey = bodyjson.ownerKey;
    console.log("ownerKey = " + ownerKey);

    var decentracraftWorld = await Contracts.DecentracraftWorld;
    var decentracraft = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    // var length = await mainContract.getItemIDsLength();
    
    var length = await decentracraftWorld.methods.getReservedPackagesIndex().call(); 

    const contractFunction = await decentracraftWorld.methods.rewardPlayer(resourceId, 
        rewardRatio, player);//, {from: user1.address}); 
    var result = await Contracts.sendTransaction(decentracraftWorld, contractFunction, ownerKey);    

    res.json(result);
}

