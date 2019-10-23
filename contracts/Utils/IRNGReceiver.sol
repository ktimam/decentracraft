pragma solidity ^0.5.11;

interface IRNGReceiver {
    function __callback(bytes32 _queryId, uint256 _rng) external;
}