const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserManager", function () {
  let UserManager;
  let userManager;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    UserManager = await ethers.getContractFactory("UserManager");
    userManager = await UserManager.deploy();
  });

  describe("User Registration", function () {
    it("Should allow a user to register", async function () {
      await userManager.connect(user1).registerUser();
      expect(await userManager.isUserRegistered(user1.address)).to.be.true;
    });

    it("Should not allow a user to register twice", async function () {
      await userManager.connect(user1).registerUser();
      await expect(
        userManager.connect(user1).registerUser()
      ).to.be.revertedWith("User already registered");
    });

    it("Should emit UserRegistered event", async function () {
      await expect(userManager.connect(user1).registerUser())
        .to.emit(userManager, "UserRegistered")
        .withArgs(user1.address);
    });
  });

  describe("User Deletion", function () {
    beforeEach(async function () {
      await userManager.connect(user1).registerUser();
    });

    it("Should allow a user to delete their account", async function () {
      await userManager.connect(user1).deleteUser();
      expect(await userManager.isUserRegistered(user1.address)).to.be.false;
    });

    it("Should not allow unregistered user to delete", async function () {
      await expect(
        userManager.connect(user2).deleteUser()
      ).to.be.revertedWith("User not registered");
    });

    it("Should emit UserDeleted event", async function () {
      await expect(userManager.connect(user1).deleteUser())
        .to.emit(userManager, "UserDeleted")
        .withArgs(user1.address);
    });
  });

  describe("Land Management", function () {
    beforeEach(async function () {
      await userManager.connect(user1).registerUser();
    });

    it("Should allow owner to add land to user", async function () {
      await userManager.addLandToUser(user1.address, "test.land.id");
      const lands = await userManager.getUserLands(user1.address);
      expect(lands).to.deep.equal(["test.land.id"]);
    });

    it("Should not allow non-owner to add land", async function () {
      await expect(
        userManager.connect(user1).addLandToUser(user1.address, "test.land.id")
      ).to.be.reverted;
    });

    it("Should allow owner to remove land from user", async function () {
      await userManager.addLandToUser(user1.address, "test.land.id");
      await userManager.removeLandFromUser(user1.address, "test.land.id");
      const lands = await userManager.getUserLands(user1.address);
      expect(lands).to.be.empty;
    });

    it("Should emit LandAdded event", async function () {
      await expect(userManager.addLandToUser(user1.address, "test.land.id"))
        .to.emit(userManager, "LandAdded")
        .withArgs(user1.address, "test.land.id");
    });

    it("Should emit LandRemoved event", async function () {
      await userManager.addLandToUser(user1.address, "test.land.id");
      await expect(userManager.removeLandFromUser(user1.address, "test.land.id"))
        .to.emit(userManager, "LandRemoved")
        .withArgs(user1.address, "test.land.id");
    });
  });
});
