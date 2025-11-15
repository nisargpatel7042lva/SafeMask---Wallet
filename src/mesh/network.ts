import { MeshPeer, MeshMessage } from '../types';
import { CryptoUtils } from '../utils/crypto';

export interface MeshConfig {
  protocols: ('bluetooth' | 'wifi' | 'lora')[];
  maxHops: number;
  storageLimit: number;
  broadcastInterval: number;
}

export class MeshNetwork {
  private peers: Map<string, MeshPeer> = new Map();
  private messages: Map<string, MeshMessage> = new Map();
  private routingTable: Map<string, string[]> = new Map();
  private config: MeshConfig;

  constructor(config: MeshConfig) {
    this.config = config;
  }

  async discoverPeers(protocol: 'bluetooth' | 'wifi' | 'lora'): Promise<MeshPeer[]> {
    const discovered: MeshPeer[] = [];
    
    const mockPeerCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < mockPeerCount; i++) {
      const peer: MeshPeer = {
        id: CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16)),
        protocol,
        address: this.generatePeerAddress(protocol),
        reputation: Math.random() * 100,
        latency: Math.floor(Math.random() * 200) + 10,
        bandwidth: Math.floor(Math.random() * 10000) + 1000
      };
      discovered.push(peer);
      this.peers.set(peer.id, peer);
    }

    return discovered;
  }

  async connectPeer(peerId: string): Promise<boolean> {
    const peer = this.peers.get(peerId);
    if (!peer) return false;

    this.routingTable.set(peerId, [peerId]);
    return true;
  }

  async disconnectPeer(peerId: string): Promise<void> {
    this.peers.delete(peerId);
    this.routingTable.delete(peerId);
  }

  async sendMessage(destinationId: string, payload: Uint8Array): Promise<string> {
    const message: MeshMessage = {
      id: CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16)),
      payload,
      hops: 0,
      maxHops: this.config.maxHops,
      timestamp: Date.now(),
      signature: CryptoUtils.randomBytes(64)
    };

    this.messages.set(message.id, message);
    await this.routeMessage(message, destinationId);
    
    return message.id;
  }

  async broadcastMessage(payload: Uint8Array): Promise<string> {
    const message: MeshMessage = {
      id: CryptoUtils.bytesToHex(CryptoUtils.randomBytes(16)),
      payload,
      hops: 0,
      maxHops: this.config.maxHops,
      timestamp: Date.now(),
      signature: CryptoUtils.randomBytes(64)
    };

    this.messages.set(message.id, message);

    for (const peerId of this.peers.keys()) {
      await this.forwardMessage(message, peerId);
    }

    return message.id;
  }

  private async routeMessage(message: MeshMessage, destinationId: string): Promise<void> {
    const route = this.routingTable.get(destinationId);
    
    if (!route || route.length === 0) {
      await this.broadcastMessage(message.payload);
      return;
    }

    const nextHop = route[0];
    await this.forwardMessage(message, nextHop);
  }

  private async forwardMessage(message: MeshMessage, nextHopId: string): Promise<void> {
    const nextHop = this.peers.get(nextHopId);
    if (!nextHop) return;

    message.hops++;
    
    if (message.hops >= message.maxHops) {
      return;
    }

    await this.delay(nextHop.latency);
  }

  async receiveMessage(messageId: string): Promise<MeshMessage | null> {
    return this.messages.get(messageId) || null;
  }

  getPeers(): MeshPeer[] {
    return Array.from(this.peers.values());
  }

  getMessageStatus(messageId: string): { delivered: boolean; hops: number } | null {
    const message = this.messages.get(messageId);
    if (!message) return null;

    return {
      delivered: message.hops < message.maxHops,
      hops: message.hops
    };
  }

  async updateRoutingTable(): Promise<void> {
    for (const peerId of this.peers.keys()) {
      if (!this.routingTable.has(peerId)) {
        this.routingTable.set(peerId, [peerId]);
      }
    }
  }

  private generatePeerAddress(protocol: 'bluetooth' | 'wifi' | 'lora'): string {
    switch (protocol) {
      case 'bluetooth':
        return Array.from({ length: 6 }, () => 
          Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':').toUpperCase();
      case 'wifi':
        return Array.from({ length: 4 }, () => 
          Math.floor(Math.random() * 256)
        ).join('.');
      case 'lora':
        return CryptoUtils.bytesToHex(CryptoUtils.randomBytes(4));
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredMessages: string[] = [];

    for (const [id, message] of this.messages.entries()) {
      if (now - message.timestamp > 3600000) {
        expiredMessages.push(id);
      }
    }

    for (const id of expiredMessages) {
      this.messages.delete(id);
    }
  }
}
