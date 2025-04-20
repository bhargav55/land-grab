import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config';
import UserManagerABI from '../artifacts/contracts/UserManager.sol/UserManager.json';
import LandRegistryABI from '../artifacts/contracts/LandRegistry.sol/LandRegistry.json';

export const getLandOwner = async (what3wordsId) => {
  const provider = await getWeb3Provider();
  const landRegistry = new ethers.Contract(
    CONTRACT_ADDRESSES.LandRegistry,
    LandRegistryABI,
    provider
  );

  try {
    const owner = await landRegistry.getLandOwner(what3wordsId);
    return owner;
  } catch (error) {
    console.error('Error getting land owner:', error);
    return null;
  }
};

export const isLandOwned = async (what3wordsId) => {
  const provider = await getWeb3Provider();
  const landRegistry = new ethers.Contract(
    CONTRACT_ADDRESSES.LandRegistry,
    LandRegistryABI,
    provider
  );

  try {
    return await landRegistry.isLandOwned(what3wordsId);
  } catch (error) {
    console.error('Error checking land ownership:', error);
    return false;
  }
};

export const releaseLand = async (what3wordsId) => {
  const provider = await getWeb3Provider();
  const signer = provider.getSigner();
  const landRegistry = new ethers.Contract(
    CONTRACT_ADDRESSES.LandRegistry,
    LandRegistryABI,
    signer
  );

  try {
    const tx = await landRegistry.releaseLand(what3wordsId);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error releasing land:', error);
    throw error;
  }
};

export const swapLand = async (myLandId, otherLandId, otherOwner) => {
  const provider = await getWeb3Provider();
  const signer = provider.getSigner();
  const landRegistry = new ethers.Contract(
    CONTRACT_ADDRESSES.LandRegistry,
    LandRegistryABI,
    signer
  );

  try {
    const tx = await landRegistry.swapLand(myLandId, otherLandId, otherOwner);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error swapping land:', error);
    throw error;
  }
};

export const getWeb3Provider = async () => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  // Request account access
  await window.ethereum.request({ method: 'eth_requestAccounts' });

  // Check if we need to switch to Avalanche Fuji
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== '0xa869') { // 43113 in hex
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa869' }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xa869',
              chainName: 'Avalanche Fuji Testnet',
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18
              },
              rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
              blockExplorerUrls: ['https://testnet.snowtrace.io/']
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Create provider with Avalanche Fuji RPC
  const provider = new ethers.providers.Web3Provider(window.ethereum, {
    chainId: 43113,
    name: 'Avalanche Fuji Testnet'
  });

  return provider;
};

export const getUserManagerContract = async (provider) => {
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESSES.UserManager, UserManagerABI.abi, signer);
};

export const getLandRegistryContract = async (provider) => {
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESSES.LandRegistry, LandRegistryABI.abi, signer);
};
