/**
 * Post-Quantum Cryptography Service
 * 
 * Implements hybrid classical + post-quantum encryption for wallet protection.
 * Uses ML-KEM-768 (FIPS 203) for key encapsulation and ML-DSA-65 (FIPS 204)
 * for digital signatures, via @noble/post-quantum library.
 * 
 * Architecture:
 * 1. PQ KeyPair is generated and stored in SecureStore
 * 2. Wallet secret keys are encrypted using PQ-derived shared secret + AES-256-GCM
 * 3. Transactions can be additionally verified with ML-DSA signatures
 */
import * as SecureStore from 'expo-secure-store';

// Storage keys
const PQ_KEM_PUBLIC_KEY = 'pq_kem_public_key';
const PQ_KEM_PRIVATE_KEY = 'pq_kem_private_key';
const PQ_DSA_PUBLIC_KEY = 'pq_dsa_public_key';
const PQ_DSA_PRIVATE_KEY = 'pq_dsa_private_key';
const PQ_ENCRYPTED_CIPHERTEXT = 'pq_encrypted_ciphertext';
const PQ_INITIALIZED = 'pq_initialized';

export interface PQKeyPairs {
  kemPublicKey: Uint8Array;
  kemPrivateKey: Uint8Array;
  dsaPublicKey: Uint8Array;
  dsaPrivateKey: Uint8Array;
}

export interface PQEncryptedData {
  ciphertext: string;        // base64 KEM ciphertext
  encryptedPayload: string;  // base64 AES-256-GCM encrypted data
  iv: string;                // base64 initialization vector
  tag: string;               // base64 auth tag
}

/**
 * Convert Uint8Array to base64 string for storage
 */
function toBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string back to Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Initialize the Post-Quantum cryptographic system
 * Generates ML-KEM-768 and ML-DSA-65 key pairs
 */
export async function initializePQ(): Promise<void> {
  const isInit = await SecureStore.getItemAsync(PQ_INITIALIZED);
  if (isInit === 'true') return;

  try {
    // Dynamic imports to support tree-shaking
    const { ml_kem768 } = await import('@noble/post-quantum/ml-kem');
    const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa');

    // Generate ML-KEM-768 keypair for key encapsulation
    const kemKeys = ml_kem768.keygen();

    // Generate ML-DSA-65 keypair for digital signatures
    const dsaKeys = ml_dsa65.keygen();

    // Store keys securely
    await SecureStore.setItemAsync(PQ_KEM_PUBLIC_KEY, toBase64(kemKeys.publicKey));
    await SecureStore.setItemAsync(PQ_KEM_PRIVATE_KEY, toBase64(kemKeys.secretKey));
    await SecureStore.setItemAsync(PQ_DSA_PUBLIC_KEY, toBase64(dsaKeys.publicKey));
    await SecureStore.setItemAsync(PQ_DSA_PRIVATE_KEY, toBase64(dsaKeys.secretKey));
    await SecureStore.setItemAsync(PQ_INITIALIZED, 'true');

    console.log('[PQ] Post-quantum cryptographic system initialized');
  } catch (error) {
    console.error('[PQ] Failed to initialize:', error);
    throw new Error('Failed to initialize post-quantum cryptography');
  }
}

/**
 * Check if PQ system is initialized
 */
export async function isPQInitialized(): Promise<boolean> {
  const isInit = await SecureStore.getItemAsync(PQ_INITIALIZED);
  return isInit === 'true';
}

/**
 * Encrypt data using ML-KEM-768 key encapsulation + AES-256-GCM
 * 
 * Flow:
 * 1. ML-KEM encapsulate → shared secret (32 bytes)
 * 2. Use shared secret as AES-256-GCM key
 * 3. Encrypt plaintext with AES-256-GCM
 * 4. Store KEM ciphertext + AES ciphertext + IV + tag
 */
export async function pqEncrypt(plaintext: string): Promise<PQEncryptedData> {
  const { ml_kem768 } = await import('@noble/post-quantum/ml-kem');
  const { gcm } = await import('@noble/ciphers/aes');

  // Load KEM public key
  const kemPublicKeyB64 = await SecureStore.getItemAsync(PQ_KEM_PUBLIC_KEY);
  if (!kemPublicKeyB64) throw new Error('PQ system not initialized');
  const kemPublicKey = fromBase64(kemPublicKeyB64);

  // Step 1: KEM encapsulate — produces ciphertext + shared secret
  const { cipherText, sharedSecret } = ml_kem768.encapsulate(kemPublicKey);

  // Step 2: Generate random IV (12 bytes for GCM)
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // Step 3: Encrypt with AES-256-GCM using the shared secret as key
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  
  const aes = gcm(sharedSecret, iv);
  const encrypted = aes.encrypt(plaintextBytes);

  // The encrypted output includes the tag at the end (last 16 bytes)
  const encryptedPayload = encrypted.slice(0, encrypted.length - 16);
  const tag = encrypted.slice(encrypted.length - 16);

  return {
    ciphertext: toBase64(cipherText),
    encryptedPayload: toBase64(encrypted), // includes tag
    iv: toBase64(iv),
    tag: toBase64(tag),
  };
}

/**
 * Decrypt data using ML-KEM-768 decapsulation + AES-256-GCM
 * 
 * Flow:
 * 1. ML-KEM decapsulate KEM ciphertext → shared secret
 * 2. Use shared secret as AES-256-GCM key
 * 3. Decrypt AES ciphertext
 */
export async function pqDecrypt(encryptedData: PQEncryptedData): Promise<string> {
  const { ml_kem768 } = await import('@noble/post-quantum/ml-kem');
  const { gcm } = await import('@noble/ciphers/aes');

  // Load KEM private key
  const kemPrivateKeyB64 = await SecureStore.getItemAsync(PQ_KEM_PRIVATE_KEY);
  if (!kemPrivateKeyB64) throw new Error('PQ system not initialized');
  const kemPrivateKey = fromBase64(kemPrivateKeyB64);

  // Step 1: KEM decapsulate — recover shared secret
  const kemCiphertext = fromBase64(encryptedData.ciphertext);
  const sharedSecret = ml_kem768.decapsulate(kemCiphertext, kemPrivateKey);

  // Step 2: Decrypt with AES-256-GCM
  const iv = fromBase64(encryptedData.iv);
  const encryptedPayload = fromBase64(encryptedData.encryptedPayload);

  const aes = gcm(sharedSecret, iv);
  const decrypted = aes.decrypt(encryptedPayload);

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Sign data with ML-DSA-65 (post-quantum digital signature)
 */
export async function pqSign(message: Uint8Array): Promise<Uint8Array> {
  const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa');

  const dsaPrivateKeyB64 = await SecureStore.getItemAsync(PQ_DSA_PRIVATE_KEY);
  if (!dsaPrivateKeyB64) throw new Error('PQ system not initialized');
  const dsaPrivateKey = fromBase64(dsaPrivateKeyB64);

  return ml_dsa65.sign(dsaPrivateKey, message);
}

/**
 * Verify ML-DSA-65 signature
 */
export async function pqVerify(
  message: Uint8Array,
  signature: Uint8Array,
): Promise<boolean> {
  const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa');

  const dsaPublicKeyB64 = await SecureStore.getItemAsync(PQ_DSA_PUBLIC_KEY);
  if (!dsaPublicKeyB64) throw new Error('PQ system not initialized');
  const dsaPublicKey = fromBase64(dsaPublicKeyB64);

  return ml_dsa65.verify(dsaPublicKey, message, signature);
}

/**
 * Get PQ security status info
 */
export async function getPQStatus(): Promise<{
  initialized: boolean;
  algorithms: string[];
  kemStrength: string;
  dsaStrength: string;
}> {
  const initialized = await isPQInitialized();
  return {
    initialized,
    algorithms: ['ML-KEM-768 (FIPS 203)', 'ML-DSA-65 (FIPS 204)', 'AES-256-GCM'],
    kemStrength: 'NIST Level 3 (192-bit quantum security)',
    dsaStrength: 'NIST Level 3 (192-bit quantum security)',
  };
}

/**
 * Wipe all PQ keys (for logout/reset)
 */
export async function wipePQKeys(): Promise<void> {
  await SecureStore.deleteItemAsync(PQ_KEM_PUBLIC_KEY);
  await SecureStore.deleteItemAsync(PQ_KEM_PRIVATE_KEY);
  await SecureStore.deleteItemAsync(PQ_DSA_PUBLIC_KEY);
  await SecureStore.deleteItemAsync(PQ_DSA_PRIVATE_KEY);
  await SecureStore.deleteItemAsync(PQ_ENCRYPTED_CIPHERTEXT);
  await SecureStore.deleteItemAsync(PQ_INITIALIZED);
}
