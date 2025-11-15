import { NFCPayload } from '../types';
import { CryptoUtils } from '../utils/crypto';

export interface NFCConfig {
  maxPayloadSize: number;
  timeoutMs: number;
  requireBiometric: boolean;
}

export class NFCHandler {
  private config: NFCConfig;
  private sessionKey?: Uint8Array;
  private peerPublicKey?: Uint8Array;

  constructor(config: NFCConfig) {
    this.config = config;
  }

  async initiatePairing(): Promise<{ publicKey: Uint8Array; challenge: Uint8Array }> {
    const privateKey = CryptoUtils.randomBytes(32);
    this.sessionKey = privateKey;

    const publicKey = CryptoUtils.hash(privateKey, 'sha256');
    const challenge = CryptoUtils.randomBytes(32);

    return { publicKey, challenge };
  }

  async completePairing(
    peerPublicKey: Uint8Array,
    challenge: Uint8Array,
    response: Uint8Array
  ): Promise<boolean> {
    if (!this.sessionKey) {
      throw new Error('Pairing not initiated');
    }

    const expectedResponse = CryptoUtils.hash(
      new Uint8Array([...this.sessionKey, ...challenge]),
      'sha256'
    );

    if (CryptoUtils.secureCompare(response, expectedResponse)) {
      this.peerPublicKey = peerPublicKey;
      return true;
    }

    return false;
  }

  async createPayload(
    amount: string,
    token: string,
    recipient: string,
    privateKey: Uint8Array
  ): Promise<NFCPayload> {
    if (!this.peerPublicKey) {
      throw new Error('Pairing not completed');
    }

    const payloadData = new TextEncoder().encode(
      JSON.stringify({ amount, token, recipient })
    );

    const iv = CryptoUtils.randomBytes(16);
    const encryptionKey = CryptoUtils.hash(
      new Uint8Array([...this.sessionKey!, ...this.peerPublicKey]),
      'sha256'
    );

    const encryptedData = CryptoUtils.encrypt(payloadData, encryptionKey, iv);

    const signatureData = new Uint8Array([
      ...encryptedData,
      ...CryptoUtils.hexToBytes(Date.now().toString(16))
    ]);
    const signature = CryptoUtils.hash(
      new Uint8Array([...signatureData, ...privateKey]),
      'sha256'
    );

    return {
      amount,
      token,
      recipient,
      timestamp: Date.now(),
      signature,
      encryptedData
    };
  }

  async verifyPayload(payload: NFCPayload, publicKey: Uint8Array): Promise<boolean> {
    if (!this.peerPublicKey || !this.sessionKey) {
      throw new Error('Pairing not completed');
    }

    const signatureData = new Uint8Array([
      ...payload.encryptedData,
      ...CryptoUtils.hexToBytes(payload.timestamp.toString(16))
    ]);
    const expectedSignature = CryptoUtils.hash(
      new Uint8Array([...signatureData, ...publicKey]),
      'sha256'
    );

    return CryptoUtils.secureCompare(payload.signature, expectedSignature);
  }

  async decryptPayload(payload: NFCPayload): Promise<{
    amount: string;
    token: string;
    recipient: string;
  } | null> {
    if (!this.peerPublicKey || !this.sessionKey) {
      throw new Error('Pairing not completed');
    }

    try {
      const iv = payload.encryptedData.slice(0, 16);
      const encryptionKey = CryptoUtils.hash(
        new Uint8Array([...this.sessionKey, ...this.peerPublicKey]),
        'sha256'
      );

      const decrypted = CryptoUtils.decrypt(payload.encryptedData, encryptionKey, iv);
      const payloadStr = new TextDecoder().decode(decrypted);
      
      return JSON.parse(payloadStr);
    } catch {
      return null;
    }
  }

  async createAuthorizationChallenge(): Promise<Uint8Array> {
    return CryptoUtils.randomBytes(32);
  }

  async signAuthorizationResponse(
    challenge: Uint8Array,
    privateKey: Uint8Array
  ): Promise<Uint8Array> {
    return CryptoUtils.hash(
      new Uint8Array([...challenge, ...privateKey]),
      'sha256'
    );
  }

  async verifyAuthorizationResponse(
    challenge: Uint8Array,
    response: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    const expectedResponse = CryptoUtils.hash(
      new Uint8Array([...challenge, ...publicKey]),
      'sha256'
    );

    return CryptoUtils.secureCompare(response, expectedResponse);
  }

  resetSession(): void {
    if (this.sessionKey) {
      CryptoUtils.zeroize(this.sessionKey);
    }
    this.sessionKey = undefined;
    this.peerPublicKey = undefined;
  }
}

export class NFCTransactionManager {
  private nfcHandler: NFCHandler;
  private pendingTransactions: Map<string, NFCPayload> = new Map();

  constructor(config: NFCConfig) {
    this.nfcHandler = new NFCHandler(config);
  }

  async initiatePayment(
    amount: string,
    token: string,
    recipient: string,
    privateKey: Uint8Array
  ): Promise<string> {
    const payload = await this.nfcHandler.createPayload(amount, token, recipient, privateKey);
    const txId = CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16));
    
    this.pendingTransactions.set(txId, payload);
    return txId;
  }

  async receivePayment(payload: NFCPayload, publicKey: Uint8Array): Promise<boolean> {
    const isValid = await this.nfcHandler.verifyPayload(payload, publicKey);
    
    if (isValid) {
      const txId = CryptoUtils.bytesToHex(payload.signature.slice(0, 16));
      this.pendingTransactions.set(txId, payload);
      return true;
    }

    return false;
  }

  async confirmPayment(txId: string): Promise<void> {
    this.pendingTransactions.delete(txId);
  }

  getPendingTransactions(): NFCPayload[] {
    return Array.from(this.pendingTransactions.values());
  }
}
