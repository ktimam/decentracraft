const Web3 = require('web3');
const express = require('express');
const https = require('https');
const next = require('next')
var bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { waitForEvent } = require('../app/utils/utils');

const Contracts = require('../app/contracts.js');

// Get fungible items belonging to user address
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering userFungible");
    var player = req.body.player;
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var mainContract = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    var tokensjson = {
        tokens: []
    };
    // var length = await mainContract.getItemIDsLength();
    
    var length = await mainContract.methods.getItemIDsLength().call(); 

    console.log("items length = " + length);
    for(var i=0; i < length; i++){
        var dciid = await mainContract.methods.itemIDs(i).call();
        var isfungible = await mainContract.methods.isFungible(dciid).call();
        if(isfungible){
            console.log("id = " + dciid);
            var balance = await mainContract.methods.balanceOf(player, dciid).call();
            console.log("balance = " + balance);
            if(balance > 0)
            {
                tokensjson.tokens.push({ 
                    "id" : dciid,
                    "balance"  : parseInt(balance)
                });
            }

        }
    }

    res.json(tokensjson);
}

