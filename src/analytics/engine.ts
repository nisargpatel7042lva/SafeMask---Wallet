import { CryptoUtils } from '../utils/crypto';

export interface AnalyticsConfig {
  enableCollection: boolean;
  privacyBudget: number;
  noiseLevel: number;
}

export interface TransactionMetric {
  count: number;
  volume: string;
  averageFee: string;
  timestamp: number;
}

export class HomomorphicAnalytics {
  private config: AnalyticsConfig;
  private encryptedMetrics: Map<string, Uint8Array> = new Map();
  private publicKey?: Uint8Array;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  setPublicKey(publicKey: Uint8Array): void {
    this.publicKey = publicKey;
  }

  async encryptMetric(value: number): Promise<Uint8Array> {
    if (!this.publicKey) {
      throw new Error('Public key not set');
    }

    const valueBytes = new Uint8Array(8);
    const view = new DataView(valueBytes.buffer);
    view.setFloat64(0, value, true);

    const iv = CryptoUtils.randomBytes(16);
    return CryptoUtils.encrypt(valueBytes, this.publicKey, iv);
  }

  async addEncryptedValues(encrypted1: Uint8Array, encrypted2: Uint8Array): Promise<Uint8Array> {
    const combined = new Uint8Array(encrypted1.length + encrypted2.length);
    combined.set(encrypted1);
    combined.set(encrypted2, encrypted1.length);
    
    return CryptoUtils.hash(combined, 'sha256');
  }

  async submitEncryptedTransaction(
    amount: string,
    fee: string,
    timestamp: number
  ): Promise<void> {
    if (!this.config.enableCollection) {
      return;
    }

    const amountValue = parseFloat(amount);
    const feeValue = parseFloat(fee);

    const encryptedAmount = await this.encryptMetric(amountValue);
    const encryptedFee = await this.encryptMetric(feeValue);

    const metricId = CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16));
    const metricData = new Uint8Array([
      ...encryptedAmount,
      ...encryptedFee,
      ...CryptoUtils.hexToBytes(timestamp.toString(16))
    ]);

    this.encryptedMetrics.set(metricId, metricData);
  }

  async aggregateMetrics(): Promise<Uint8Array> {
    const metrics = Array.from(this.encryptedMetrics.values());
    
    if (metrics.length === 0) {
      return new Uint8Array(32);
    }

    let aggregate = metrics[0];
    for (let i = 1; i < metrics.length; i++) {
      aggregate = await this.addEncryptedValues(aggregate, metrics[i]);
    }

    return aggregate;
  }

  async addDifferentialPrivacyNoise(value: number): Promise<number> {
    const noise = (Math.random() - 0.5) * 2 * this.config.noiseLevel;
    return value + noise;
  }

  consumePrivacyBudget(amount: number): boolean {
    if (this.config.privacyBudget <= 0) {
      return false;
    }

    this.config.privacyBudget -= amount;
    return true;
  }

  getRemainingBudget(): number {
    return this.config.privacyBudget;
  }
}

export class SecureMultiPartyComputation {
  private parties: Set<string> = new Set();
  private shares: Map<string, Map<string, Uint8Array>> = new Map();
  private threshold: number;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  registerParty(partyId: string): void {
    this.parties.add(partyId);
  }

  async createShares(secret: Uint8Array, n: number): Promise<Map<string, Uint8Array>> {
    const shares = new Map<string, Uint8Array>();
    const polynomial: bigint[] = [];

    const secretBigInt = BigInt('0x' + CryptoUtils.bytesToHex(secret));
    polynomial.push(secretBigInt);

    for (let i = 1; i < this.threshold; i++) {
      const coeff = BigInt('0x' + CryptoUtils.bytesToHex(CryptoUtils.randomBytes(32)));
      polynomial.push(coeff);
    }

    for (let x = 1; x <= n; x++) {
      let share = polynomial[0];
      let xPower = BigInt(x);

      for (let i = 1; i < polynomial.length; i++) {
        share += polynomial[i] * xPower;
        xPower *= BigInt(x);
      }

      const shareBytes = CryptoUtils.hexToBytes(share.toString(16).padStart(64, '0'));
      shares.set(`party-${x}`, shareBytes);
    }

    return shares;
  }

  async reconstructSecret(shares: Map<string, Uint8Array>): Promise<Uint8Array> {
    if (shares.size < this.threshold) {
      throw new Error('Insufficient shares for reconstruction');
    }

    const points: Array<{ x: bigint; y: bigint }> = [];
    
    let idx = 1;
    for (const [, shareBytes] of shares) {
      const y = BigInt('0x' + CryptoUtils.bytesToHex(shareBytes));
      points.push({ x: BigInt(idx++), y });
    }

    let secret = BigInt(0);
    
    for (let i = 0; i < points.length; i++) {
      let numerator = points[i].y;
      let denominator = BigInt(1);

      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          numerator *= (BigInt(0) - points[j].x);
          denominator *= (points[i].x - points[j].x);
        }
      }

      secret += numerator / denominator;
    }

    return CryptoUtils.hexToBytes(secret.toString(16).padStart(64, '0'));
  }

  async distributeComputation(
    data: Uint8Array,
    operation: (share: Uint8Array) => Promise<Uint8Array>
  ): Promise<Uint8Array[]> {
    const shares = await this.createShares(data, this.parties.size);
    const results: Uint8Array[] = [];

    for (const [, share] of shares) {
      const result = await operation(share);
      results.push(result);
    }

    return results;
  }
}

export class PrivacyAnalyticsEngine {
  private homomorphic: HomomorphicAnalytics;
  private mpc: SecureMultiPartyComputation;

  constructor(config: AnalyticsConfig, threshold: number) {
    this.homomorphic = new HomomorphicAnalytics(config);
    this.mpc = new SecureMultiPartyComputation(threshold);
  }

  async recordTransaction(amount: string, fee: string): Promise<void> {
    await this.homomorphic.submitEncryptedTransaction(amount, fee, Date.now());
  }

  async computeAggregates(): Promise<Uint8Array> {
    return this.homomorphic.aggregateMetrics();
  }

  async distributedQuery(
    query: (share: Uint8Array) => Promise<Uint8Array>,
    parties: string[]
  ): Promise<Uint8Array> {
    for (const party of parties) {
      this.mpc.registerParty(party);
    }

    const queryData = new TextEncoder().encode('analytics-query');
    const results = await this.mpc.distributeComputation(queryData, query);

    const shareMap = new Map<string, Uint8Array>();
    results.forEach((result, idx) => {
      shareMap.set(`party-${idx + 1}`, result);
    });

    return this.mpc.reconstructSecret(shareMap);
  }

  setEncryptionKey(publicKey: Uint8Array): void {
    this.homomorphic.setPublicKey(publicKey);
  }

  getRemainingPrivacyBudget(): number {
    return this.homomorphic.getRemainingBudget();
  }
}
