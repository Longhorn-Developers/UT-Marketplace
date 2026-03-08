'use client';

import { useState } from 'react';
import Link from 'next/link';
import { generateKeyPair, encryptMessage, decryptMessage } from '@/app/lib/encryption';

export default function TestEncryptionPage() {
  const [publicKey, setPublicKey] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [encrypted, setEncrypted] = useState<string>('');
  const [decrypted, setDecrypted] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerateKeys = async () => {
    setLoading(true);
    try {
      const keys = await generateKeyPair();
      setPublicKey(keys.publicKey);
      setPrivateKey(keys.privateKey);
      console.log('✅ Keys generated');
    } catch (error) {
      console.error('Failed to generate keys:', error);
      alert('Failed to generate keys');
    } finally {
      setLoading(false);
    }
  };

  const handleEncrypt = async () => {
    if (!message || !publicKey) {
      alert('Enter a message and generate keys first');
      return;
    }
    setLoading(true);
    try {
      const encrypted = await encryptMessage(message, publicKey);
      setEncrypted(encrypted);
      console.log('✅ Message encrypted');
    } catch (error) {
      console.error('Encryption failed:', error);
      alert('Encryption failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encrypted || !privateKey) {
      alert('Encrypt a message first');
      return;
    }
    setLoading(true);
    try {
      const decrypted = await decryptMessage(encrypted, privateKey);
      setDecrypted(decrypted);
      console.log('✅ Message decrypted');
    } catch (error) {
      console.error('Decryption failed:', error);
      alert('Decryption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/test-encryption/test-service"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            → Try the Advanced Test (2-User Message Scenario)
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-8">🔐 E2EE Encryption Tester</h1>

        {/* Step 1: Generate Keys */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Generate Keys</h2>
          <button
            onClick={handleGenerateKeys}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Generating...' : 'Generate Key Pair'}
          </button>
          {publicKey && (
            <div className="mt-4 space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key (first 100 chars):
                </label>
                <div className="bg-gray-100 p-3 rounded font-mono text-xs break-all">
                  {publicKey.substring(0, 100)}...
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Private Key (first 100 chars):
                </label>
                <div className="bg-gray-100 p-3 rounded font-mono text-xs break-all">
                  {privateKey.substring(0, 100)}...
                </div>
              </div>
              <p className="text-sm text-green-600">✅ Keys generated successfully!</p>
            </div>
          )}
        </div>

        {/* Step 2: Encrypt Message */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Encrypt a Message</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a secret message..."
            className="w-full border rounded p-3 mb-4 h-24"
            disabled={!publicKey}
          />
          <button
            onClick={handleEncrypt}
            disabled={loading || !publicKey || !message}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Encrypting...' : 'Encrypt Message'}
          </button>
          {encrypted && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Encrypted Message:
              </label>
              <div className="bg-gray-100 p-3 rounded font-mono text-xs break-all max-h-40 overflow-y-auto">
                {encrypted}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Length: {encrypted.length} characters
              </p>
              <p className="text-sm text-green-600">✅ Message encrypted successfully!</p>
            </div>
          )}
        </div>

        {/* Step 3: Decrypt Message */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Decrypt the Message</h2>
          <button
            onClick={handleDecrypt}
            disabled={loading || !encrypted}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading ? 'Decrypting...' : 'Decrypt Message'}
          </button>
          {decrypted && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decrypted Message:
              </label>
              <div className="bg-green-50 border border-green-300 p-3 rounded">
                {decrypted}
              </div>
              <p className="text-sm text-green-600 mt-2">
                ✅ Message decrypted successfully!
              </p>
              {decrypted === message && (
                <p className="text-sm text-green-600 font-bold">
                  🎯 Perfect! Decrypted message matches the original!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-6">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Click "Generate Key Pair" to create public and private keys</li>
            <li>Type a message and click "Encrypt Message" (uses public key)</li>
            <li>Click "Decrypt Message" to get the original back (uses private key)</li>
          </ol>
          <p className="text-sm text-gray-600 mt-4">
            💡 This is exactly what happens when users send messages - but their keys are stored securely in the database.
          </p>
        </div>
      </div>
    </div>
  );
}
