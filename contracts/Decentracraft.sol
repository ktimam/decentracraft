pragma solidity ^0.5.11;

import "./DecentracraftItem.sol";
import "./ERC1155MixedFungible.sol";

/**
    @dev Mintable form of ERC1155
    Shows how easy it is to mint new items
*/
contract Decentracraft is ERC1155MixedFungible  {

    DecentracraftItem public decentracraftItem;

    constructor (DecentracraftItem _dcItem) public payable  {        
        decentracraftItem = _dcItem;
    }

    function withdraw() public ownerOnly {
        decentracraftItem.withdraw();
        msg.sender.transfer(address(this).balance);
    }

    function () external payable {
    }

    uint256 nonce;
    // mapping (uint256 => address) public creators;
    mapping (uint256 => uint256) public maxIndex;

    // modifier creatorOnly(uint256 _id) {
    //     require(creators[_id] == msg.sender);
    //     _;
    // }

    // This function only creates the type.
    function create(string memory _uri, bool   _isNF) public ownerOnly returns(uint256 _type) {
        // Store the type in the upper 128 bits
        _type = (++nonce << 128);

        // Set a flag if this is an NFI.
        if (_isNF)
          _type = _type | TYPE_NF_BIT;

        // This will allow restricted access to creators.
        // creators[_type] = msg.sender;

        // emit a Transfer event with Create semantic to help with discovery.
        emit TransferSingle(msg.sender, address(0x0), address(0x0), _type, 0);

        if (bytes(_uri).length > 0)
            emit URI(_uri, _type);
    }

    function mintNonFungible(uint256 _type, address[] memory _to, 
                string memory _uri, string memory _attributesJSON) public payable ownerOnly /* creatorOnly(_type) */ {

        // No need to check this is a nf type rather than an id since
        // creatorOnly() will only let a type pass through.
        require(isNonFungible(_type));

        // Index are 1-based.
        uint256 index = maxIndex[_type] + 1;
        maxIndex[_type] = _to.length.add(maxIndex[_type]);

        for (uint256 i = 0; i < _to.length; ++i) {
            address dst = _to[i];
            uint256 id  = _type | index + i;

            emit TransferSingle(msg.sender, address(0x0), dst, id, 1);
            
            if (bytes(_uri).length > 0)
                emit URI(_uri, id);

            addID(id);
            nfOwners[id] = dst;
            decentracraftItem.addDCI.value(msg.value)(id, _uri, _attributesJSON);

            // You could use base-type id to store NF type balances if you wish.
            // balances[_type][dst] = quantity.add(balances[_type][dst]);

            if (dst.isContract()) {
                _doSafeTransferAcceptanceCheck(msg.sender, msg.sender, dst, id, 1, '');
            }
        }
    }

    function mintFungible(uint256 _id, address[] memory _to, uint256[] memory _quantities) public ownerOnly /* creatorOnly(_id) */ {

        require(isFungible(_id));

        addID(_id);
        for (uint256 i = 0; i < _to.length; ++i) {

            address to = _to[i];
            uint256 quantity = _quantities[i];

            // Grant the items to the caller
            balances[_id][to] = quantity.add(balances[_id][to]);

            // Emit the Transfer/Mint event.
            // the 0x0 source address implies a mint
            // It will also provide the circulating supply info.
            emit TransferSingle(msg.sender, address(0x0), to, _id, quantity);

            if (to.isContract()) {
                _doSafeTransferAcceptanceCheck(msg.sender, msg.sender, to, _id, quantity, '');
            }
        }
    }    

    //Emergency function to manually add json hash in case it wasn't handled correctly by provable
    function setDCIJSONHash(uint256 _id, string memory _jsonHash) public ownerOnly{
        decentracraftItem.setDCIJSONHash(_id, _jsonHash);
    }
}
