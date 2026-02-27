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
import { isValidKey } from '@/app/lib/encryption';

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
  const [keysInitialized, setKeysInitialized] = useState(false);

  // On mount, try to restore keys from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedPrivateKey = sessionStorage.getItem('crypto_private_key');
      const storedPublicKey = sessionStorage.getItem('crypto_public_key');
      const storedUserId = sessionStorage.getItem('crypto_user_id');

      if (storedPrivateKey && storedPublicKey && isValidKey(storedPrivateKey) && isValidKey(storedPublicKey)) {
        setPrivateKey(storedPrivateKey);
        setPublicKey(storedPublicKey);
        setUserId(storedUserId);
        console.log('🔄 Encryption keys restored from sessionStorage');
      }
    } catch (error) {
      console.warn('Failed to restore keys from sessionStorage:', error);
    } finally {
      setKeysInitialized(true);
    }
  }, []);

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

    // Persist keys in sessionStorage (cleared when browser closes)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('crypto_private_key', newPrivateKey);
        sessionStorage.setItem('crypto_public_key', newPublicKey);
        if (userId) {
          sessionStorage.setItem('crypto_user_id', userId);
        }
        console.log('✅ Encryption keys loaded into memory and persisted');
      } catch (error) {
        console.warn('Failed to persist keys to sessionStorage:', error);
        console.log('✅ Encryption keys loaded into memory');
      }
    } else {
      console.log('✅ Encryption keys loaded into memory');
    }
  };

  /**
   * Clear all keys from memory
   * Called on logout or when keys are no longer needed
   */
  const clearKeys = () => {
    setPrivateKey(null);
    setPublicKey(null);
    setUserId(null);

    // Clear from sessionStorage as well
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('crypto_private_key');
        sessionStorage.removeItem('crypto_public_key');
        sessionStorage.removeItem('crypto_user_id');
      } catch (error) {
        console.warn('Failed to clear keys from sessionStorage:', error);
      }
    }

    console.log('🔒 Encryption keys cleared from memory and sessionStorage');
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

      // sessionStorage is automatically cleared when browser closes,
      // but we clear it here too for extra security when component unmounts
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('crypto_private_key');
          sessionStorage.removeItem('crypto_public_key');
          sessionStorage.removeItem('crypto_user_id');
        } catch (error) {
          // Ignore errors during unmount
        }
      }
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
