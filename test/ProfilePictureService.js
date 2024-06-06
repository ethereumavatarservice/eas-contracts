const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("ProfilePictureService", function () {
    async function deployFixture() {
        const [owner, client] = await ethers.getSigners();

        const profilePictureService = await ethers.deployContract("ProfilePictureService");
        const erc721Mock = await ethers.deployContract("ERC721Mock");
        const erc1155Mock = await ethers.deployContract("ERC1155Mock");

        const profilePictureServiceAddress = await profilePictureService.getAddress();
        const erc721MockAddress = await erc721Mock.getAddress();
        const erc1155MockAddress = await erc1155Mock.getAddress();

        return {
            profilePictureService,
            erc721Mock,
            erc1155Mock,
            owner,
            client,
            profilePictureServiceAddress,
            erc721MockAddress,
            erc1155MockAddress
        };
    }

    it("Should own ERC721 token", async function () {
        const {
            erc721Mock,
            client
        } = await loadFixture(deployFixture);

        await erc721Mock.mint(client.address, 1);

        const balance = await erc721Mock.balanceOf(client.address);

        expect(balance).to.equal(1);
    });

    it("Should own ERC1155 token", async function () {
        const {
            erc1155Mock,
            client
        } = await loadFixture(deployFixture);

        await erc1155Mock.mint(client.address, 1, 1);

        const balance = await erc1155Mock.balanceOf(client.address, 1);

        expect(balance).to.equal(1);
    });

    it("Should set and get profile picture with ERC721 token", async function () {
        const {
            profilePictureService,
            erc721Mock,
            client,
            erc721MockAddress
        } = await loadFixture(deployFixture);

        await erc721Mock.mint(client.address, 1);

        await profilePictureService
            .connect(client)
            .setProfilePicture(erc721MockAddress, 1);

        const profilePictureInfo = await profilePictureService.getProfilePictureInfo(client.address);

        expect(profilePictureInfo[0].tokenAddress).to.equal(erc721MockAddress);
        expect(profilePictureInfo[0].tokenId).to.equal(1);
    });

    it("Should return owned as false when set profile picture with ERC721 token is no longer owned", async function () {
        const {
            profilePictureService,
            erc721Mock,
            owner,
            client,
            erc721MockAddress
        } = await loadFixture(deployFixture);

        await erc721Mock.mint(client.address, 1);

        await profilePictureService
            .connect(client)
            .setProfilePicture(erc721MockAddress, 1);

        // Transfer the token out
        await erc721Mock
            .connect(client)
            .safeTransferFrom(client.address, owner.address, 1);

        const profilePictureInfo = await profilePictureService.getProfilePictureInfo(client.address);

        expect(profilePictureInfo[0].tokenAddress).to.equal(erc721MockAddress);
        expect(profilePictureInfo[0].tokenId).to.equal(1);
        expect(profilePictureInfo[1]).to.equal(false);
    });

    it("Should set and get profile picture with ERC1155 token", async function () {
        const {
            profilePictureService,
            erc1155Mock,
            client ,
            erc1155MockAddress
        } = await loadFixture(deployFixture);

        await erc1155Mock.mint(client.address, 1, 1);

        await profilePictureService
            .connect(client)
            .setProfilePicture(erc1155MockAddress, 1);

        const profilePictureInfo = await profilePictureService.getProfilePictureInfo(client.address);

        expect(profilePictureInfo[0].tokenAddress).to.equal(erc1155MockAddress);
        expect(profilePictureInfo[0].tokenId).to.equal(1);
    });

    it("Should return owned as false when set profile picture with ERC1155 token is no longer owned", async function () {
        const {
            profilePictureService,
            erc1155Mock,
            owner,
            client,
            erc1155MockAddress
        } = await loadFixture(deployFixture);

        await erc1155Mock.mint(client.address, 1, 1);

        await profilePictureService
            .connect(client)
            .setProfilePicture(erc1155Mock, 1);

        // Transfer the token out
        await erc1155Mock
            .connect(client)
            .safeTransferFrom(client.address, owner.address, 1, 1, "0x");

        const profilePictureInfo = await profilePictureService.getProfilePictureInfo(client.address);

        expect(profilePictureInfo[0].tokenAddress).to.equal(erc1155MockAddress);
        expect(profilePictureInfo[0].tokenId).to.equal(1);
        expect(profilePictureInfo[1]).to.equal(false);
    });

    it("Should return zero address as profile picture when none set", async function () {
        const {
            profilePictureService,
            client
        } = await loadFixture(deployFixture);

        const profilePictureInfo = await profilePictureService.getProfilePictureInfo(client.address);

        expect(profilePictureInfo[0].tokenAddress).to.equal(ethers.ZeroAddress);
        expect(profilePictureInfo[0].tokenId).to.equal(0);
        expect(profilePictureInfo[1]).to.equal(true);
    });

    it("Should revert if the ERC721 token does not exist", async function () {
        const {
            profilePictureService,
            client,
            erc721MockAddress
        } = await loadFixture(deployFixture);

        await expect(
            profilePictureService
                .connect(client)
                .setProfilePicture(erc721MockAddress, 1)
        ).to.be.revertedWith("Caller is not the owner of the NFT");
    });

    it("Should revert if the user is not the owner of the ERC721 token", async function () {
        const {
            profilePictureService,
            owner,
            client,
            erc721Mock,
            erc721MockAddress
        } = await loadFixture(deployFixture);

        // Need to mint to another address or the token (id) won't exist
        await erc721Mock.mint(owner.address, 1);

        await expect(
            profilePictureService
                .connect(client)
                .setProfilePicture(erc721MockAddress, 1)
        ).to.be.revertedWith("Caller is not the owner of the NFT");
    });

    it("Should revert if the user does not own any of the ERC1155 token", async function () {
        const {
            profilePictureService,
            client,
            erc1155MockAddress
        } = await loadFixture(deployFixture);

        await expect(
            profilePictureService
                .connect(client)
                .setProfilePicture(erc1155MockAddress, 1)
        ).to.be.revertedWith("Caller is not the owner of the NFT");
    });

    it("Should emit ProfilePictureSet event", async function () {
        const {
            profilePictureService,
            erc721Mock,
            client,
            erc721MockAddress
        } = await loadFixture(deployFixture);

        await erc721Mock.mint(client.address, 1);

        await expect(
            profilePictureService
                .connect(client)
                .setProfilePicture(erc721MockAddress, 1)
        )
            .to.emit(profilePictureService, 'ProfilePictureSet')
            .withArgs(client.address, erc721MockAddress, 1);
    });
});