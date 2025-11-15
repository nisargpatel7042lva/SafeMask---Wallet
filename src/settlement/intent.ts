import { PaymentIntent, SolverProposal, SwapRoute } from '../types';
import { CryptoUtils } from '../utils/crypto';

export class IntentEngine {
  private pendingIntents: Map<string, PaymentIntent> = new Map();
  private proposals: Map<string, SolverProposal[]> = new Map();
  private executedIntents: Set<string> = new Set();

  async createIntent(
    inputChain: string,
    inputToken: string,
    inputAmount: string,
    outputChain: string,
    outputToken: string,
    minOutputAmount: string,
    maxFee: string,
    deadline: number,
    privateKey: Uint8Array
  ): Promise<string> {
    const nonce = Date.now();
    const intentData = new TextEncoder().encode(
      JSON.stringify({
        inputChain,
        inputToken,
        inputAmount,
        outputChain,
        outputToken,
        minOutputAmount,
        maxFee,
        deadline,
        nonce
      })
    );

    const signature = CryptoUtils.hash(
      new Uint8Array([...intentData, ...privateKey]),
      'sha256'
    );

    const intent: PaymentIntent = {
      inputChain,
      inputToken,
      inputAmount,
      outputChain,
      outputToken,
      minOutputAmount,
      maxFee,
      deadline,
      nonce,
      signature
    };

    const intentId = CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16));
    this.pendingIntents.set(intentId, intent);
    
    return intentId;
  }

  async submitProposal(
    intentId: string,
    solverId: string,
    outputAmount: string,
    fee: string,
    estimatedTime: number,
    route: SwapRoute[],
    solverPrivateKey: Uint8Array
  ): Promise<boolean> {
    const intent = this.pendingIntents.get(intentId);
    if (!intent) {
      return false;
    }

    if (parseFloat(outputAmount) < parseFloat(intent.minOutputAmount)) {
      return false;
    }

    if (parseFloat(fee) > parseFloat(intent.maxFee)) {
      return false;
    }

    const proposalData = new TextEncoder().encode(
      JSON.stringify({
        intentId,
        solverId,
        outputAmount,
        fee,
        estimatedTime,
        route
      })
    );

    const commitment = CryptoUtils.hash(
      new Uint8Array([...proposalData, ...solverPrivateKey]),
      'sha256'
    );

    const proposal: SolverProposal = {
      intentId,
      solverId,
      outputAmount,
      fee,
      estimatedTime,
      route,
      commitment,
      reputation: Math.random() * 100
    };

    const existingProposals = this.proposals.get(intentId) || [];
    existingProposals.push(proposal);
    this.proposals.set(intentId, existingProposals);

    return true;
  }

  async getProposals(intentId: string): Promise<SolverProposal[]> {
    const proposals = this.proposals.get(intentId) || [];
    
    return proposals.sort((a, b) => {
      const aScore = parseFloat(a.outputAmount) - parseFloat(a.fee) + (a.reputation / 100);
      const bScore = parseFloat(b.outputAmount) - parseFloat(b.fee) + (b.reputation / 100);
      return bScore - aScore;
    });
  }

  async acceptProposal(
    intentId: string,
    solverId: string,
    userPrivateKey: Uint8Array
  ): Promise<boolean> {
    const proposals = this.proposals.get(intentId);
    if (!proposals) {
      return false;
    }

    const proposal = proposals.find(p => p.solverId === solverId);
    if (!proposal) {
      return false;
    }

    const acceptance = CryptoUtils.hash(
      new Uint8Array([...proposal.commitment, ...userPrivateKey]),
      'sha256'
    );

    this.executedIntents.add(intentId);
    return true;
  }

  async executeSwap(intentId: string, solverId: string): Promise<{
    success: boolean;
    txHashes: Map<string, string>;
  }> {
    const intent = this.pendingIntents.get(intentId);
    const proposals = this.proposals.get(intentId);
    
    if (!intent || !proposals) {
      return { success: false, txHashes: new Map() };
    }

    const proposal = proposals.find(p => p.solverId === solverId);
    if (!proposal) {
      return { success: false, txHashes: new Map() };
    }

    const txHashes = new Map<string, string>();

    for (const step of proposal.route) {
      const txHash = CryptoUtils.bytesToHex(CryptoUtils.randomBytes(32));
      txHashes.set(step.chain, txHash);
    }

    return { success: true, txHashes };
  }

  getIntent(intentId: string): PaymentIntent | undefined {
    return this.pendingIntents.get(intentId);
  }

  isIntentExecuted(intentId: string): boolean {
    return this.executedIntents.has(intentId);
  }

  async cancelIntent(intentId: string): Promise<boolean> {
    if (this.executedIntents.has(intentId)) {
      return false;
    }

    this.pendingIntents.delete(intentId);
    this.proposals.delete(intentId);
    return true;
  }
}

export class HTLCManager {
  private locks: Map<string, {
    hashLock: Uint8Array;
    timeLock: number;
    amount: string;
    sender: string;
    recipient: string;
    preimage?: Uint8Array;
  }> = new Map();

  async createLock(
    preimage: Uint8Array,
    timeLock: number,
    amount: string,
    sender: string,
    recipient: string
  ): Promise<string> {
    const hashLock = CryptoUtils.hash(preimage, 'sha256');
    const lockId = CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16));

    this.locks.set(lockId, {
      hashLock,
      timeLock,
      amount,
      sender,
      recipient
    });

    return lockId;
  }

  async claimLock(lockId: string, preimage: Uint8Array): Promise<boolean> {
    const lock = this.locks.get(lockId);
    if (!lock) {
      return false;
    }

    const providedHash = CryptoUtils.hash(preimage, 'sha256');
    
    if (!CryptoUtils.secureCompare(providedHash, lock.hashLock)) {
      return false;
    }

    if (Date.now() > lock.timeLock) {
      return false;
    }

    lock.preimage = preimage;
    return true;
  }

  async refundLock(lockId: string): Promise<boolean> {
    const lock = this.locks.get(lockId);
    if (!lock) {
      return false;
    }

    if (Date.now() <= lock.timeLock) {
      return false;
    }

    if (lock.preimage) {
      return false;
    }

    this.locks.delete(lockId);
    return true;
  }

  getLock(lockId: string) {
    return this.locks.get(lockId);
  }

  getPreimage(lockId: string): Uint8Array | null {
    const lock = this.locks.get(lockId);
    return lock?.preimage || null;
  }
}

export class AtomicSwapCoordinator {
  private htlcManager: HTLCManager;
  private swaps: Map<string, {
    sourceLockId: string;
    destinationLockId: string;
    status: 'pending' | 'completed' | 'refunded';
  }> = new Map();

  constructor() {
    this.htlcManager = new HTLCManager();
  }

  async initiateSwap(
    sourceChain: string,
    destinationChain: string,
    amount: string,
    sender: string,
    recipient: string,
    timeoutMinutes: number
  ): Promise<{ swapId: string; preimage: Uint8Array }> {
    const preimage = CryptoUtils.randomBytes(32);
    const timeLock = Date.now() + timeoutMinutes * 60 * 1000;

    const sourceLockId = await this.htlcManager.createLock(
      preimage,
      timeLock,
      amount,
      sender,
      recipient
    );

    const destinationLockId = await this.htlcManager.createLock(
      preimage,
      timeLock - 30 * 60 * 1000, // 30 min buffer
      amount,
      recipient,
      sender
    );

    const swapId = CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16));
    this.swaps.set(swapId, {
      sourceLockId,
      destinationLockId,
      status: 'pending'
    });

    return { swapId, preimage };
  }

  async completeSwap(swapId: string, preimage: Uint8Array): Promise<boolean> {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      return false;
    }

    const destClaimed = await this.htlcManager.claimLock(swap.destinationLockId, preimage);
    const sourceClaimed = await this.htlcManager.claimLock(swap.sourceLockId, preimage);

    if (destClaimed && sourceClaimed) {
      swap.status = 'completed';
      return true;
    }

    return false;
  }

  async refundSwap(swapId: string): Promise<boolean> {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      return false;
    }

    const sourceRefunded = await this.htlcManager.refundLock(swap.sourceLockId);
    const destRefunded = await this.htlcManager.refundLock(swap.destinationLockId);

    if (sourceRefunded || destRefunded) {
      swap.status = 'refunded';
      return true;
    }

    return false;
  }

  getSwapStatus(swapId: string): string | undefined {
    return this.swaps.get(swapId)?.status;
  }
}
