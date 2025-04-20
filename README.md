# Land Grab DApp

A decentralized application (DApp) that allows users to claim and own virtual land parcels using What3Words locations on the Avalanche blockchain.

## Technology Stack & Design Choices

### Blockchain: Avalanche (Fuji Testnet)

Reasons for choosing Avalanche:
1. **Fast Finality**: Sub-second transaction finality ensures quick land claim confirmations
2. **Low Fees**: Significantly lower transaction costs compared to Ethereum mainnet
3. **EVM Compatibility**: Full compatibility with Ethereum tools and libraries


### Smart Contract Development
- **Language**: Solidity v0.8.x
- **Framework**: Hardhat
- **Testing**: Chai & Mocha

Reasons:
1. Solidity is the most mature smart contract language with extensive security features
2. Hardhat provides excellent debugging and testing capabilities
3. Strong community support and extensive documentation

### Frontend Development
- **Framework**: React.js with Create React App
- **Map Integration**: Leaflet with OpenStreetMap
- **Location Services**: What3Words API
- **Web3 Integration**: ethers.js
- **UI Components**: Material-UI

Reasons:
1. React offers a robust ecosystem and excellent performance
2. Leaflet provides free, open-source mapping capabilities
3. What3Words offers precise location identification
4. ethers.js provides reliable Web3 functionality

## Features

1. **User Registration**
   - Connect MetaMask wallet
   - Register as a land claimer
   - View registration status

2. **Land Selection**
   - Interactive map interface
   - What3Words location conversion
   - Visual feedback for selected locations
   - Real-time location updates

3. **Land Claiming**
   - Claim unique land parcels
   - Blockchain-based ownership records
   - Real-time transaction feedback
   - Prevent double-claiming

## Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- MetaMask wallet with AVAX testnet tokens
- What3Words API key
- Git

## Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/bhargav55/land-grab.git
cd land-grab
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

3. Configure environment variables:
```bash
# Root directory
cp .env.example .env
# Add your private key and other variables

# Frontend directory
cd frontend
cp .env.example .env
# Add your What3Words API key
```

## Development

### Smart Contract Deployment

1. Deploy to Avalanche Fuji Testnet:
```bash
npx hardhat run scripts/deploy.js --network fuji
```

2. The deployment script will:
   - Deploy UserManager contract
   - Deploy LandRegistry contract
   - Update frontend configuration with contract addresses

### Frontend Development

1. Start the development server:
```bash
cd frontend
npm start
```

2. Open http://localhost:3000 in your browser
3. Connect MetaMask to Avalanche Fuji Testnet
4. Start interacting with the DApp

## Testing

### Smart Contract Tests
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/LandRegistry.test.js
```

### Test Coverage
```bash
npx hardhat coverage
```

## Smart Contract Architecture

The DApp uses a two-contract architecture to separate concerns and improve maintainability:

### Contract Separation Rationale

1. **Separation of Concerns**
   - UserManager handles user-related operations
   - LandRegistry focuses on land ownership and transactions
   - This separation allows independent upgrading of either system

2. **Data Organization**
   - User data and land data are logically separated
   - Prevents data structure conflicts
   - Makes the codebase more maintainable

3. **Security Benefits**
   - Granular access control
   - Reduced attack surface per contract
   - Easier to audit each contract independently

4. **Gas Optimization**
   - Smaller function calls when only user data is needed
   - Efficient data storage patterns
   - Reduced contract size improves deployment costs

### UserManager.sol
- **Purpose**: Manages user identities and permissions
- **Responsibilities**:
  - User registration and verification
  - Maintains user status and permissions
  - Tracks user's land holdings
  - Access control for land operations
- **Key Features**:
  - Single registration per address
  - Event emission for tracking
  - Gas-efficient user data storage

### LandRegistry.sol
- **Purpose**: Handles all land-related operations
- **Responsibilities**:
  - Land ownership management
  - Claim/release operations
  - Land swapping between users
  - What3Words identifier storage
- **Key Features**:
  - Double-claim prevention
  - Owner-only operations
  - Integration with UserManager for permissions
  - Event emission for transaction tracking

### Contract Interaction Flow
1. User registers through UserManager
2. UserManager verifies user status
3. LandRegistry checks with UserManager for permissions
4. LandRegistry executes land operations
5. UserManager updates user's land holdings

This architecture ensures:
- Clear responsibility boundaries
- Efficient data management
- Secure operation execution
- Future extensibility

## Security Considerations

1. **Smart Contract Security**
   - Access control for land claiming
   - Prevention of double-claiming
   - Ownership validation
   - Event emission for tracking



## License

This project is licensed under the MIT License.
