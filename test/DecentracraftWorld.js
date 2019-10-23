/* global artifacts, contract, it, assert */
/* eslint-disable prefer-reflect */
const Web3 = require('web3')

//import expectThrow from './helpers/expectThrow';

const expectThrow = require("./helpers/expectThrow");
const { waitForEvent } = require('../app/utils/utils')

// const localProviderUrl = 'http://localhost:8545'
const localProviderUrl = 'http://192.168.1.111:8545'
const localProvider = new Web3.providers.WebsocketProvider(localProviderUrl)

const Decentracraft = artifacts.require('Decentracraft.sol');
const DecentracraftWorld = artifacts.require('DecentracraftWorld.sol');
const DecentracraftItem = artifacts.require('DecentracraftItem.sol');
let MockRNG;
if(process.env.NETWORK == "remote"){
    MockRNG = artifacts.require('./Utils/MockRNG.sol');
}
const ERC1155MockReceiver = artifacts.require('ERC1155MockReceiver.sol');
const BigNumber = require('bignumber.js');

let user1;
let user2;
let user3;
let user4;
let dciContract;
let mainContract;
let decentracraftContract;
let mockRNG;
let receiverContract;
let tx;

let zeroAddress = '0x0000000000000000000000000000000000000000';

let hammerId;
let swordId;
let maceId;

let idSet = [];
let quantities = [1, 1, 1];

let gasUsedRecords = [];
let gasUsedTotal = 0;

function recordGasUsed(_tx, _label) {
    gasUsedTotal += _tx.receipt.gasUsed;
    gasUsedRecords.push(String(_label + ' \| GasUsed: ' + _tx.receipt.gasUsed).padStart(60));
}

function printGasUsed() {
    console.log('------------------------------------------------------------');
    for (let i = 0; i < gasUsedRecords.length; ++i) {
        console.log(gasUsedRecords[i]);
    }
    console.log(String("Total: " + gasUsedTotal).padStart(60));
    console.log('------------------------------------------------------------');
}

function verifyURI(tx, uri, id) {
    for (let l of tx.logs) {
        if (l.event === 'URI') {
            assert(l.args._id.eq(id));
            assert(l.args._value === uri);
            return;
        }
    }
    assert(false, 'Did not find URI event');
}

contract('DecentracraftWorld - tests all core 1155 functionality.', (accounts) => {
    before(async () => {
        user1 = accounts[9];
        user2 = accounts[1];
        user3 = accounts[2];
        user4 = accounts[3];
        decentracraftContract = await Decentracraft.deployed();
        dciContract = await DecentracraftItem.deployed();// .new();
        mainContract = await DecentracraftWorld.deployed();// .new(dciContract.address);
        mockRNG = await MockRNG.deployed();
        // receiverContract = await ERC1155MockReceiver.new();
    });

    after(async() => {
        printGasUsed();
    });

    it('Create initial items', async () => {

        // Make sure the Transfer event respects the create or mint spec.
        // Also fetch the created id.
        function verifyCreateTransfer(tx, creator) {
            for (let l of tx.logs) {
                if (l.event === 'TransferSingle') {
                    assert(l.args._operator === creator, 'creator');
                    // This signifies minting.
                    assert(l.args._from === zeroAddress, 'from zeroAddress');
                    // It is ok to create a new id w/o a balance.
                    // Then _to should be 0x0
                    assert(l.args._to === zeroAddress, 'to zeroAddress');
                    assert(l.args._value.toNumber() === 0, 'value : ' + l.args._value);
                    return l.args._id;
                }
            }
            assert(false, 'Did not find initial Transfer event');
        }

        function verifyFungibleOwnership(tx, sender, nfowner, itemID, amount) {
            //event TransferSingle(address _operator, address _from, address _to, uint256 _id, uint256 _value);
            //TransferSingle(msg.sender, address(0x0), to, _id, quantity);
            for (let l of tx.logs) {
                if (l.event === 'TransferSingle') {
                    assert(l.args._operator === sender, '_operator');
                    // This signifies minting.
                    assert(l.args._from === zeroAddress, 'from zeroAddress');
                    // It is ok to create a new id w/o a balance.
                    // Then _to should be 0x0
                    assert(l.args._to === nfowner, 'nfowner');
                    assert(parseInt(l.args._id) === parseInt(itemID), 'itemID');
                    assert(parseInt(l.args._value) === parseInt(amount), 'value : ' + l.args._value);
                    return l.args._id;
                }
            }
            assert(false, 'Did not find verifyFungibleOwnership Transfer event');
        }

        async function verifyNFOwnership(sender, nfowner, from, value, uri, attributes){
            console.log('verifyNFOwnership');
            // const transfer_event = await waitForEvent(mainContract.TransferSingle);
            // assert(transfer_event._operator === sender, transfer_event._operator + " _operator !=" + sender);
            // assert(transfer_event._from === from, "_from != " + from);
            // assert(transfer_event._to === nfowner, "_to != " + nfowner);
            // assert(transfer_event._value === value, "_value != " + value);

            //assert(false, mainContract.decentracraftItemAddress().toString());
            //let dcicontract = await DecentracraftItem.deployed(mainContract.decentracraftItem._jsonInterface,mainContract.decentracraftItem._address)
            const event = await waitForEvent(dciContract.LogIPFSHashReceived);
            let length = await decentracraftContract.getItemIDsLength();
            console.log("items length = " + length);
            for(let i=0; i < length; i++){
                let id = await decentracraftContract.itemIDs(i);
                console.log("id = " + id);
                let owner = await decentracraftContract.nfOwners(id);
                console.log("nfOwners = " + owner);
                if(owner == nfowner){
                    // assert(transfer_event.id === id, "transfer_event.id != " + id);
                    assert(parseInt(event.returnValues.id) === parseInt(id), event.returnValues.id + " event.id != " + id);
                    let dcitemstruct = await dciContract.dcItems(id);
                    assert(dcitemstruct.uri === uri, "uri != " + uri);
                    let attributeshash = await dcitemstruct.attributesStorageHash;
                    console.log("Attributes Hash = " + event.returnValues.hash);
                    assert(event.returnValues.hash === attributeshash, event.returnValues.hash + " hash != " + attributeshash);

                    return id;
                }
            }
            assert(false, 'Did not find NFToken');
        }

        function verifyResourcePackageCreated(tx, sender) {
            //event TransferSingle(address _operator, address _from, address _to, uint256 _id, uint256 _value);
            //TransferSingle(msg.sender, address(0x0), to, _id, quantity);
            for (let l of tx.logs) {
                if (l.event === 'LogResourcePackageCreated') {
                    assert(l.args.playerID === sender, '_operator');
                    // // This signifies minting.
                    // assert(l.args._from === zeroAddress, 'from zeroAddress');
                    // // It is ok to create a new id w/o a balance.
                    // // Then _to should be 0x0
                    // assert(l.args._to === nfowner, 'nfowner');
                    // assert(parseInt(l.args._id) === parseInt(itemID), 'itemID');
                    // assert(parseInt(l.args._value) === parseInt(amount), 'value : ' + l.args._value);
                    return l.args.resourceID;
                }
            }
            assert(false, 'Did not find verifyResourcePackageCreated Transfer event');
        }

        let hammerUri = 'https://metadata.enjincoin.io/hammer.json';
        tx = await mainContract.create(hammerUri, true, {from: user1});
        let hammerTypeID = verifyCreateTransfer(tx, mainContract.address);
        let hammerAttributes = '{"attack": "6","defense": "1","speed": "1"}';
        // tx = await decentracraftContract.mintNonFungible(hammerTypeID, [user2], hammerUri, hammerAttributes, {from: user1, value: web3.utils.toWei("0.1","ether")});
        // hammerId = await verifyNFOwnership(user1, user2, zeroAddress, 1, hammerUri, hammerAttributes);
        // idSet.push(hammerId);

        tx = await mainContract.create('', false, {from: user1});
        let woodTypeID = verifyCreateTransfer(tx, mainContract.address);
        console.log("woodTypeID = " + woodTypeID)
        // tx = await mainContract.mintFungible(woodTypeID, [user2], [100], {from: user1});
        // verifyFungibleOwnership(tx, user1, user2, woodTypeID, 100);
        // idSet.push(woodTypeID);

        //Set supplies limits
        await mainContract.setDailySupply(woodTypeID, 2000, {from: user1})

        //Create Resource Package
        tx = await mainContract.addResourcesPackage(web3.utils.toWei("0.5","ether"), [woodTypeID], [1000])
        let rsp_id = await  verifyResourcePackageCreated(tx, user1)
        // console.log("rsp_id = " + rsp_id)
        await mainContract.setResourcesNFTsMeta(rsp_id, [hammerTypeID], [hammerAttributes], [hammerUri], [100000])

        //Reserve Resource Package
        tx = await mainContract.reserveResources(rsp_id, {from: user2, value: web3.utils.toWei("0.5","ether")})

        //Reward player
        tx = await mainContract.rewardPlayer(rsp_id, 1000, user3, {from: user2});
        await verifyFungibleOwnership(tx, mainContract.address, user3, woodTypeID, 1000);
        if(process.env.NETWORK == "remote"){
            await mockRNG.randomReceived(0, 1000, {from: user1});
        }
        await verifyNFOwnership(mainContract.address, user3, zeroAddress, 1, hammerUri, hammerAttributes);
    });

});
