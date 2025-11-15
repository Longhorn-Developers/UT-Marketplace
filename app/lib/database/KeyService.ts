/**
 * KeyService - Manages encryption keys in the database
 *
 * This service handles:
 * - Storing new user encryption keys (during signup)
 * - Fetching user encryption keys (during login)
 * - Retrieving public keys for other users (for encrypting messages to them)
 *
 * Database Schema Required:
 * Table: user_keys
 * - user_id (TEXT, PRIMARY KEY, references users.id)
 * - public_key (TEXT, NOT NULL) - Stored in plain text (public keys are meant to be public)
 * - encrypted_private_key (TEXT, NOT NULL) - Encrypted with user's password
 * - created_at (TIMESTAMP, DEFAULT NOW())
 */

import { supabase } from '../supabaseClient';
import {
    generateKeyPair,
    encryptPrivateKey,
    decryptPrivateKey,
} from '../encryption';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserKeys {
    userId: string;
    publicKey: string;
    encryptedPrivateKey: string;
}

export interface DecryptedUserKeys {
    userId: string;
    publicKey: string;
    privateKey: string; // Decrypted
}

// ============================================================================
// KEY GENERATION (During Signup)
// ============================================================================

/**
 * Generates and stores encryption keys for a new user
 * Called during signup process
 *
 * @param userId - The new user's ID
 * @param password - User's password (used to encrypt private key)
 * @returns The generated keys (private key is encrypted)
 */
export async function generateAndStoreUserKeys(
    userId: string,
    password: string
): Promise<UserKeys | null> {
    try {
        console.log(`Generating encryption keys for user ${userId}...`);

        // Step 1: Generate public/private key pair
        const { publicKey, privateKey } = await generateKeyPair();

        // Step 2: Encrypt private key with user's password
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);

        // Step 3: Store in database
        const { data, error } = await supabase.from('user_keys').insert({
            user_id: userId,
            public_key: publicKey,
            encrypted_private_key: encryptedPrivateKey,
        }).select().single();

        if (error) {
            console.error('Failed to store user keys:', error);
            return null;
        }

        console.log(`✅ Encryption keys generated and stored for user ${userId}`);

        return {
            userId,
            publicKey,
            encryptedPrivateKey,
        };
    } catch (error) {
        console.error('Error generating user keys:', error);
        return null;
    }
}

// ============================================================================
// KEY RETRIEVAL (During Login)
// ============================================================================

/**
 * Fetches user's encrypted keys from database
 * Called during login
 *
 * @param userId - User's ID
 * @returns User's public key and encrypted private key
 */
export async function getUserKeys(userId: string): Promise<UserKeys | null> {
    try {
        const { data, error } = await supabase
            .from('user_keys')
            .select('user_id, public_key, encrypted_private_key')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.error('Failed to fetch user keys:', error);
            return null;
        }

        return {
            userId: data.user_id,
            publicKey: data.public_key,
            encryptedPrivateKey: data.encrypted_private_key,
        };
    } catch (error) {
        console.error('Error fetching user keys:', error);
        return null;
    }
}

/**
 * Fetches user's keys and decrypts the private key
 * Called during login after password is verified
 *
 * @param userId - User's ID
 * @param password - User's password (to decrypt private key)
 * @returns Decrypted keys ready to load into CryptoContext
 */
export async function getUserKeysDecrypted(
    userId: string,
    password: string
): Promise<DecryptedUserKeys | null> {
    try {
        // Step 1: Fetch encrypted keys from database
        const keys = await getUserKeys(userId);
        if (!keys) return null;

        // Step 2: Decrypt private key with password
        const privateKey = await decryptPrivateKey(
            keys.encryptedPrivateKey,
            password
        );

        console.log(`✅ Private key decrypted for user ${userId}`);

        return {
            userId: keys.userId,
            publicKey: keys.publicKey,
            privateKey, // Now decrypted
        };
    } catch (error) {
        console.error('Error decrypting user keys:', error);
        // This likely means wrong password
        throw new Error('Failed to decrypt keys - invalid password?');
    }
}

// ============================================================================
// PUBLIC KEY LOOKUP (For Encrypting Messages)
// ============================================================================

/**
 * Gets another user's public key
 * Used when encrypting a message to send to them
 *
 * @param userId - The recipient's user ID
 * @returns Their public key (or null if not found)
 */
export async function getPublicKey(userId: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('user_keys')
            .select('public_key')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.error(`Failed to fetch public key for user ${userId}:`, error);
            return null;
        }

        return data.public_key;
    } catch (error) {
        console.error('Error fetching public key:', error);
        return null;
    }
}

/**
 * Gets public keys for multiple users at once
 * Useful for batch operations
 *
 * @param userIds - Array of user IDs
 * @returns Map of userId -> publicKey
 */
export async function getPublicKeys(
    userIds: string[]
): Promise<Map<string, string>> {
    try {
        const { data, error } = await supabase
            .from('user_keys')
            .select('user_id, public_key')
            .in('user_id', userIds);

        if (error || !data) {
            console.error('Failed to fetch public keys:', error);
            return new Map();
        }

        // Convert to Map for easy lookup
        const keyMap = new Map<string, string>();
        data.forEach((row) => {
            keyMap.set(row.user_id, row.public_key);
        });

        return keyMap;
    } catch (error) {
        console.error('Error fetching public keys:', error);
        return new Map();
    }
}

// ============================================================================
// KEY EXISTENCE CHECK
// ============================================================================

/**
 * Checks if a user has encryption keys set up
 * Useful for migration or debugging
 *
 * @param userId - User's ID
 * @returns true if keys exist, false otherwise
 */
export async function hasEncryptionKeys(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('user_keys')
            .select('user_id')
            .eq('user_id', userId)
            .single();

        return !error && !!data;
    } catch (error) {
        return false;
    }
}

// ============================================================================
// FALLBACK FOR USERS WITHOUT KEYS (Migration Support)
// ============================================================================

/**
 * For backwards compatibility: Check if user has encryption keys
 * If not, generate them using a fallback method
 *
 * NOTE: This is a temporary solution for migrating existing users.
 * New users should have keys generated during signup.
 *
 * @param userId - User's ID
 * @param password - User's password
 * @returns User's keys (generates if missing)
 */
export async function ensureUserHasKeys(
    userId: string,
    password: string
): Promise<UserKeys | null> {
    // Check if user already has keys
    const existingKeys = await getUserKeys(userId);
    if (existingKeys) {
        return existingKeys;
    }

    // No keys found - generate new ones
    console.warn(
        `User ${userId} has no encryption keys. Generating now (migration path)...`
    );
    return await generateAndStoreUserKeys(userId, password);
}