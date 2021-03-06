pragma solidity ^0.5.11;
pragma experimental ABIEncoderV2;

import "./Decentracraft.sol";
import "./Utils/Ownable.sol";
import "./Utils/IRNGReceiver.sol";
import "./Utils/IRandomGenerator.sol";

/**
    @dev Decentracraftworld manager
    Controls minting process
*/
contract DecentracraftWorld is Ownable, IRNGReceiver {

    Decentracraft decentracraft;
    IRandomGenerator rng;

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawAll() public ownerOnly {
        decentracraft.withdraw();
        msg.sender.transfer(address(this).balance);
    }

    function withdraw() public ownerOnly {
        msg.sender.transfer(address(this).balance);
    }

    function () external payable {
    }

    struct NFTRewardRequest{
        address _rewardedPlayer;
        uint256 _resourcePackageID;
        uint    _nftIndex;

    }
    mapping (bytes32 => NFTRewardRequest) randomQueryRPSMap;

    struct ResourcesPackageStruct
    {
        string uri;
        address owner;
        uint256 price;
        uint256[] resourcesIDs;
        uint256[] originalSupply;
        uint256[] currentSupply;
        uint256[] NFTsIDs;
        string[]  NFTsJSON;
        string[]  NFTsURI;
        uint256[] NFTsProbability;
        uint256[] NFTsSupply;
    }

    //Resource packages to buy from
    uint resourcePackagesIndex = 0;
    mapping (uint256 => ResourcesPackageStruct) public resourcePackages;

    function getResourcesPackagesResourcesCount(uint256 _packageID) public view returns(uint) {
        return resourcePackages[_packageID].resourcesIDs.length;
    }

    function getResourcesPackagesResource(uint256 _packageID, uint _resourceIndex) public view 
                    returns(uint256 _resourceID, uint256 _resourceSupply) {
        return (resourcePackages[_packageID].resourcesIDs[_resourceIndex], 
                    resourcePackages[_packageID].originalSupply[_resourceIndex]);
    }

    function getResourcesPackagesNFTsCount(uint256 _packageID) public view returns(uint) {
        return resourcePackages[_packageID].NFTsIDs.length;
    }

    function getResourcesPackagesNFT(uint256 _packageID, uint _nftIndex) public view 
                    returns(uint256 _nftID, uint256 _nftProbability, uint256 _nftSupply, 
                    string memory _nftJSON, string memory _nftURI) {
        return (resourcePackages[_packageID].NFTsIDs[_nftIndex], 
                    resourcePackages[_packageID].NFTsProbability[_nftIndex], 
                    resourcePackages[_packageID].NFTsSupply[_nftIndex],
                    resourcePackages[_packageID].NFTsJSON[_nftIndex], 
                    resourcePackages[_packageID].NFTsURI[_nftIndex]);
    }

    //Reserved packages
    uint reservedPackagesIndex = 0;
    mapping (uint256 => ResourcesPackageStruct) public reservedPackages;

    function getReservedResourcesPackagesResourcesCount(uint256 _packageID) public view returns(uint) {
        return reservedPackages[_packageID].resourcesIDs.length;
    }

    function getReservedResourcesPackagesResource(uint256 _packageID, uint _resourceIndex) public view 
                    returns(uint256 _resourceID, uint256 _resourceSupply, uint256 _originalSupply) {
        return (reservedPackages[_packageID].resourcesIDs[_resourceIndex], 
                    reservedPackages[_packageID].currentSupply[_resourceIndex], 
                    reservedPackages[_packageID].originalSupply[_resourceIndex]);
    }

    function getReservedResourcesPackagesNFTsCount(uint256 _packageID) public view returns(uint) {
        return reservedPackages[_packageID].NFTsIDs.length;
    }

    function getReservedResourcesPackagesNFT(uint256 _packageID, uint _nftIndex) public view 
                    returns(uint256 _nftID, uint256 _nftProbability, uint256 _nftSupply, 
                    string memory _nftJSON, string memory _nftURI) {
        return (reservedPackages[_packageID].NFTsIDs[_nftIndex], 
                    reservedPackages[_packageID].NFTsProbability[_nftIndex], 
                    reservedPackages[_packageID].NFTsSupply[_nftIndex],
                    reservedPackages[_packageID].NFTsJSON[_nftIndex], 
                    reservedPackages[_packageID].NFTsURI[_nftIndex]);
    }

    mapping (uint256 => uint256) public dailySupply;
    mapping (uint256 => uint256) public dailyConsumed;

    event LogResourcePackageCreated(address playerID, uint256 resourceID);
    event LogResourcesReserved(address playerID, uint256 resourceID);

    event LogMessage(string message);
    event LogMessage(uint256 message);

    constructor (Decentracraft _decentracraft, IRandomGenerator _rng) public payable  { 
        decentracraft = _decentracraft;
        rng = _rng;
    }

    function updateDCCWorldAddress(address _dccWorldAddress) public ownerOnly {
        decentracraft.setOwner(_dccWorldAddress);
    }

    function getResourcePackagesIndex() public view returns(uint) {
        return resourcePackagesIndex;
    }

    function getReservedPackagesIndex() public view returns(uint) {
        return reservedPackagesIndex;
    }

    function create(string calldata _uri, bool   _isNF) external ownerOnly returns(uint256 _type) {
        return decentracraft.create(_uri, _isNF);
    }

    function setDailySupply(uint256 _itemID, uint256 _supply) external payable  ownerOnly  {
        dailySupply[_itemID] = _supply;
    }

    function addResourcesPackage(string calldata _uri, uint256 _price, uint256[] calldata _resourcesIDs, uint256[] calldata _supply) external ownerOnly{

        ResourcesPackageStruct memory _rps;
            _rps.uri = _uri;
            _rps.owner = address(0);
            _rps.price = _price;
            _rps.resourcesIDs = _resourcesIDs;
            _rps.originalSupply = _supply;
            // _rps.NFTsIDs = _NFTsIDs;
            // _rps.NFTsJSON = _NFTsJSON;
            // _rps.NFTsURI = _NFTsURI;
            // _rps.NFTsProbability = _NFTsProbability;

        resourcePackages[resourcePackagesIndex++] = _rps; 
        emit LogResourcePackageCreated(msg.sender, resourcePackagesIndex - 1);
    }

    function setResourcesNFTsMeta(uint256 _resourcePackageID, 
                uint256[] calldata _NFTsIDs, string[] calldata _NFTsJSON, string[] calldata _NFTsURI, 
                uint[] calldata _NFTsProbability, uint[] calldata _NFTsSupply) external ownerOnly {
        ResourcesPackageStruct storage _rps = resourcePackages[_resourcePackageID];
        for(uint i = 0; i < _NFTsIDs.length; i++){
            _rps.NFTsIDs.push(_NFTsIDs[i]);
            _rps.NFTsJSON.push(_NFTsJSON[i]);
            _rps.NFTsURI.push(_NFTsURI[i]);
            _rps.NFTsProbability.push(_NFTsProbability[i]);
            _rps.NFTsSupply.push(_NFTsSupply[i]);
        }
    }
    
    function reserveResources(uint256 _resourcePackageID) external payable  {

        require(msg.value == resourcePackages[_resourcePackageID].price);
        
        ResourcesPackageStruct memory _rps;
            _rps.owner = msg.sender;
            _rps.uri = resourcePackages[_resourcePackageID].uri;
            _rps.price = resourcePackages[_resourcePackageID].price;
            _rps.resourcesIDs = resourcePackages[_resourcePackageID].resourcesIDs;
            _rps.originalSupply = resourcePackages[_resourcePackageID].originalSupply;
            _rps.currentSupply = resourcePackages[_resourcePackageID].originalSupply;
            _rps.NFTsIDs = resourcePackages[_resourcePackageID].NFTsIDs;
            _rps.NFTsJSON = resourcePackages[_resourcePackageID].NFTsJSON;
            _rps.NFTsURI = resourcePackages[_resourcePackageID].NFTsURI;
            _rps.NFTsProbability = resourcePackages[_resourcePackageID].NFTsProbability;
            _rps.NFTsSupply = resourcePackages[_resourcePackageID].NFTsSupply;

        reservedPackages[reservedPackagesIndex++] = _rps; 

          emit LogResourcesReserved(msg.sender, reservedPackagesIndex-1);
    }

    function reserveResources(uint256 _resourcePackageID, address _ReservedToAddress) external ownerOnly  {

        ResourcesPackageStruct memory _rps;
            _rps.owner = _ReservedToAddress;
            _rps.uri = resourcePackages[_resourcePackageID].uri;
            _rps.price = resourcePackages[_resourcePackageID].price;
            _rps.resourcesIDs = resourcePackages[_resourcePackageID].resourcesIDs;
            _rps.originalSupply = resourcePackages[_resourcePackageID].originalSupply;
            _rps.currentSupply = resourcePackages[_resourcePackageID].originalSupply;
            _rps.NFTsIDs = resourcePackages[_resourcePackageID].NFTsIDs;
            _rps.NFTsJSON = resourcePackages[_resourcePackageID].NFTsJSON;
            _rps.NFTsURI = resourcePackages[_resourcePackageID].NFTsURI;
            _rps.NFTsProbability = resourcePackages[_resourcePackageID].NFTsProbability;
            _rps.NFTsSupply = resourcePackages[_resourcePackageID].NFTsSupply;

        reservedPackages[reservedPackagesIndex++] = _rps; 

          emit LogResourcesReserved(msg.sender, reservedPackagesIndex-1);
    }

    function rewardPlayer(uint256 _resourcePackageID, uint _rewardRatio, address _playerAddress) external payable{

        require(msg.sender == reservedPackages[_resourcePackageID].owner);

        //Reward player with fungible resources
        for(uint i = 0; i < reservedPackages[_resourcePackageID].resourcesIDs.length; i++){
            uint256 resourceid = reservedPackages[_resourcePackageID].resourcesIDs[i];
            //Allocate resources to player, make sure supply covers resources else allocate the minimum allowed by supply
            uint allocation = reservedPackages[_resourcePackageID].originalSupply[i] * _rewardRatio/1000;

            //Player can only be allocated to the max of available supply in the package
            if(allocation > reservedPackages[_resourcePackageID].currentSupply[i]){
                allocation = reservedPackages[_resourcePackageID].currentSupply[i];
            }

            //Player can only be allocated to the max of available daily supply
            if(allocation + dailyConsumed[resourceid] > dailySupply[resourceid]){
                allocation = dailySupply[resourceid] - dailyConsumed[resourceid];
            }
            
            if(allocation > 0){
                address[] memory playersaddresses= new address[](1);
                playersaddresses[0] = _playerAddress;
                uint256[] memory allocationlist = new uint256[](1);
                allocationlist[0] = allocation;
                decentracraft.mintFungible(resourceid, playersaddresses, allocationlist);
            }

            //remove allocated resources from package supply
            reservedPackages[_resourcePackageID].currentSupply[i] = reservedPackages[_resourcePackageID].currentSupply[i] - allocation;

            //remove allocated resources from daily supply
            dailyConsumed[resourceid] = dailyConsumed[resourceid] + allocation;
        }

        
        //Reward player with non-fungible resources
        for(uint i = 0; i < reservedPackages[_resourcePackageID].NFTsIDs.length; i++){
            if(reservedPackages[_resourcePackageID].NFTsSupply[i] == 0)continue;
            //Allocate nft resources to player randomly based on probability
            NFTRewardRequest memory nftrr;
            nftrr._rewardedPlayer = _playerAddress;
            nftrr._resourcePackageID = _resourcePackageID;
            nftrr._nftIndex = i;
    
            //If probability is 0, then it is a guranteed
            if(reservedPackages[_resourcePackageID].NFTsProbability[i] == 0){
                address[] memory playersaddresses= new address[](1);
                playersaddresses[0] = _playerAddress;
                emit LogMessage("Minting NonFungible");
                reservedPackages[_resourcePackageID].NFTsSupply[i] = reservedPackages[_resourcePackageID].NFTsSupply[i] - 1;
                decentracraft.mintNonFungible(reservedPackages[_resourcePackageID].NFTsIDs[i], playersaddresses, 
                        reservedPackages[_resourcePackageID].NFTsURI[i], 
                        reservedPackages[_resourcePackageID].NFTsJSON[i]);

            }else{                
                emit LogMessage("Generating Random");
                bytes32 queryId = rng.generateRandom();  
                randomQueryRPSMap[queryId] = nftrr;
            }
        }
    }

    function __callback(bytes32 _queryId, uint256 _rng) public {
        emit LogMessage("__callback");
        require(msg.sender == address(rng));
        require(randomQueryRPSMap[_queryId]._rewardedPlayer != address(0));        

        emit LogMessage("Rewarding Player");
        NFTRewardRequest memory nftrr = randomQueryRPSMap[_queryId];
        if(_rng < reservedPackages[nftrr._resourcePackageID].NFTsProbability[nftrr._nftIndex]){
            address[] memory playersaddresses= new address[](1);
            playersaddresses[0] = nftrr._rewardedPlayer;
            emit LogMessage("Minting NonFungible");
            reservedPackages[nftrr._resourcePackageID].NFTsSupply[nftrr._nftIndex] = reservedPackages[nftrr._resourcePackageID].NFTsSupply[nftrr._nftIndex] - 1;
            decentracraft.mintNonFungible(reservedPackages[nftrr._resourcePackageID].NFTsIDs[nftrr._nftIndex], playersaddresses, 
                    reservedPackages[nftrr._resourcePackageID].NFTsURI[nftrr._nftIndex], 
                    reservedPackages[nftrr._resourcePackageID].NFTsJSON[nftrr._nftIndex]);
        }
        delete randomQueryRPSMap[_queryId];
    }  

    //Emergency function to manually add json hash in case it wasn't handled correctly by provable
    function setDCIJSONHash(uint256 _id, string calldata _jsonHash) external ownerOnly{
        decentracraft.setDCIJSONHash(_id, _jsonHash);
    }
}
