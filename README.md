# Meshcrypt Wallet

Privacy-focused cryptocurrency wallet with mesh networking, NFC payments, and cross-chain support.

## Features

- **Privacy by Default**: Hidden balances via encrypted commitments and zero-knowledge proofs
- **Mesh Networking**: Offline transaction propagation over Bluetooth, WiFi, and LoRa
- **NFC Payments**: Tap-to-pay and tap-to-authorize workflows
- **Cross-Chain Support**: Zcash shielded pools, Ethereum, and Polygon integration
- **Unified Addressing**: Single meta-address resolving to chain-specific addresses
- **Intent-Based Settlement**: Private cross-chain swaps with atomic execution
- **Privacy Analytics**: Homomorphic encryption and secure multi-party computation

## Architecture

The wallet is built in modular layers:

1. Custody and Key Management (BIP-32/BIP-44 HD wallets)
2. Privacy and Cryptographic Engine (zk-SNARKs, commitments, stealth addresses)
3. Blockchain Integration (Zcash, Ethereum, Polygon adapters)
4. Mesh Network Protocol (peer-to-peer routing)
5. NFC Transaction System (secure proximity payments)
6. Unified Address Resolution (cross-chain meta-addresses)
7. Intent-Based Settlement (atomic swaps and routing)
8. Privacy-Preserving Analytics (encrypted aggregation)
9. Developer SDK (REST and gRPC APIs)

## Installation

```bash
npm install
npm run build
```

## Usage

```typescript
import { MeshcryptWallet } from 'meshcrypt-wallet';

const wallet = new MeshcryptWallet({
  network: 'mainnet',
  enableMesh: true,
  enableNFC: true
});

await wallet.initialize();
const balance = await wallet.getBalance();
await wallet.sendTransaction({
  to: 'mesh://recipient-address',
  amount: '1.0',
  privacy: 'maximum'
});
```

## Development

```bash
npm run dev     # Watch mode
npm test        # Run tests
npm run lint    # Lint code
```

## License

MIT
