const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
  let UserManager;
  let LandRegistry;
  let userManager;
  let landRegistry;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy UserManager
    UserManager = await ethers.getContractFactory("UserManager");
    userManager = await UserManager.deploy();
    await userManager.waitForDeployment();
    
    // Deploy LandRegistry
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    const userManagerAddress = await userManager.getAddress();
    landRegistry = await LandRegistry.deploy(userManagerAddress);
    await landRegistry.waitForDeployment();
    
    // Register users
    const tx1 = await userManager.connect(user1).registerUser();
    await tx1.wait();
    const tx2 = await userManager.connect(user2).registerUser();
    await tx2.wait();
    
    // Transfer ownership of UserManager to LandRegistry
    const landRegistryAddress = await landRegistry.getAddress();
    const tx = await userManager.transferOwnership(landRegistryAddress);
    await tx.wait();
  });

  describe("Land Claiming", function () {
    it("Should allow registered user to claim land", async function () {
      await landRegistry.connect(user1).claimLand("test.land.one");
      expect(await landRegistry.getLandOwner("test.land.one")).to.equal(user1.address);
    });

    it("Should not allow unregistered user to claim land", async function () {
      const [,,,unregistered] = await ethers.getSigners();
      
      // Try to claim without registering
      await expect(
        landRegistry.connect(unregistered).claimLand("test.land.one")
      ).to.be.revertedWithCustomError(landRegistry, "NotRegistered");

      // Verify user is still not registered
      const isRegistered = await userManager.isUserRegistered(unregistered.address);
      expect(isRegistered).to.be.false;
    });

    it("Should not allow claiming already owned land", async function () {
      await landRegistry.connect(user1).claimLand("test.land.one");
      await expect(
        landRegistry.connect(user2).claimLand("test.land.one")
      ).to.be.revertedWithCustomError(landRegistry, "LandAlreadyOwned");
    });

    it("Should emit LandClaimed event", async function () {
      await expect(landRegistry.connect(user1).claimLand("test.land.one"))
        .to.emit(landRegistry, "LandClaimed")
        .withArgs("test.land.one", user1.address);
    });
  });

  describe("Land Release", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).claimLand("test.land.one");
    });

    it("Should allow owner to release their land", async function () {
      await landRegistry.connect(user1).releaseLand("test.land.one");
      expect(await landRegistry.isLandOwned("test.land.one")).to.be.false;
    });

    it("Should not allow non-owner to release land", async function () {
      await expect(
        landRegistry.connect(user2).releaseLand("test.land.one")
      ).to.be.revertedWithCustomError(landRegistry, "NotLandOwner");
    });

    it("Should emit LandReleased event", async function () {
      await expect(landRegistry.connect(user1).releaseLand("test.land.one"))
        .to.emit(landRegistry, "LandReleased")
        .withArgs("test.land.one", user1.address);
    });
  });

  describe("Land Swapping", function () {
    beforeEach(async function () {
      await landRegistry.connect(user1).claimLand("test.land.one");
      await landRegistry.connect(user2).claimLand("test.land.two");
    });

    it("Should allow users to swap lands", async function () {
      await landRegistry.connect(user1).swapLand("test.land.one", "test.land.two", user2.address);
      
      expect(await landRegistry.getLandOwner("test.land.one")).to.equal(user2.address);
      expect(await landRegistry.getLandOwner("test.land.two")).to.equal(user1.address);
    });

    it("Should not allow swapping unowned land", async function () {
      await expect(
        landRegistry.connect(user1).swapLand("nonexistent.land", "test.land.two", user2.address)
      ).to.be.revertedWithCustomError(landRegistry, "NotLandOwner");
    });

    it("Should not allow swapping with incorrect owner", async function () {
      await expect(
        landRegistry.connect(user1).swapLand("test.land.one", "test.land.two", user1.address)
      ).to.be.revertedWithCustomError(landRegistry, "NotLandOwner");
    });

    it("Should emit LandSwapped event", async function () {
      await expect(landRegistry.connect(user1).swapLand("test.land.one", "test.land.two", user2.address))
        .to.emit(landRegistry, "LandSwapped")
        .withArgs("test.land.one", "test.land.two", user1.address, user2.address);
    });
  });
});
