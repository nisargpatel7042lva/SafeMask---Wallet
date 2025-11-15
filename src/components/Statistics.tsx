import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Statistics() {
  const stats = [
    { label: 'Total Transactions', value: '247' },
    { label: 'Avg Proof Time', value: '2.3s' },
    { label: 'Gas Saved', value: '$342', color: '#10B981' },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Statistics</Text>
      <View style={styles.list}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{stat.label}</Text>
            <Text style={[styles.value, stat.color && { color: stat.color }]}>
              {stat.value}
            </Text>
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
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
