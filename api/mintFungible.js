const Web3 = require('web3');
const express = require('express');
const https = require('https');
const next = require('next')
var bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { waitForEvent } = require('../app/utils/utils');

const Contracts = require('../app/contracts.js');

// Get non-fungible items belonging to user address
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();
  
    console.log("Entering mintFungible");
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var mainContract = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    var player = req.body.player;
    var itemid = req.body.itemid;
    var value  = req.body.value;

    // var tx = await mainContract.mintFungible(itemid, [player], [value], {from: user1});
    
    const contractFunction = await mainContract.methods.mintFungible(itemid, [player], [value]);//, {from: user1.address}); 
    var result = await Contracts.sendTransaction(mainContract, contractFunction);    

    res.json(result);
}

