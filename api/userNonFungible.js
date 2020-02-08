// const Web3 = require('web3');
// const express = require('express');
// const https = require('https');
// const next = require('next')
// var bodyParser = require('body-parser');
// const cors = require('cors');
// const fs = require('fs');
const { waitForEvent } = require('../app/utils/utils');

const Contracts = require('../app/contracts.js');

// Get non-fungible items belonging to user address
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering userNonFungible");
    var bodyjson = JSON.parse(req.body);
    var player = bodyjson.player;
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var mainContract = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    var nftokensjson = {
        nftokens: []
    };
    var length = await mainContract.methods.getItemIDsLength().call();
    console.log("items length = " + length);
    for(var i=0; i < length; i++){
        var dciid = await mainContract.methods.itemIDs(i).call();
        console.log("id = " + dciid);
        var owner = await mainContract.methods.nfOwners(dciid).call();
        console.log("nfOwners = " + owner);
        if(owner == player){
            var dcitemstruct = await dciContract.methods.dcItems(dciid).call();
            console.log(dcitemstruct);
            var attributeshash = await dcitemstruct.attributesStorageHash;
            var dciuri = dcitemstruct.uri;

            nftokensjson.nftokens.push({ 
                "id" : dciid,
                "uri"  : dciuri,
                "attributes" : attributeshash
            });
        }
    }

    res.json(nftokensjson);
}

