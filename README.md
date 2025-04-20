# Land Grab DApp

A blockchain-based land claiming application that allows users to claim, release, and swap virtual land parcels using the what3words system.

## Features

- Claim 9x9 feet land squares using what3words identifiers
- Release owned land back to the system
- Swap land with other users
- User profile management with land inventory
- Geolocation-based claiming system
- Smart contract powered ownership system

## Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- MetaMask wallet
- what3words API key

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your what3words API key:
```
WHAT3WORDS_API_KEY=your-api-key-here
```

## Development

1. Start local Hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Start the frontend development server:
```bash
cd frontend
npm start
```

## Testing

Run the test suite:
```bash
npx hardhat test
```

## Smart Contracts

- `UserManager.sol`: Handles user registration and land inventory
- `LandRegistry.sol`: Manages land ownership and transactions

## License

MIT
