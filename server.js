const Web3 = require('web3');
const express = require('express');
const next = require('next')
var bodyParser = require('body-parser');
const cors = require('cors');
const { waitForEvent } = require('./test/helpers/utils');

const Contracts = require('./app/contracts.js');

// const Decentracraft = artifacts.require('Decentracraft.sol');
// const DecentracraftItem = artifacts.require('DecentracraftItem.sol');

// var mainCOntractAdress = JSON.parse(fs.readFileSync('./build/contracts/Decentracraft.json', 'utf8'));
// var dciContractAddress = JSON.parse(fs.readFileSync('./build/contracts/DecentracraftItem.json', 'utf8'));
// var mainContract = Decentracraft.deployed();
// var dciContract  = DecentracraftItem.deployed();

// var contract = require("truffle-contract");
// var contractJson = require("example-truffle-library/build/contracts/SimpleNameRegistry.json");
// var SimpleNameRegistry = contract(contractJson);
// SimpleNameRegistry
//   .deployed()

const port = process.env.PORT || 80;

// const app = express();
// app.use(bodyParser.json());
// app.use(cors());
// app.listen(port);

// const dev = process.env.NODE_ENV !== 'production'
// const app = next({ dev })
// const handle = app.getRequestHandler()

// app.prepare().then(() =>{


const server = express();    
server.use(bodyParser.json());
server.use(cors());
server.listen(port);

Contracts.loadContracts();

// server.get('/loadContracts', function (req, res) {
//     Contracts.loadContracts();
//     res.json({
//         result: "success"
//     });
// });

// Routes
// Get all unlocked accounts
server.get('/accounts', function (req, res) {
    Contracts.web3.eth.getAccounts(function (err, accounts) {
        if (err) { res.status(500).json({ error: err }); return; }
        res.json({
            accounts: accounts
        });
    });
});

// Get Non fungible items belonging to user address
server.post('/userFungible', async function (req, res) {
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
});

// Get Non fungible items belonging to user address
server.post('/userNonFungible', async function (req, res) {
    var player = req.body.player;
    // var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    //console.log("Account 0 = " + user1);

    var mainContract = await Contracts.Decentracraft;//.deployed();
    var dciContract = await Contracts.DecentracraftItem;//.deployed();

    var nftokensjson = {
        nftokens: []
    };
    var length = await mainContract.methods.getItemIDsLength().call();
    // console.log("items length = " + length);
    for(var i=0; i < length; i++){
        var dciid = await mainContract.methods.itemIDs(i).call();
        // console.log("id = " + dciid);
        var owner = await mainContract.methods.nfOwners(dciid).call();
        // console.log("nfOwners = " + owner);
        if(owner == player){
            var dcitemstruct = await dciContract.methods.dcItems(dciid).call();
            //console.log(dcitemstruct);
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
});

// Mint Nonfungible tokens for user
server.post('/mintNonFungible', async function (req, res) {
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
});

// Mint fungible tokens for user
server.post('/mintFungible', async function (req, res) {    
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

    res.json({
        transaction: result
    });
});

// Mint Nonfungible tokens for user
server.get('/creates5cr5t', async function (req, res) {
    
    console.log("Entering create secret");
    //var accounts = await Contracts.web3.eth.getAccounts();
    var user1 = Contracts.ownerAccount;//accounts[0];
    console.log("Account 0 = " + user1.address);

    var mainContract = await Contracts.Decentracraft;//.deployed();
    console.log(mainContract._address);
    var dciContract = await Contracts.DecentracraftItem;//.deployed();
    console.log(dciContract._address);

    // var result = await mainContract.create('', false, {from: user1.address});
    
    const contractFunction = await mainContract.methods.create('', false);//, {from: user1.address}); 
    var result = await Contracts.sendTransaction(mainContract, contractFunction);
    
    for (let l of result) {
        if (l.event === 'TransferSingle') {
            itemid = l.args._id;
            console.log("itemid = " + itemid);
            console.log("itemidParsed = " + parseInt(itemid));
        }
    }

    res.json({
        transaction: result
    });
});


// })


