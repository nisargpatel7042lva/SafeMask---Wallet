import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MeshNetwork() {
  const protocols = [
    { name: 'BLE', count: 5 },
    { name: 'WiFi Direct', count: 4 },
    { name: 'LoRa', count: 3 },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Mesh Network</Text>
      
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.label}>Peers Connected</Text>
          <Text style={styles.count}>12/20</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
      </View>

      <View style={styles.protocolsList}>
        {protocols.map((protocol, index) => (
          <View key={index} style={styles.protocolRow}>
            <Text style={styles.protocolName}>{protocol.name}</Text>
            <Text style={styles.protocolCount}>{protocol.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 4,
  },
  protocolsList: {
    gap: 8,
  },
  protocolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protocolName: {
    fontSize: 13,
    color: '#9ca3af',
  },
  protocolCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
  },
});
