import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TransactionItemProps {
  type: string;
  token: string;
  amount: string;
  address?: string;
  description?: string;
  time: string;
  color: string;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'send':
      return 'send';
    case 'receive':
      return 'arrow-back';
    case 'swap':
      return 'swap-horizontal';
    case 'nfc':
      return 'phone-portrait';
    default:
      return 'help-circle';
  }
};

const getTitle = (type: string, token: string) => {
  switch (type) {
    case 'send':
      return `Sent ${token}`;
    case 'receive':
      return `Received ${token}`;
    case 'swap':
      return `Swapped MATIC`;
    case 'nfc':
      return 'NFC Payment';
    default:
      return 'Transaction';
  }
};

export default function TransactionItem({
  type,
  token,
  amount,
  address,
  description,
  time,
  color,
}: TransactionItemProps) {
  const isNegative = amount.startsWith('-');

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.8}>
      <View style={styles.left}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={getIcon(type)} size={20} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.title}>{getTitle(type, token)}</Text>
          <Text style={styles.subtitle}>
            {description || (address ? `${type === 'send' ? 'To' : 'From'}: ${address}` : '')}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, isNegative ? styles.negative : styles.positive]}>
          {amount} {token}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  time: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
