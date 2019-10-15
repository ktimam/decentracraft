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

    console.log("Entering mintNonFungible");
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var mainContract = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    var player = req.body.player;
    var uri = 'https://metadata.enjincoin.io/hammer.json';
    var attributes = '{"attack": "6","defense": "1","speed": "1"}';

    // var tx1 = await mainContract.create(uri, true, {from: user1});
    
    const contractFunction = await mainContract.methods.create(uri, true);//, {from: user1.address}); 
    var logs1 = await Contracts.sendTransaction(mainContract, contractFunction);    

    var typeID;
    for (let l of logs1) {
        if (l.event === 'TransferSingle') {
            typeID = l.args._id;
        }
    }
    // var tx2 = await mainContract.mintNonFungible(typeID, [player], uri, attributes, {from: user1, value: Contracts.web3.utils.toWei("0.1","ether")});
    // var event = await waitForEvent(dciContract.LogIPFSHashReceived);
    
    const contractFunction2 = await mainContract.methods.mintNonFungible(typeID, [player], uri, attributes);//, {from: user1.address}); 
    var logs2 = await Contracts.sendTransaction(mainContract, contractFunction2, "0.1");    
    var event = await waitForEvent(dciContract.events.LogIPFSHashReceived);
    res.json({
        transaction1: logs1,
        transaction2: logs2
    });
}

