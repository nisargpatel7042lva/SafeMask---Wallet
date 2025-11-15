import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { CryptoUtils } from '../utils/crypto';
import { HDNode, KeyPair } from '../types';

export class KeyManager {
  private masterSeed?: Uint8Array;
  private hdRoot?: HDNode;
  private encryptionKey?: Uint8Array;

  async generateMnemonic(strength: number = 256): Promise<string> {
    return bip39.generateMnemonic(strength);
  }

  async initializeFromMnemonic(mnemonic: string, passphrase: string = ''): Promise<void> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
    this.masterSeed = new Uint8Array(seed);
    
    const root = bip32.fromSeed(Buffer.from(this.masterSeed));
    this.hdRoot = this.bip32NodeToHDNode(root);
    
    this.encryptionKey = CryptoUtils.hash(this.masterSeed, 'sha256');
  }

  async deriveKey(path: string): Promise<HDNode> {
    if (!this.masterSeed) {
      throw new Error('Wallet not initialized');
    }

    const root = bip32.fromSeed(Buffer.from(this.masterSeed));
    const child = root.derivePath(path);
    
    return this.bip32NodeToHDNode(child);
  }

  async deriveAddressKey(chain: string, account: number = 0, index: number = 0): Promise<HDNode> {
    const coinTypes: Record<string, number> = {
      'bitcoin': 0,
      'ethereum': 60,
      'zcash': 133,
      'polygon': 60
    };

    const coinType = coinTypes[chain.toLowerCase()];
    if (coinType === undefined) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const path = `m/44'/${coinType}'/${account}'/0/${index}`;
    return this.deriveKey(path);
  }

  async deriveViewingKey(chain: string): Promise<KeyPair> {
    const node = await this.deriveKey(`m/44'/133'/0'/1/0`);
    return {
      privateKey: node.privateKey,
      publicKey: node.publicKey
    };
  }

  async deriveSpendingKey(chain: string, index: number): Promise<KeyPair> {
    const node = await this.deriveKey(`m/44'/133'/0'/0/${index}`);
    return {
      privateKey: node.privateKey,
      publicKey: node.publicKey
    };
  }

  getEncryptionKey(): Uint8Array {
    if (!this.encryptionKey) {
      throw new Error('Wallet not initialized');
    }
    return this.encryptionKey;
  }

  private bip32NodeToHDNode(node: bip32.BIP32Interface): HDNode {
    if (!node.privateKey || !node.publicKey || !node.chainCode || node.fingerprint === undefined || node.depth === undefined || node.index === undefined) {
      throw new Error('Invalid BIP32 node');
    }

    return {
      privateKey: new Uint8Array(node.privateKey),
      publicKey: new Uint8Array(node.publicKey),
      chainCode: new Uint8Array(node.chainCode),
      depth: node.depth,
      index: node.index,
      fingerprint: new Uint8Array(node.fingerprint)
    };
  }

  destroy(): void {
    if (this.masterSeed) {
      CryptoUtils.zeroize(this.masterSeed);
      this.masterSeed = undefined;
    }
    if (this.encryptionKey) {
      CryptoUtils.zeroize(this.encryptionKey);
      this.encryptionKey = undefined;
    }
    this.hdRoot = undefined;
  }
}
