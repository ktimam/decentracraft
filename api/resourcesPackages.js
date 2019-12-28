const Web3 = require('web3');
const express = require('express');
const https = require('https');
const next = require('next')
var bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { waitForEvent } = require('../app/utils/utils');

const Contracts = require('../app/contracts.js');

// Get resources packages listed for wholesale
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering resourcesPackages");
    //var player = req.body.player;
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var decentracraftWorld = await Contracts.DecentracraftWorld;
    var decentracraft = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    var packagesjson = {
        packages: []
    };
    // var length = await mainContract.getItemIDsLength();
    
    var length = await decentracraftWorld.methods.getResourcePackagesIndex().call(); 

    console.log("items length = " + length);
    for(var i=0; i < length; i++){
        var package = await decentracraftWorld.methods.resourcePackages(i).call();
        var owner = await package.owner;
        var price = await package.price;
        console.log("Package = " + package);
        console.log("Owner " + owner);
        console.log("price " + price);

        var resourcesCount = await decentracraftWorld.methods.getResourcesPackagesResourcesCount(i).call();
        
        var resourcesjson = {
            resources: []
        };
        console.log("resourcesCount = " + resourcesCount);
        for(var r=0; r < resourcesCount; r++){
            var {_resourceID, _resourceSupply} = await decentracraftWorld.methods.getResourcesPackagesResource(i, r).call();
            resourcesjson.resources.push({ 
                "id" : _resourceID,
                "name" : "resource " + _resourceID,
                "supply" : _resourceSupply,
            });
        }

        var nftsCount = await decentracraftWorld.methods.getResourcesPackagesNFTsCount(i).call();
        var nftsjson = {
            nfts: []
        };
        console.log("nftsCount = " + nftsCount);
        for(var r=0; r < nftsCount; r++){
            var {_nftID, _nftProbability, _nftJSON, _nftURI} = 
                    await decentracraftWorld.methods.getResourcesPackagesNFT(i, r).call();

            nftsjson.nfts.push({ 
                "id" : _nftID,
                "name" : "nft " + _nftID,
                "uri" : _nftURI,
                "json" : _nftJSON,
                "probability" : _nftProbability,
            });
        }
        
        
        packagesjson.packages.push({ 
            "packageID" : i,
            "name"  : "Package" + i,
            "price" : price,            
            "color": '#F6FEFC',
            "image": 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888670/6_w93q19.png',
            "assetUrl": 'https://www.cryptokitties.co/',
            "currentOwner": owner,
            "description": '',
            "currentOwner": '',
            "resources" : resourcesjson.resources,
            "nfts" : nftsjson.nfts,
        });

    }

    res.json(packagesjson.packages);
}

