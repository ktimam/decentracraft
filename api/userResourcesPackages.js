const fetch = require("node-fetch");

const { waitForEvent } = require('../app/utils/utils');

const { ServerPublicURL } = require('../app/contracts.js');

const Contracts = require('../app/contracts.js');

// Get resources packages listed for wholesale
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering userResourcesPackages");
    var packagesjson = {
        packages: []
    };
    var bodyjson = JSON.parse(req.body);
    var player = bodyjson.player;
    console.log("player = " + player);
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var decentracraftWorld = await Contracts.DecentracraftWorld;
    var decentracraft = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    // var length = await mainContract.getItemIDsLength();
    
    var length = await decentracraftWorld.methods.getReservedPackagesIndex().call(); 

    console.log("items length = " + length);
    for(var i=0; i < length; i++){
        var package = await decentracraftWorld.methods.reservedPackages(i).call();
        var owner = await package.owner;
        if(owner.toLowerCase() != player.toLowerCase()){
            console.log("owner doesn't match : " + owner.toLowerCase());
            continue;
        }
        var price = await package.price;
        console.log("Package = " + package);
        console.log("Owner " + owner);
        console.log("price " + price);

        var resourcesCount = await decentracraftWorld.methods.getReservedResourcesPackagesResourcesCount(i).call();
        
        var resourcesjson = {
            resources: []
        };
        console.log("resourcesCount = " + resourcesCount);
        for(var r=0; r < resourcesCount; r++){
            var {_resourceID, _resourceSupply} = await decentracraftWorld.methods.getReservedResourcesPackagesResource(i, r).call();
            resourcesjson.resources.push({ 
                "id" : _resourceID,
                "uri"  : ServerPublicURL + _resourceID + ".json",
                "supply" : _resourceSupply,
            });
        }

        var nftsCount = await decentracraftWorld.methods.getReservedResourcesPackagesNFTsCount(i).call();
        var nftsjson = {
            nfts: []
        };
        console.log("nftsCount = " + nftsCount);
        for(var r=0; r < nftsCount; r++){
            var {_nftID, _nftProbability, _nftJSON, _nftURI} = 
                    await decentracraftWorld.methods.getReservedResourcesPackagesNFT(i, r).call();

            nftsjson.nfts.push({ 
                "id" : _nftID,
                "uri" : _nftURI,
                "json" : _nftJSON,
                "probability" : _nftProbability,
            });
        }

        let uriname = "Resources Package " + i + ".json";
        let uriurl  = ServerPublicURL + uriname;

        let uridata = await fetch(uriurl);
        let urijson = await uridata.json();
        
        
        packagesjson.packages.push({ 
            "packageID" : i,
            "name"  : urijson.name,
            "price" : price,            
            "color": urijson.color,
            "image": urijson.image,
            "assetUrl": urijson.assetUrl,
            "currentOwner": owner,
            "description": urijson.description,
            "resources" : resourcesjson.resources,
            "nfts" : nftsjson.nfts,
        });

    }

    res.json(packagesjson.packages);
}

