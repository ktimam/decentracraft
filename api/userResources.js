const { waitForEvent } = require('../app/utils/utils');

const { ServerPublicURL } = require('../app/contracts.js');

const Contracts = require('../app/contracts.js');

// Get resources packages listed for wholesale
module.exports = async function (req, res) {
    
    await Contracts.loadContracts();

    console.log("Entering userResources");
    // console.log("req = " + req);
    // console.log("req.method = " + req.method);

    console.log("req.body = " + req.body);
    var bodyjson = JSON.parse(req.body);
    // console.log("bodyjson = " + bodyjson);
    var player = bodyjson.player;
    console.log("player = " + player);
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var mainContract = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();
    
    var tokensjson = {
        tokens: [],
        nftokens: []
    };

    var length = await mainContract.methods.getItemIDsLength().call();
    console.log("items length = " + length);
    for(var i=0; i < length; i++){
        var dciid = await mainContract.methods.itemIDs(i).call();
        console.log("id = " + dciid);

        var isfungible = await mainContract.methods.isFungible(dciid).call();
        if(isfungible){
            var balance = await mainContract.methods.balanceOf(player, dciid).call();
            console.log("balance = " + balance);
            if(balance > 0)
            {
                tokensjson.tokens.push({ 
                    "id" : dciid,
                    "uri"  : ServerPublicURL + dciid + ".json",
                    "balance"  : parseInt(balance)
                });
            }
        }else{
            var owner = await mainContract.methods.nfOwners(dciid).call();
            console.log("NFT Owner = " + owner);
            if(owner.toLowerCase() == player.toLowerCase()){
                var dcitemstruct = await dciContract.methods.dcItems(dciid).call();
                console.log(dcitemstruct);
                var attributeshash = await dcitemstruct.attributesStorageHash;
                var dciuri = dcitemstruct.uri;

                tokensjson.nftokens.push({ 
                    "id" : dciid,
                    "uri"  : dciuri,
                    "attributeshash" : attributeshash
                });
            }
        }
    }

    res.json(tokensjson);
}

