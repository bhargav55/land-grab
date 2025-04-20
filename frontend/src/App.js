import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, CircularProgress, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import Map from './components/Map';
import { getWeb3Provider, getUserManagerContract, getLandRegistryContract, releaseLand, swapLand, getLandOwner, isLandOwned } from './utils/web3';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [landOwner, setLandOwner] = useState(null);
  const [isLandOwnedByAnyone, setIsLandOwnedByAnyone] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [otherLandId, setOtherLandId] = useState('');
  const [otherOwner, setOtherOwner] = useState('');
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

  const checkLandOwnership = async (what3wordsId) => {
    try {
      const owned = await isLandOwned(what3wordsId);
      setIsLandOwnedByAnyone(owned);

      if (owned) {
        const owner = await getLandOwner(what3wordsId);
        setLandOwner(owner);
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } else {
        setLandOwner(null);
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Error checking land ownership:', error);
      setIsLandOwnedByAnyone(false);
      setLandOwner(null);
      setIsOwner(false);
    }
  };

  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    await checkLandOwnership(location.words);
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

  const handleRelease = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    try {
      await releaseLand(selectedLocation.words);
      setSelectedLocation(null);
      showNotification('Land released successfully!');
    } catch (error) {
      console.error('Error releasing land:', error);
      showNotification('Failed to release land: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!selectedLocation || !otherLandId || !otherOwner) return;
    
    setLoading(true);
    try {
      await swapLand(selectedLocation.words, otherLandId, otherOwner);
      setSwapDialogOpen(false);
      setOtherLandId('');
      setOtherOwner('');
    } catch (error) {
      console.error('Error swapping land:', error);
      alert('Failed to swap land. ' + error.message);
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
                  <Box>
                    <Typography variant="body1" gutterBottom color="success.main">
                      Selected Location: {selectedLocation.words}
                    </Typography>
                    {isLandOwnedByAnyone && (
                      <Typography variant="body2" color={isOwner ? 'success.main' : 'error.main'} gutterBottom>
                        {isOwner ? 'You own this land' : `Owned by: ${landOwner}`}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {!isLandOwnedByAnyone && (
                        <Button
                          variant="contained"
                          onClick={claimLand}
                          disabled={loading}
                          size="large"
                          fullWidth
                        >
                          {loading ? 'Claiming Land...' : 'Claim This Land'}
                        </Button>
                      )}
                      {isOwner && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={handleRelease}
                          disabled={loading}
                          size="large"
                          fullWidth
                        >
                          Release Land
                        </Button>
                      )}
                    </Box>
                    {isOwner && (
                      <Button
                        variant="outlined"
                        onClick={() => setSwapDialogOpen(true)}
                        disabled={loading}
                        size="large"
                        fullWidth
                      >
                        Swap Land
                      </Button>
                    )}
                  </Box>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Click on the map to select a location to claim
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Dialog open={swapDialogOpen} onClose={() => setSwapDialogOpen(false)}>
          <DialogTitle>Swap Land</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" gutterBottom>
                Your Land: {selectedLocation?.words}
              </Typography>
              <TextField
                label="Other Land ID (what3words)"
                value={otherLandId}
                onChange={(e) => setOtherLandId(e.target.value)}
                fullWidth
              />
              <TextField
                label="Other Owner Address"
                value={otherOwner}
                onChange={(e) => setOtherOwner(e.target.value)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSwapDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSwap}
              variant="contained"
              disabled={!otherLandId || !otherOwner || loading}
            >
              {loading ? 'Swapping...' : 'Swap'}
            </Button>
          </DialogActions>
        </Dialog>

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
