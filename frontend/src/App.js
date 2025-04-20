import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, CircularProgress, Snackbar } from '@mui/material';
import Map from './components/Map';
import { getWeb3Provider, getUserManagerContract, getLandRegistryContract } from './utils/web3';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '' });
  const [isRegistered, setIsRegistered] = useState(false);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', () => {
        connectWallet();
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        connectWallet();
      });
    }

    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', connectWallet);
        window.ethereum.removeListener('chainChanged', connectWallet);
      }
    };
  }, []);

  const switchToAvalancheFuji = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xA869', // 43113 in hex
          chainName: 'Avalanche Fuji Testnet',
          nativeCurrency: {
            name: 'AVAX',
            symbol: 'AVAX',
            decimals: 18
          },
          rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://testnet.snowtrace.io/']
        }]
      });
      return true;
    } catch (error) {
      console.error('Error switching to Avalanche Fuji:', error);
      showNotification('Error switching network. Please switch manually to Avalanche Fuji Testnet.');
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      const provider = await getWeb3Provider(); // This will handle network switching
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      
      // Get the current network after potential switch
      const chainNetwork = await provider.getNetwork();
      setNetwork(chainNetwork);

      // Verify we're on Avalanche Fuji
      if (chainNetwork.chainId !== 43113) {
        showNotification('Please connect to Avalanche Fuji Testnet');
        setAccount(null);
        setNetwork(null);
        return;
      }

      // Check user registration
      const userManager = await getUserManagerContract(provider);
      try {
        const registered = await userManager.isUserRegistered(address);
        setIsRegistered(registered);
        if (registered) {
          showNotification('Welcome back!');
        }
      } catch (contractError) {
        console.error('Error checking registration:', contractError);
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showNotification('Error connecting wallet. Please make sure MetaMask is installed and connected to Avalanche Fuji testnet.');
      setAccount(null);
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const registerUser = async () => {
    try {
      setLoading(true);
      const provider = await getWeb3Provider();
      const userManager = await getUserManagerContract(provider);
      const tx = await userManager.registerUser();
      await tx.wait();
      setIsRegistered(true);
      showNotification('Successfully registered!');
    } catch (error) {
      console.error('Error registering user:', error);
      showNotification('Error registering user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const claimLand = async () => {
    if (!selectedLocation) {
      showNotification('Please select a location first');
      return;
    }

    try {
      setLoading(true);
      const provider = await getWeb3Provider();
      const landRegistry = await getLandRegistryContract(provider);
      const tx = await landRegistry.claimLand(selectedLocation.words);
      await tx.wait();
      showNotification('Successfully claimed land!');
    } catch (error) {
      console.error('Error claiming land:', error);
      showNotification('Error claiming land: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setNotification({ open: true, message });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Land Grab DApp
        </Typography>

        {!account ? (
          <Button variant="contained" onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        ) : (
          <Box>
            <Typography variant="body1" gutterBottom>
              Connected Account: {account}
            </Typography>
            <Typography variant="body2" color={network?.chainId === 43113 ? 'success.main' : 'error.main'} gutterBottom>
              Network: {network?.chainId === 43113 ? 'Avalanche Fuji Testnet' : 'Wrong Network'}
            </Typography>
            <Typography variant="body2" color={isRegistered ? 'success.main' : 'warning.main'} gutterBottom>
              Status: {isRegistered ? 'Registered User' : 'Not Registered'}
            </Typography>
            {!isRegistered && (
              <Button 
                variant="contained" 
                onClick={registerUser} 
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? 'Registering...' : 'Register User'}
              </Button>
            )}
          </Box>
        )}

        {isRegistered && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Select Location to Claim
            </Typography>
            <Map onLocationSelect={handleLocationSelect} />
            <Box sx={{
              mt: 2,
              p: 2,
              border: '1px solid',
              borderColor: selectedLocation ? 'success.main' : 'grey.300',
              borderRadius: 1,
              bgcolor: 'background.paper'
            }}>
              {selectedLocation ? (
                <>
                  <Typography variant="body1" gutterBottom color="success.main">
                    Selected Location: {selectedLocation.words}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={claimLand}
                    disabled={loading}
                    size="large"
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    {loading ? 'Claiming Land...' : 'Claim This Land'}
                  </Button>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Click on the map to select a location to claim
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          message={notification.message}
        />
      </Box>
    </Container>
  );
}

export default App;
