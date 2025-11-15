/**
 * CryptoContext - Manages encryption keys in memory during user session
 *
 * This context stores the user's decrypted private key and public key in memory
 * (NOT in localStorage or database). The keys are:
 * - Loaded when user logs in
 * - Available to all components that need to encrypt/decrypt messages
 * - Cleared when user logs out or closes the browser
 *
 * Think of this as a secure vault that exists only while the user is logged in.
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isValidKey } from '../lib/encryption';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CryptoContextType {
  // Current user's encryption keys (null if not loaded)
  privateKey: string | null;
  publicKey: string | null;

  // Set both keys (called after successful login)
  setKeys: (privateKey: string, publicKey: string) => void;

  // Clear keys (called on logout)
  clearKeys: () => void;

  // Check if keys are loaded and valid
  hasKeys: () => boolean;

  // User ID associated with these keys (for validation)
  userId: string | null;
  setUserId: (id: string | null) => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  // State: Store keys in memory (React state = RAM, cleared on unmount)
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Set both encryption keys
   * Called after user logs in and their private key is decrypted
   */
  const setKeys = (newPrivateKey: string, newPublicKey: string) => {
    // Validate keys before storing
    if (!isValidKey(newPrivateKey) || !isValidKey(newPublicKey)) {
      console.error('Invalid encryption keys provided');
      return;
    }

    setPrivateKey(newPrivateKey);
    setPublicKey(newPublicKey);
    console.log('✅ Encryption keys loaded into memory');
  };

  /**
   * Clear all keys from memory
   * Called on logout or when keys are no longer needed
   */
  const clearKeys = () => {
    setPrivateKey(null);
    setPublicKey(null);
    setUserId(null);
    console.log('🔒 Encryption keys cleared from memory');
  };

  /**
   * Check if valid keys are loaded
   */
  const hasKeys = (): boolean => {
    return isValidKey(privateKey) && isValidKey(publicKey);
  };

  // Auto-clear keys when component unmounts (user closes tab/browser)
  useEffect(() => {
    return () => {
      // Cleanup function runs when component unmounts
      setPrivateKey(null);
      setPublicKey(null);
      setUserId(null);
    };
  }, []);

  // Context value provided to all children
  const value: CryptoContextType = {
    privateKey,
    publicKey,
    setKeys,
    clearKeys,
    hasKeys,
    userId,
    setUserId,
  };

  return (
    <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>
  );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook to access encryption keys from any component
 *
 * Usage:
 * const { privateKey, publicKey, hasKeys } = useCrypto();
 */
export function useCrypto(): CryptoContextType {
  const context = useContext(CryptoContext);

  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }

  return context;
}

/**
 * Hook that throws an error if keys are not loaded
 * Use this in components that absolutely require encryption keys
 *
 * Usage:
 * const { privateKey, publicKey } = useRequireCrypto();
 */
export function useRequireCrypto(): Required<
  Pick<CryptoContextType, 'privateKey' | 'publicKey'>
> {
  const crypto = useCrypto();

  if (!crypto.hasKeys()) {
    throw new Error('Encryption keys not loaded. User must be logged in.');
  }

  return {
    privateKey: crypto.privateKey!,
    publicKey: crypto.publicKey!,
  };
}