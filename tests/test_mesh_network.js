/**
 * Mesh Network Test
 * 
 * Demonstrates mesh networking capabilities:
 * - Peer discovery (BLE, WiFi, LoRa)
 * - Gossip protocol
 * - Transaction broadcasting
 * - ECDH handshakes
 * - Reputation system
 */

/* eslint-disable no-undef, no-console, @typescript-eslint/no-var-requires */

const { MeshNetwork, broadcastTransaction } = require('../dist/src/mesh/network');

async function testMeshNetwork() {
  console.log('=== Mesh Network Test ===\n');

  // Create three mesh nodes
  console.log('1. Creating mesh nodes...');
  const alice = new MeshNetwork();
  const bob = new MeshNetwork();
  const carol = new MeshNetwork();

  console.log(`Alice: ${alice.getPeerId()}`);
  console.log(`Bob: ${bob.getPeerId()}`);
  console.log(`Carol: ${carol.getPeerId()}\n`);

  // Start networks
  console.log('2. Starting mesh networks...');
  await alice.start();
  await bob.start();
  await carol.start();

  console.log(`Alice peers: ${alice.getPeers().length}`);
  console.log(`Bob peers: ${bob.getPeers().length}`);
  console.log(`Carol peers: ${carol.getPeers().length}\n`);

  // Register message handlers
  alice.onMessage('transaction', (msg, peer) => {
    console.log(`[Alice] Received transaction from ${peer.id}`);
  });

  bob.onMessage('transaction', (msg, peer) => {
    console.log(`[Bob] Received transaction from ${peer.id}`);
  });

  carol.onMessage('transaction', (msg, peer) => {
    console.log(`[Carol] Received transaction from ${peer.id}`);
  });

  // Broadcast transaction from Alice
  console.log('3. Broadcasting transaction from Alice...');
  const tx = {
    from: alice.getPeerId(),
    to: bob.getPeerId(),
    amount: '1.5 ETH',
    timestamp: Date.now()
  };

  const msgId = await broadcastTransaction(alice, tx);
  console.log(`Transaction broadcast: ${msgId}\n`);

  // Wait for gossip propagation
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check network stats
  console.log('4. Network statistics:');
  console.log('Alice:', alice.getStats());
  console.log('Bob:', bob.getStats());
  console.log('Carol:', carol.getStats());

  // Test direct messaging
  console.log('\n5. Testing direct messaging...');
  const bobPeers = bob.getPeers();
  if (bobPeers.length > 0) {
    const targetPeer = bobPeers[0].id;
    console.log(`Bob sending message to peer ${targetPeer}`);
    
    const payload = Buffer.from(JSON.stringify({
      type: 'ping',
      timestamp: Date.now()
    }));
    
    const directMsgId = await bob.sendMessage(targetPeer, payload);
    console.log(`Direct message sent: ${directMsgId}`);
  }

  // Test peer reputation
  console.log('\n6. Peer reputations:');
  for (const peer of alice.getPeers()) {
    console.log(`  ${peer.id}: ${peer.reputation.toFixed(1)} (${peer.protocol})`);
  }

  // Cleanup
  console.log('\n7. Stopping networks...');
  await alice.stop();
  await bob.stop();
  await carol.stop();

  console.log('\n✅ Mesh network test complete!');
}

// Run test
testMeshNetwork().catch(console.error);
