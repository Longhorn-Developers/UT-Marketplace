'use client';

import { useState } from 'react';
import Link from 'next/link';
import { generateKeyPair, encryptMessage, decryptMessage } from '../../lib/encryption';

export default function TestServicePage() {
    const [user1Keys, setUser1Keys] = useState<{ publicKey: string; privateKey: string } | null>(null);
    const [user2Keys, setUser2Keys] = useState<{ publicKey: string; privateKey: string } | null>(null);
    const [message, setMessage] = useState<string>('');
    const [encryptedMessage, setEncryptedMessage] = useState<string>('');
    const [decryptedMessage, setDecryptedMessage] = useState<string>('');
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const setupUsers = async () => {
        addLog('🔄 Generating keys for User 1...');
        const keys1 = await generateKeyPair();
        setUser1Keys(keys1);
        addLog('✅ User 1 keys generated');

        addLog('🔄 Generating keys for User 2...');
        const keys2 = await generateKeyPair();
        setUser2Keys(keys2);
        addLog('✅ User 2 keys generated');
    };

    const simulateSendMessage = async () => {
        if (!user1Keys || !user2Keys || !message) {
            alert('Setup users and enter a message first');
            return;
        }

        addLog(`📤 User 1 sends: "${message}"`);
        addLog('🔄 Encrypting with User 2\'s public key...');

        // This simulates MessageService.sendMessage()
        const encrypted = await encryptMessage(message, user2Keys.publicKey);
        setEncryptedMessage(encrypted);

        addLog(`🔐 Encrypted (${encrypted.length} chars): ${encrypted.substring(0, 50)}...`);
        addLog('💾 Stored in "database" (encrypted)');
    };

    const simulateReceiveMessage = async () => {
        if (!user2Keys || !encryptedMessage) {
            alert('Send a message first');
            return;
        }

        addLog('📥 User 2 receives encrypted message from database');
        addLog('🔄 Decrypting with User 2\'s private key...');

        // This simulates MessageService.getMessages()
        const decrypted = await decryptMessage(encryptedMessage, user2Keys.privateKey);
        setDecryptedMessage(decrypted);

        addLog(`✅ User 2 reads: "${decrypted}"`);

        if (decrypted === message) {
            addLog('🎯 SUCCESS: Message matches original!');
        } else {
            addLog('❌ ERROR: Message does not match!');
        }
    };

    const testWrongKey = async () => {
        if (!user1Keys || !encryptedMessage) {
            alert('Send a message first');
            return;
        }

        addLog('🔓 Attempting to decrypt with User 1\'s key (should fail)...');

        try {
            // Try to decrypt with wrong key
            await decryptMessage(encryptedMessage, user1Keys.privateKey);
            addLog('❌ ERROR: Should not have decrypted!');
        } catch (error) {
            addLog('✅ CORRECT: Cannot decrypt with wrong key!');
            addLog('🔒 Message is secure - only User 2 can read it');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/test-encryption"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        ← Back to Basic Test
                    </Link>
                </div>
                <h1 className="text-3xl font-bold mb-8">🧪 Message Service E2EE Test</h1>

                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700">
                        <strong>Scenario:</strong> User 1 sends an encrypted message to User 2.
                        Only User 2 can decrypt it (not even User 1 can read it after sending).
                    </p>
                </div>

                {/* Setup */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">1. Setup Users</h2>
                    <button
                        onClick={setupUsers}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Generate Keys for Both Users
                    </button>
                    {user1Keys && user2Keys && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-3 rounded">
                                <p className="font-semibold text-green-800">👤 User 1</p>
                                <p className="text-xs text-gray-600">Has public & private key</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded">
                                <p className="font-semibold text-green-800">👤 User 2</p>
                                <p className="text-xs text-gray-600">Has public & private key</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Send Message */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">2. User 1 Sends Message</h2>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message from User 1..."
                        className="w-full border rounded p-3 mb-4"
                        disabled={!user1Keys}
                    />
                    <button
                        onClick={simulateSendMessage}
                        disabled={!user1Keys || !message}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        Send (Encrypt & Store)
                    </button>
                </div>

                {/* Receive Message */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">3. User 2 Receives Message</h2>
                    <button
                        onClick={simulateReceiveMessage}
                        disabled={!encryptedMessage}
                        className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 mr-4"
                    >
                        Receive & Decrypt (User 2)
                    </button>
                    <button
                        onClick={testWrongKey}
                        disabled={!encryptedMessage}
                        className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                        Try to Decrypt with User 1's Key (Should Fail)
                    </button>
                    {decryptedMessage && (
                        <div className="mt-4 bg-green-50 border border-green-300 p-4 rounded">
                            <p className="font-semibold text-green-800">Decrypted Message:</p>
                            <p className="text-lg">{decryptedMessage}</p>
                        </div>
                    )}
                </div>

                {/* Log */}
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
                    <h3 className="font-bold mb-2">📜 Activity Log:</h3>
                    {log.length === 0 ? (
                        <p className="text-gray-500">No activity yet...</p>
                    ) : (
                        <div className="space-y-1">
                            {log.map((entry, i) => (
                                <div key={i}>{entry}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}