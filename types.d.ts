/**
 * Type declarations for @noble/post-quantum subpath imports
 * and @noble/ciphers subpath imports
 */

declare module '@noble/post-quantum/ml-kem' {
  export const ml_kem512: {
    keygen(): { publicKey: Uint8Array; secretKey: Uint8Array };
    encapsulate(publicKey: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array };
    decapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array;
  };
  export const ml_kem768: {
    keygen(): { publicKey: Uint8Array; secretKey: Uint8Array };
    encapsulate(publicKey: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array };
    decapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array;
  };
  export const ml_kem1024: {
    keygen(): { publicKey: Uint8Array; secretKey: Uint8Array };
    encapsulate(publicKey: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array };
    decapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array;
  };
}

declare module '@noble/post-quantum/ml-dsa' {
  export const ml_dsa44: {
    keygen(): { publicKey: Uint8Array; secretKey: Uint8Array };
    sign(secretKey: Uint8Array, message: Uint8Array): Uint8Array;
    verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean;
  };
  export const ml_dsa65: {
    keygen(): { publicKey: Uint8Array; secretKey: Uint8Array };
    sign(secretKey: Uint8Array, message: Uint8Array): Uint8Array;
    verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean;
  };
  export const ml_dsa87: {
    keygen(): { publicKey: Uint8Array; secretKey: Uint8Array };
    sign(secretKey: Uint8Array, message: Uint8Array): Uint8Array;
    verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean;
  };
}

declare module '@noble/ciphers/aes' {
  export function gcm(key: Uint8Array, nonce: Uint8Array): {
    encrypt(plaintext: Uint8Array): Uint8Array;
    decrypt(ciphertext: Uint8Array): Uint8Array;
  };
}
