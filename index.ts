// Polyfills must be imported first, in this exact order:
// crypto.getRandomValues (needed by @solana/web3.js, tweetnacl, @noble/*)
// is NOT available in the Hermes/React Native runtime by default —
// without this, wallet generation and PQ crypto fail silently.
import 'react-native-get-random-values';

import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;

import 'expo-router/entry';
