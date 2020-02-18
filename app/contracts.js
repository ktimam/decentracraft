const Web3 = require('web3'); 
const Tx = require('ethereumjs-tx').Transaction;
// const HDWalletProvider = require('truffle-hdwallet-provider');
const Contract = require('truffle-contract');
const LogDecoder = require(__dirname + '/utils/eth-decoder/log-decoder');
const fs = require('fs');
// const commandLineArgs = require('command-line-args')
// const options = commandLineArgs([
//     { name: 'rpc', alias: 'r', type: String }
// ]);

// if (!options.rpc || options.rpc.length <= 0)
//     throw "RPC endpoint missing";
exports.ServerURL = "https://dccapi2.now.sh/";
exports.ServerPublicURL = this.ServerURL + "public/"


console.log("Retreiving contract info");

// var privateKey = fs.readFileSync("./.secret").toString().trim();
var privateKey = process.env.privatekey;
// console.log("privateKey = " + privateKey);

//var provider = new Web3.providers.HttpProvider(options.rpc);
var provider = new Web3.providers.WebsocketProvider(process.env.rpc);
// var provider = new HDWalletProvider(privateKey, options.rpc)

   
const web3options = {
    transactionConfirmationBlocks: 1
    }
var web3 = new Web3(provider);//, null, web3options);

exports.web3 = web3;

var ownerAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
// console.log(ownerAccount.address);

exports.ownerAccount = ownerAccount;

var networkId;
var networkName;

let zeroAddress = '0x0000000000000000000000000000000000000000';

const buildPath = __dirname + "/../build/contracts/";
console.log("buildPath = " + buildPath);

const buildFiles = fs.readdirSync(buildPath);
console.log("buildFiles = " + buildFiles + " size = " + buildFiles.length);

var abis = [];

exports.loadContracts = async function loadContracts(){
    console.log("Entering loadContracts");
    networkId = await web3.eth.net.getId();
    // networkName = await web3.eth.net.getName();
    // console.log("networkName = " + networkName + " , networkId = " + networkId);
    // Load contracts from build
    // console.log("buildFiles size = " + buildFiles.length);
    // buildFiles.forEach(abiFile => {
    for(var i=0; i < buildFiles.length; i++){
        var abiFile = buildFiles[i];
        // console.log("abiFile = " + abiFile);
        if (abiFile.split(".")[1] !== "json") { continue; }
        const abiPath = buildPath + abiFile;
        // console.log("abiPath = " + abiPath);
        const contractABI = require(abiPath);
        abis.push(contractABI.abi);

        if(contractABI.contractName != "DecentracraftWorld" && 
        contractABI.contractName != "Decentracraft" && contractABI.contractName != "DecentracraftItem"
        && contractABI.contractName != "MockRNG"){
            //Contract is not deployed
            // console.log("Contract " + contractABI.contractName + " is not deployed to network " + networkId);
            continue;
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
    }
}

async function sendTransaction(contract, contractFunction, value="0"){
    return await sendTransaction(contract, contractFunction, privateKey, value="0");
}

async function sendTransaction(contract, contractFunction, ownerKey, value="0"){
    
    // console.log("Sending Transaction");
    var ownerAccount = await web3.eth.accounts.privateKeyToAccount(ownerKey);
    // console.log("ownerAccount.address: " + ownerAccount.address);
    let nonce = await web3.eth.getTransactionCount(ownerAccount.address);
    // console.log("Nonce: " + nonce);

    let estimatedGas = await contractFunction.estimateGas({"from": ownerAccount.address, value: web3.utils.toWei(value.toString(),"ether"), "nonce": nonce});
    // console.log("Estimated Gas: " + estimatedGas);

    let gasPrice = await web3.eth.getGasPrice();
    // console.log("Gas Price : " + gasPrice); 
    
    const functionABI = await contractFunction.encodeABI();

    const txParams = {
        chainId: networkId,
        "gasPrice": web3.utils.toHex(gasPrice),
        "gasLimit": web3.utils.toHex(estimatedGas),
        "data": functionABI,
        "to": contract._address,
        // from: ownerAccount.address,
        "value": web3.utils.toHex(web3.utils.toWei(value,"ether")),
        "nonce": '0x' + nonce.toString(16)
    };
    
    const tx = new Tx(txParams, {'chain':'ropsten'});//, hardfork: 'constantinople'});
    const privateKeyBuffer = Buffer.from(ownerKey.split("0x")[1], 'hex');
    tx.sign(privateKeyBuffer); // Transaction Signing here

    const serializedTx = tx.serialize();

    let receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));//, {from: ownerAccount.address});//, value: web3.utils.toHex(web3.utils.toWei("0.1","ether"))});    
    const txdecoder = new LogDecoder.LogDecoder(abis);
    const parsedLogs = txdecoder.decodeLogs(receipt.logs);
    // console.log(parsedLogs);
    return parsedLogs;
}

exports.sendTransaction = sendTransaction;