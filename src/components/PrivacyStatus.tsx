import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PrivacyStatus() {
  const items = [
    { label: 'Balance Hidden', status: 'Active', color: '#10B981' },
    { label: 'Stealth Addresses', status: 'On', color: '#10B981' },
    { label: 'Zero-Knowledge', status: 'Enabled', color: '#10B981' },
    { label: 'Mesh Routing', status: 'Active', color: '#10B981' },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Privacy Status</Text>
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.status, { color: item.color }]}>{item.status}</Text>
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
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
  },
});
