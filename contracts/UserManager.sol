// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract UserManager is Ownable(msg.sender) {
    struct User {
        bool exists;
        string[] ownedLands;
        uint256 registrationTime;
    }

    mapping(address => User) public users;
    address[] public userAddresses;

    event UserRegistered(address indexed userAddress);
    event UserDeleted(address indexed userAddress);
    event LandAdded(address indexed userAddress, string landId);
    event LandRemoved(address indexed userAddress, string landId);

    modifier onlyRegisteredUser() {
        require(users[msg.sender].exists, "User not registered");
        _;
    }

    function registerUser() external {
        require(!users[msg.sender].exists, "User already registered");
        
        users[msg.sender] = User({
            exists: true,
            ownedLands: new string[](0),
            registrationTime: block.timestamp
        });
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender);
    }

    function deleteUser() external onlyRegisteredUser {
        delete users[msg.sender];
        
        // Remove user from userAddresses array
        for (uint i = 0; i < userAddresses.length; i++) {
            if (userAddresses[i] == msg.sender) {
                userAddresses[i] = userAddresses[userAddresses.length - 1];
                userAddresses.pop();
                break;
            }
        }
        
        emit UserDeleted(msg.sender);
    }

    function addLandToUser(address user, string memory landId) external onlyOwner {
        require(users[user].exists, "User does not exist");
        users[user].ownedLands.push(landId);
        emit LandAdded(user, landId);
    }

    function removeLandFromUser(address user, string memory landId) external onlyOwner {
        require(users[user].exists, "User does not exist");
        
        string[] storage lands = users[user].ownedLands;
        for (uint i = 0; i < lands.length; i++) {
            if (keccak256(bytes(lands[i])) == keccak256(bytes(landId))) {
                lands[i] = lands[lands.length - 1];
                lands.pop();
                emit LandRemoved(user, landId);
                break;
            }
        }
    }

    function getUserLands(address user) external view returns (string[] memory) {
        require(users[user].exists, "User does not exist");
        return users[user].ownedLands;
    }

    function isUserRegistered(address user) external view returns (bool) {
        User memory userInfo = users[user];
        return userInfo.exists;
    }
}
