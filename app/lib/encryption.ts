/**
 * Encryption Utilities for End-to-End Encrypted Messaging
 *
 * This module provides client-side encryption/decryption using the Web Crypto API.
 * Messages are encrypted with the receiver's public key and can only be decrypted
 * with the receiver's private key (asymmetric encryption).
 */

// ============================================================================
// KEY GENERATION
// ============================================================================

/**
 * Generates a new public/private key pair for a user
 * Called once during user signup
 *
 * @returns Object containing base64-encoded public and private keys
 */
export async function generateKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
}> {
    // Generate RSA-OAEP key pair (industry standard for encryption)
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048, // 2048-bit key (secure and performant)
            publicExponent: new Uint8Array([1, 0, 1]), // Standard exponent (65537)
            hash: 'SHA-256',
        },
        true, // Keys are extractable (we need to store them)
        ['encrypt', 'decrypt']
    );

    // Export keys to raw format
    const publicKeyRaw = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    // Convert to base64 for storage
    return {
        publicKey: arrayBufferToBase64(publicKeyRaw),
        privateKey: arrayBufferToBase64(privateKeyRaw),
    };
}

// ============================================================================
// MESSAGE ENCRYPTION
// ============================================================================

/**
 * Encrypts a message using the receiver's public key
 * Only the receiver (with their private key) can decrypt it
 *
 * @param plaintext - The message to encrypt
 * @param receiverPublicKeyBase64 - Receiver's public key (base64)
 * @returns Encrypted message (base64)
 */
export async function encryptMessage(
    plaintext: string,
    receiverPublicKeyBase64: string
): Promise<string> {
    try {
        // Import receiver's public key
        const publicKeyBuffer = base64ToArrayBuffer(receiverPublicKeyBase64);
        const publicKey = await crypto.subtle.importKey(
            'spki',
            publicKeyBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false,
            ['encrypt']
        );

        // Convert message to bytes
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);

        // Encrypt with receiver's public key
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            data
        );

        // Return as base64 string
        return arrayBufferToBase64(encryptedData);
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt message');
    }
}

// ============================================================================
// MESSAGE DECRYPTION
// ============================================================================

/**
 * Decrypts a message using the user's private key
 *
 * @param encryptedBase64 - Encrypted message (base64)
 * @param privateKeyBase64 - User's private key (base64)
 * @returns Decrypted plaintext message
 */
export async function decryptMessage(
    encryptedBase64: string,
    privateKeyBase64: string
): Promise<string> {
    try {
        // Import private key
        const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
        const privateKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false,
            ['decrypt']
        );

        // Convert encrypted message from base64
        const encryptedData = base64ToArrayBuffer(encryptedBase64);

        // Decrypt with private key
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            encryptedData
        );

        // Convert bytes back to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Decryption failed:', error);
        // Return a placeholder instead of throwing to prevent UI crashes
        return '[Unable to decrypt message]';
    }
}

// ============================================================================
// PRIVATE KEY PROTECTION
// ============================================================================

/**
 * Encrypts a private key with a password-derived key
 * This allows us to store the private key in the database securely
 *
 * @param privateKey - The private key to encrypt (base64)
 * @param password - User's password
 * @returns Encrypted private key with salt and IV (JSON string)
 */
export async function encryptPrivateKey(
    privateKey: string,
    password: string
): Promise<string> {
    try {
        const encoder = new TextEncoder();

        // Generate random salt (prevents rainbow table attacks)
        const salt = crypto.getRandomValues(new Uint8Array(16));

        // Derive encryption key from password using PBKDF2
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000, // High iteration count for security
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // Generate random IV (initialization vector)
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encrypt the private key
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoder.encode(privateKey)
        );

        // Return all components as JSON (needed for decryption)
        return JSON.stringify({
            salt: Array.from(salt),
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encryptedData)),
        });
    } catch (error) {
        console.error('Private key encryption failed:', error);
        throw new Error('Failed to encrypt private key');
    }
}

/**
 * Decrypts a private key using the user's password
 * Called during login to load the private key into memory
 *
 * @param encryptedPrivateKey - Encrypted private key (JSON string)
 * @param password - User's password
 * @returns Decrypted private key (base64)
 */
export async function decryptPrivateKey(
    encryptedPrivateKey: string,
    password: string
): Promise<string> {
    try {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        // Parse the encrypted data
        const { salt, iv, data } = JSON.parse(encryptedPrivateKey);

        // Derive the same key from password and salt
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new Uint8Array(salt),
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt the private key
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            new Uint8Array(data)
        );

        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Private key decryption failed:', error);
        throw new Error('Invalid password or corrupted key');
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Converts base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Validates that a string is a valid base64-encoded key
 */
export function isValidKey(key: string | null | undefined): boolean {
    if (!key || typeof key !== 'string') return false;
    try {
        atob(key);
        return true;
    } catch {
        return false;
    }
}