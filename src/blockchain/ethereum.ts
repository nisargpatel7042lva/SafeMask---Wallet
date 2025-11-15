import { ethers } from 'ethers';
import { BaseAdapter, TransactionStatus, BlockchainEvent } from './adapter';
import { Balance, TransactionRequest, Address } from '../types';
import { CryptoUtils } from '../utils/crypto';

export class EthereumAdapter extends BaseAdapter {
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;

  constructor(network: 'mainnet' | 'testnet', nodeUrl: string) {
    super(network, nodeUrl);
    this.provider = new ethers.JsonRpcProvider(nodeUrl);
  }

  setWallet(privateKey: Uint8Array) {
    const pkHex = CryptoUtils.bytesToHex(privateKey);
    this.wallet = new ethers.Wallet(pkHex, this.provider);
  }

  getChainName(): string {
    return 'ethereum';
  }

  async getBalance(address: string): Promise<Balance> {
    const balance = await this.retryRequest(() => 
      this.provider.getBalance(address)
    );

    return {
      chain: 'ethereum',
      token: 'ETH',
      confirmed: ethers.formatEther(balance),
      unconfirmed: '0',
      encrypted: false
    };
  }

  async sendTransaction(request: TransactionRequest): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const tx = {
      to: request.to,
      value: ethers.parseEther(request.amount),
      gasLimit: 21000n
    };

    const feeData = await this.provider.getFeeData();
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      Object.assign(tx, {
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      });
    }

    const txResponse = await this.wallet.sendTransaction(tx);
    return txResponse.hash;
  }

  async estimateFee(request: TransactionRequest): Promise<string> {
    const feeData = await this.provider.getFeeData();
    const gasLimit = 21000n;
    
    if (feeData.maxFeePerGas) {
      const totalFee = feeData.maxFeePerGas * gasLimit;
      return ethers.formatEther(totalFee);
    }
    
    return '0.001';
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return {
        hash: txHash,
        status: 'pending',
        confirmations: 0
      };
    }

    const currentBlock = await this.provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber + 1;

    return {
      hash: txHash,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      confirmations,
      blockNumber: receipt.blockNumber
    };
  }

  async generateAddress(publicKey: Uint8Array, index: number): Promise<Address> {
    const pubKeyHex = CryptoUtils.bytesToHex(publicKey);
    const address = ethers.computeAddress('0x' + pubKeyHex);

    return {
      chain: 'ethereum',
      address,
      derivationPath: `m/44'/60'/0'/0/${index}`,
      publicKey
    };
  }

  subscribeToEvents(callback: (event: BlockchainEvent) => void): void {
    this.provider.on('block', (blockNumber) => {
      callback({
        type: 'block',
        data: { blockNumber },
        chain: 'ethereum',
        timestamp: Date.now()
      });
    });
  }

  async sync(): Promise<void> {
    await this.provider.getBlockNumber();
  }
}
