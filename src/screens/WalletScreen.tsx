import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import BalanceCard from '../components/BalanceCard';
import AssetCard from '../components/AssetCard';
import ActionButton from '../components/ActionButton';
import TransactionItem from '../components/TransactionItem';
import PrivacyStatus from '../components/PrivacyStatus';
import MeshNetwork from '../components/MeshNetwork';
import Statistics from '../components/Statistics';

export default function WalletScreen() {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const assets = [
    { name: 'Zcash', symbol: 'ZEC', amount: '12.5', value: '$3,750.00', icon: '⚡', color: '#F4B024' },
    { name: 'Ethereum', symbol: 'ETH', amount: '8.3', value: '$16,600.00', icon: '◆', color: '#627EEA' },
    { name: 'Polygon', symbol: 'MATIC', amount: '5,420', value: '$4,232.50', icon: '⬡', color: '#8247E5' },
  ];

  const transactions = [
    { type: 'send', token: 'ZEC', amount: '-2.5', address: 'zs1abc...def789', time: '2 min ago', color: '#A855F7' },
    { type: 'receive', token: 'ETH', amount: '+1.2', address: '0x742d...0bEb', time: '1 hour ago', color: '#10B981' },
    { type: 'swap', token: 'ETH', amount: '+0.8', description: '500 MATIC → 0.8 ETH', time: '3 hours ago', color: '#3B82F6' },
    { type: 'nfc', token: 'ETH', amount: '-0.01', description: 'Coffee Shop', time: 'Yesterday', color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />

        {/* Balance Section */}
        <View style={styles.section}>
          <BalanceCard 
            totalBalance="$24,582.50"
            change="+$2,741.23 (12.4%)"
            privacyScore="98%"
            balanceHidden={balanceHidden}
            onToggleBalance={() => setBalanceHidden(!balanceHidden)}
          />

          {/* Assets Grid */}
          <View style={styles.assetsGrid}>
            {assets.map((asset, index) => (
              <AssetCard key={index} {...asset} />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <View style={styles.actionsGrid}>
            <ActionButton icon="send" label="Send" color="#A855F7" />
            <ActionButton icon="receive" label="Receive" color="#10B981" />
            <ActionButton icon="swap" label="Swap" color="#3B82F6" />
            <ActionButton icon="nfc" label="NFC Pay" color="#F59E0B" />
          </View>
        </View>

        {/* Bottom Content */}
        <View style={styles.bottomContent}>
          {/* Transactions */}
          <View style={styles.transactionsCard}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.filterButtons}>
                {['All', 'Sent', 'Received'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      activeFilter === filter && styles.filterButtonActive,
                    ]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        activeFilter === filter && styles.filterButtonTextActive,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.transactionsList}>
              {transactions.map((tx, index) => (
                <TransactionItem key={index} {...tx} />
              ))}
            </View>
          </View>

          {/* Sidebar Cards */}
          <View style={styles.sidebar}>
            <PrivacyStatus />
            <MeshNetwork />
            <Statistics />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  assetsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomContent: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 32,
  },
  transactionsCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  transactionsList: {
    gap: 12,
  },
  sidebar: {
    gap: 16,
  },
});
