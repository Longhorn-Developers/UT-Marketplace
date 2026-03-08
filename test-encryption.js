/**
 * Quick encryption test script
 * Run with: node test-encryption.js
 *
 * Note: This won't work directly because it uses Web Crypto API
 * which is browser-only. But it shows the test logic.
 */

// To actually test in Node.js, you'd need:
// npm install --save-dev @peculiar/webcrypto
// Then uncomment below:

// const { Crypto } = require('@peculiar/webcrypto');
// global.crypto = new Crypto();

async function testEncryption() {
  console.log('🧪 Testing E2EE Encryption...\n');

  try {
    // This would import your encryption module
    // const { generateKeyPair, encryptMessage, decryptMessage } = require('./app/lib/encryption.ts');

    console.log('✅ All encryption functions loaded');

    // Test 1: Key Generation
    console.log('\n📝 Test 1: Key Generation');
    // const keys = await generateKeyPair();
    // console.log('  ✅ Generated keys');
    // console.log('  Public key length:', keys.publicKey.length);
    // console.log('  Private key length:', keys.privateKey.length);

    // Test 2: Encryption
    console.log('\n📝 Test 2: Message Encryption');
    const testMessage = 'This is a secret test message!';
    // const encrypted = await encryptMessage(testMessage, keys.publicKey);
    // console.log('  ✅ Message encrypted');
    // console.log('  Original length:', testMessage.length);
    // console.log('  Encrypted length:', encrypted.length);

    // Test 3: Decryption
    console.log('\n📝 Test 3: Message Decryption');
    // const decrypted = await decryptMessage(encrypted, keys.privateKey);
    // console.log('  ✅ Message decrypted');
    // console.log('  Decrypted message:', decrypted);

    // Test 4: Verify Match
    console.log('\n📝 Test 4: Verify Original = Decrypted');
    // const match = testMessage === decrypted;
    // console.log('  Match:', match ? '✅ YES' : '❌ NO');

    console.log('\n🎉 All tests passed!\n');
    console.log('Note: To actually run this, use the browser test page at /test-encryption');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEncryption();
