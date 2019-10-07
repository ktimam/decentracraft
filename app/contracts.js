const Web3 = require('web3'); 
const Tx = require('ethereumjs-tx').Transaction;
//const HDWalletProvider = require("@truffle/hdwallet-provider");
const HDWalletProvider = require('truffle-hdwallet-provider');
const Contract = require('truffle-contract');
const fs = require('fs');
const commandLineArgs = require('command-line-args')
const options = commandLineArgs([
    { name: 'rpc', alias: 'r', type: String }
]);

console.log("Retreiving contract info");

if (!options.rpc || options.rpc.length <= 0)
    throw "RPC endpoint missing";

var privateKey = fs.readFileSync(".secret").toString().trim();

//var provider = new Web3.providers.HttpProvider(options.rpc);
var provider = new Web3.providers.WebsocketProvider(options.rpc);
// var provider = new HDWalletProvider(privateKey, options.rpc)
var web3 = new Web3(provider);

exports.web3 = web3;

var ownerAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
console.log(ownerAccount.address);

exports.ownerAccount = ownerAccount;

var networkId;
var networkName;

let zeroAddress = '0x0000000000000000000000000000000000000000';

const buildPath = "./build/contracts/";

exports.loadContracts = async function loadContracts(){
    networkId = await web3.eth.net.getId();
    // networkName = await web3.eth.net.getName();
    // console.log("networkName = " + networkName + " , networkId = " + networkId);
    // Load contracts from build
    fs.readdirSync(buildPath).forEach(async abiFile => {
        if (abiFile.split(".")[1] !== "json") { return; }
        const contractABI = require("." + buildPath + abiFile);

        if(contractABI.contractName != "Decentracraft" && contractABI.contractName != "DecentracraftItem"){
            //Contract is not deployed
            // console.log("Contract " + contractABI.contractName + " is not deployed to network " + networkId);
            return;
        }
        const deployedAddress = contractABI.networks[networkId].address;
        console.log("Contract " + contractABI.contractName + " address = " + deployedAddress);

        // var contract = Contract(contractABI);
        // contract.setProvider(provider);
        // // contract.setNetwork(networkId);
        // contract.detectNetwork();
        // var contractObj = await contract.deployed();

        // console.log("Contract address = " + contract.address);
        // var contractObj = Contract(contractABI);
        var contractObj = new web3.eth.Contract(contractABI.abi, deployedAddress, {from:ownerAccount.address});

        //contractObj.setProvider(provider);
        //console.log("Contract Obj address = " + contractObj.address);
        //dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
        // if (typeof contractObj.currentProvider.sendAsync !== "function") {
        //     contractObj.currentProvider.sendAsync = function() {
        //         return contractObj.currentProvider.send.apply(
        //             contractObj.currentProvider, arguments
        //         );
        //     };
        // }
        
        //contractObj.detectNetwork();
        exports[abiFile.split(".")[0]] = contractObj;
    });
}


async function sendTransaction(contract, contractFunction){
    
    // console.log("Sending Transaction");
    let nonce = await web3.eth.getTransactionCount(ownerAccount.address);
    // nonce = nonce.toString(16);    
    console.log("Nonce: " + nonce);

    let estimatedGas = 51314;//web3.utils.toHex("100314");//await contractFunction.estimateGas({"from": ownerAccount.address, "nonce": nonce});
    // estimatedGas = estimatedGas.toString(16);
    // estimatedGas = estimatedGas * 7;
    console.log("Estimated Gas: " + estimatedGas);

    let gasPrice = "0x2540BE400";//web3.utils.toHex("5000500000");//await web3.eth.getGasPrice();//2000000000
    // gasPrice = gasPrice.toString(10);
    // gasPrice = web3.utils.fromWei(gasPrice,"gwei") * 8;
    console.log("Gas Price : " + gasPrice); 
    
    const functionABI = await contractFunction.encodeABI();

    const txParams = {
        chainId: networkId,
        // "gasPrice": gasPrice,//gasPrice,//web3.utils.toHex('10000000000'),'0x09184e72a000'
        // "gasLimit": estimatedGas,//estimatedGas,//web3.utils.toHex('4000000'),3000000,
        "gasPrice": web3.utils.toHex('20000000000'),
        "gasLimit": web3.utils.toHex('56000'),
        "data": functionABI,
        "to": contract._address,//"0x34bc4C9670B6e7686D22F364f2b45454C7EdF0fA",//"0x0000000000000000000000000000000000000000",//contract._address.toString(),
        // from: ownerAccount.address,
        "value": "0x0",//web3.utils.toHex(web3.utils.toWei("0.1","ether")),
        "nonce": '0x' + nonce.toString(16)
    };
    
    const tx = new Tx(txParams, {'chain':'ropsten'});//, hardfork: 'constantinople'});
    const privateKeyBuffer = Buffer.from(privateKey.split("0x")[1], 'hex');
    tx.sign(privateKeyBuffer); // Transaction Signing here

    const serializedTx = tx.serialize();

    let receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));//, {from: ownerAccount.address});//, value: web3.utils.toHex(web3.utils.toWei("0.1","ether"))});
    // let receipt = await web3.eth.sendTransaction(tx, {from: ownerAccount.address, value: web3.utils.toHex(web3.utils.toWei("0.1","ether"))});
    console.log(receipt);
    return receipt;
}

exports.sendTransaction = sendTransaction;