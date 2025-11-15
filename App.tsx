import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WalletScreen from './src/screens/WalletScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <WalletScreen />
    </SafeAreaProvider>
  );
}
