import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config';
import UserManagerABI from '../artifacts/contracts/UserManager.sol/UserManager.json';
import LandRegistryABI from '../artifacts/contracts/LandRegistry.sol/LandRegistry.json';

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
