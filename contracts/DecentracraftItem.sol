pragma solidity ^0.5.11;
pragma experimental ABIEncoderV2;

import "./Utils/Ownable.sol";
import "./Utils/provableAPI.sol";

/**
    @dev DecentracraftItem
*/
contract DecentracraftItem is Ownable, usingProvable  {

    string public IPFSUploaderHash;
    mapping(bytes32=>uint256) validIds;
    event LogConstructorInitiated(string nextStep);
    event LogNewProvableQuery(string description);
    event LogIPFSHashReceived(uint256 id, string hash);

    mapping (uint256 => DecentracraftItemStruct) public dcItems;

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public ownerOnly {
        msg.sender.transfer(address(this).balance);
    }

    function () external payable {
    }

    
    function getDCItem(uint256 _id) public view returns (DecentracraftItemStruct memory)
    {
        return dcItems[_id];
    }
 
    struct DecentracraftItemStruct
    {
        string uri;
        uint64 creationTime;
        //Hash of the Attributes JSON file
        string attributesStorageHash;
    }

    constructor () public payable  {
        
        IPFSUploaderHash = "json(QmRGYcLzFhLqBaVVBcMdQmF25XCSCA7i6KgfiWtp5Mfn9Y).Hash";
        
        provable_setCustomGasPrice(4000000000);
        provable_setProof(proofType_TLSNotary | proofStorage_IPFS);
        emit LogConstructorInitiated("Constructor was initiated. Call 'updatePrice()' to send the Provable Query.");
    }

    function setIPFSUploaderHash(string memory _IPFSUploaderHash) public ownerOnly
    {
        IPFSUploaderHash = _IPFSUploaderHash;
    }

    function __callback(bytes32 _myid, string memory _result, bytes memory _proof) public {
        if (validIds[_myid]==0) revert();
        if (msg.sender != provable_cbAddress()) revert();
        string memory attributes_hash = _result;
        uint256 dci_id = validIds[_myid];
        dcItems[dci_id].attributesStorageHash = attributes_hash;
        emit LogIPFSHashReceived(dci_id, attributes_hash);
        delete validIds[_myid];
    }

    function addDCI(uint256 _id, string calldata _uri, string calldata _attributesJSON) external payable ownerOnly{
        if (provable_getPrice("computation") > address(this).balance) {
          emit LogNewProvableQuery("Provable query was NOT sent, please add some ETH to cover for the query fee");
        } else {
          emit LogNewProvableQuery("Provable query was sent, standing by for the answer..");
          string memory _attributesStorageHash = "";
          DecentracraftItemStruct memory _dci = DecentracraftItemStruct({
              uri: _uri,
              creationTime: uint64(now),
              attributesStorageHash: _attributesStorageHash
          });
          dcItems[_id] = _dci;

          string memory attributes_json = _attributesJSON;
          //Save attributes to IPFS
          bytes32 queryId =
            provable_query("computation", [IPFSUploaderHash, attributes_json, "attributes.json"]);
          validIds[queryId] = _id;
        }
    }

    //Emergency function to manually add json hash in case it wasn't handled correctly by provable
    function setDCIJSONHash(uint256 _id, string memory _jsonHash) public ownerOnly{
        string memory json_hash = _jsonHash;
        dcItems[_id].attributesStorageHash = json_hash;
    }
}
