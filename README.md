# IntelliGuard

IntelliGuard is a wallet toolkit, built on wallet connect sdks that provides intelligent smart contract security and monitoring solutions. It combines blockchain technology with modern web development to create a robust platform for smart contract security analysis and real-time monitoring.

## 🚀 Features

- Smart Contract Security Analysis
- Real-time Contract Monitoring
- Automated Vulnerability Detection
- Interactive Dashboard
- Custom Alert System
- Contract Performance Metrics

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Development Environment**: Node.js
- **Package Manager**: npm
- **Code Quality**: ESLint
- **Build Tool**: Next.js built-in bundler

### Smart Contracts
- **Framework**: Hardhat
- **Language**: Solidity
- **Testing**: Hardhat Test Suite
- **Deployment**: Hardhat Deploy
- **Network**: Ethereum (and compatible networks)

### Development Tools
- **Version Control**: Git
- **Environment Variables**: dotenv
- **Code Editor Setup**: VSCode configurations included

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env.development
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Smart Contract Setup
1. Navigate to the contracts directory:
   ```bash
   cd contracts
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Compile the contracts:
   ```bash
   npx hardhat compile
   ```
5. Run tests:
   ```bash
   npx hardhat test
   ```
