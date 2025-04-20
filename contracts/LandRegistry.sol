// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error NotRegistered();
error LandAlreadyOwned();
error NotLandOwner();
error LandNotOwned();

contract LandRegistry is Ownable(msg.sender) {
    UserManager public userManager;
    
    struct Land {
        address owner;
        string what3wordsId;
        bool isOwned;
    }
    
    mapping(string => Land) public lands;
    
    event LandClaimed(string what3wordsId, address owner);
    event LandReleased(string what3wordsId, address previousOwner);
    event LandSwapped(string land1Id, string land2Id, address owner1, address owner2);
    
    constructor(address _userManagerAddress) {
        userManager = UserManager(_userManagerAddress);
    }
    
    modifier onlyRegisteredUser() {
        bool isRegistered = userManager.isUserRegistered(msg.sender);
        if (!isRegistered) {
            revert NotRegistered();
        }
        _;
    }

    function _checkUserRegistered(address user) internal view {
        require(userManager.isUserRegistered(user), "User not registered");
    }
    
    function claimLand(string memory what3wordsId) external {
        if (!userManager.isUserRegistered(msg.sender)) revert NotRegistered();
        if (lands[what3wordsId].isOwned) revert LandAlreadyOwned();
        
        lands[what3wordsId] = Land({
            owner: msg.sender,
            what3wordsId: what3wordsId,
            isOwned: true
        });
        
        userManager.addLandToUser(msg.sender, what3wordsId);
        emit LandClaimed(what3wordsId, msg.sender);
    }
    
    function releaseLand(string memory what3wordsId) external {
        if (!lands[what3wordsId].isOwned) revert LandNotOwned();
        if (lands[what3wordsId].owner != msg.sender) revert NotLandOwner();
        
        address previousOwner = lands[what3wordsId].owner;
        delete lands[what3wordsId];
        
        userManager.removeLandFromUser(previousOwner, what3wordsId);
        emit LandReleased(what3wordsId, previousOwner);
    }
    
    function swapLand(string memory myLandId, string memory otherLandId, address otherOwner) external onlyRegisteredUser {
        if (lands[myLandId].owner != msg.sender) revert NotLandOwner();
        if (lands[otherLandId].owner != otherOwner) revert NotLandOwner();
        
        // Swap ownership
        address owner1 = lands[myLandId].owner;
        address owner2 = lands[otherLandId].owner;
        
        lands[myLandId].owner = owner2;
        lands[otherLandId].owner = owner1;
        
        // Update user land records
        userManager.removeLandFromUser(owner1, myLandId);
        userManager.removeLandFromUser(owner2, otherLandId);
        userManager.addLandToUser(owner2, myLandId);
        userManager.addLandToUser(owner1, otherLandId);
        
        emit LandSwapped(myLandId, otherLandId, owner1, owner2);
    }
    
    function getLandOwner(string memory what3wordsId) external view returns (address) {
        require(lands[what3wordsId].isOwned, "Land not owned");
        return lands[what3wordsId].owner;
    }
    
    function isLandOwned(string memory what3wordsId) external view returns (bool) {
        return lands[what3wordsId].isOwned;
    }
}
