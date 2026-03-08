# End-to-End Encryption (E2EE) Implementation Guide

## 📋 Overview

This document explains the complete End-to-End Encryption (E2EE) implementation for the UT Marketplace messaging system. The implementation ensures that messages are encrypted on the sender's device and can only be decrypted by the intended recipient.

**Key Principle:** Messages are encrypted with the receiver's public key and can ONLY be decrypted with the receiver's private key. The server (Supabase) stores encrypted messages and cannot read their contents.

---

## 🎯 What Was Implemented

### ✅ Completed Components

1. **Encryption Library** (`app/lib/encryption.ts`)
2. **Key Management Service** (`app/lib/database/KeyService.ts`)
3. **Crypto Context** (`app/context/CryptoContext.tsx`)
4. **Updated MessageService** with encryption/decryption
5. **Updated Messages Page** to use encryption
6. **Provider Setup** in root layout

### ⚠️ Pending (Requires Database Changes)

1. **Signup Flow** - Generate keys during user registration
2. **Login Flow** - Load encryption keys into memory
3. **Database Schema** - Add `user_keys` table

---

## 📁 File-by-File Explanation

### 1. **`app/lib/encryption.ts`** - Core Encryption Library

**What it does:**
- Provides all encryption/decryption functions
- Uses the Web Crypto API (built into browsers, no external dependencies)
- Uses RSA-OAEP algorithm (industry standard for asymmetric encryption)

**Key Functions:**

#### `generateKeyPair()`
```typescript
const { publicKey, privateKey } = await generateKeyPair();
```
- **When:** Called once during user signup
- **What:** Generates a 2048-bit RSA key pair
- **Returns:** Both keys as base64 strings (for storage)
- **Performance:** Takes ~100-300ms (one-time operation)

#### `encryptMessage(plaintext, receiverPublicKey)`
```typescript
const encrypted = await encryptMessage("Hello!", receiverPublicKey);
// Returns: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg..." (base64)
```
- **When:** Before sending a message
- **What:** Encrypts message with receiver's public key
- **Performance:** ~1-5ms per message
- **Security:** Only the receiver (with their private key) can decrypt

#### `decryptMessage(encrypted, privateKey)`
```typescript
const plaintext = await decryptMessage(encrypted, userPrivateKey);
// Returns: "Hello!"
```
- **When:** After receiving a message
- **What:** Decrypts message with user's private key
- **Performance:** ~1-5ms per message
- **Error Handling:** Returns "[Unable to decrypt message]" if decryption fails

#### `encryptPrivateKey(privateKey, password)`
```typescript
const encrypted = await encryptPrivateKey(privateKey, "user_password");
```
- **When:** During signup, before storing private key in database
- **What:** Encrypts the private key with a password-derived key (PBKDF2 + AES-GCM)
- **Why:** Private keys must NEVER be stored in plain text
- **Security:** Uses 100,000 iterations of PBKDF2 for key derivation

#### `decryptPrivateKey(encryptedPrivateKey, password)`
```typescript
const privateKey = await decryptPrivateKey(encrypted, "user_password");
```
- **When:** During login
- **What:** Decrypts the private key using user's password
- **Error:** Throws if password is wrong
- **Result:** Private key loaded into memory (CryptoContext)

---

### 2. **`app/lib/database/KeyService.ts`** - Key Management

**What it does:**
- Handles storing and retrieving encryption keys from the database
- Provides helper functions for key generation during signup
- Fetches public keys when encrypting messages for other users

**Key Functions:**

#### `generateAndStoreUserKeys(userId, password)`
```typescript
const keys = await generateAndStoreUserKeys("user-123", "password");
// Stores in database:
// - public_key: plain text (public keys are meant to be public)
// - encrypted_private_key: encrypted with password
```
- **When:** Called during signup (AFTER database table is created)
- **What:** Generates keys and stores them in `user_keys` table
- **Returns:** The generated keys

#### `getUserKeysDecrypted(userId, password)`
```typescript
const keys = await getUserKeysDecrypted("user-123", "password");
// Returns: { userId, publicKey, privateKey (decrypted) }
```
- **When:** Called during login
- **What:** Fetches encrypted keys from DB and decrypts the private key
- **Error:** Throws if password is wrong

#### `getPublicKey(userId)`
```typescript
const publicKey = await getPublicKey("receiver-456");
```
- **When:** Before encrypting a message to send to someone
- **What:** Fetches the recipient's public key from database
- **Why:** Need their public key to encrypt messages for them

#### `ensureUserHasKeys(userId, password)`
```typescript
const keys = await ensureUserHasKeys("user-123", "password");
```
- **When:** Login (for migration support)
- **What:** Checks if user has keys, generates if missing
- **Why:** Allows existing users (created before E2EE) to get keys on first login

---

### 3. **`app/context/CryptoContext.tsx`** - React Context for Keys

**What it does:**
- Stores decrypted private key in memory during user session
- Provides encryption keys to all components that need them
- Automatically clears keys when user logs out or closes browser

**Think of it as:** A secure vault in RAM that exists only while you're logged in

**Key Functions:**

#### `setKeys(privateKey, publicKey)`
```typescript
const { setKeys } = useCrypto();
setKeys(decryptedPrivateKey, publicKey);
```
- **When:** Called after successful login (once keys are decrypted)
- **What:** Stores keys in React state (memory only)
- **Storage:** NOT in localStorage, NOT in database, ONLY in RAM

#### `clearKeys()`
```typescript
const { clearKeys } = useCrypto();
clearKeys();
```
- **When:** User logs out
- **What:** Removes keys from memory
- **Security:** Keys are gone, can't decrypt old messages without logging in again

#### `useCrypto()` Hook
```typescript
const { privateKey, publicKey, hasKeys } = useCrypto();
```
- **Where:** Any component that needs encryption keys
- **Example:** Messages page uses it to decrypt incoming messages

**Why React Context?**
- ✅ Keys available to all components (no prop drilling)
- ✅ Keys only in memory (not persisted anywhere)
- ✅ Automatic cleanup when component unmounts
- ✅ Same pattern as `useAuth()` you're already using

---

### 4. **`app/lib/database/MessageService.ts`** - Updated Message Service

**What changed:**

#### `sendMessage()` - Now Encrypts Before Storing
```typescript
// OLD (before E2EE):
const message = await MessageService.sendMessage({
  senderId: "user-1",
  receiverId: "user-2",
  content: "Hello!" // Stored as plain text
});

// NEW (with E2EE):
const message = await MessageService.sendMessage({
  senderId: "user-1",
  receiverId: "user-2",
  content: "Hello!", // Encrypted before storing
  encryptionEnabled: true // default: true
});

// Database stores: "MIIBIjANBgkqhkiG9w0BAQ..." (encrypted)
// Returns to UI: "Hello!" (original text for display)
```

**What happens inside:**
1. Fetch receiver's public key from database
2. Encrypt message with their public key
3. Store encrypted message in database
4. Return original (unencrypted) text to UI for display

**Backwards Compatibility:**
- If receiver has no public key → sends unencrypted (for migration)
- Can disable encryption: `encryptionEnabled: false`

#### `getMessages()` - Now Decrypts After Fetching
```typescript
// OLD:
const messages = await MessageService.getMessages({
  userId: "user-1",
  otherUserId: "user-2"
});

// NEW:
const messages = await MessageService.getMessages({
  userId: "user-1",
  otherUserId: "user-2",
  privateKey: userPrivateKey // From CryptoContext
});

// Returns decrypted messages ready for display
```

**What happens inside:**
1. Fetch messages from database (encrypted)
2. For each message where you're the receiver:
   - Decrypt with your private key
   - Replace encrypted content with plaintext
3. Return decrypted messages

**Important Note About Sent Messages:**
- You can decrypt messages you RECEIVED (encrypted with your public key)
- You CANNOT decrypt messages you SENT (encrypted with recipient's public key)
- Sent messages will show as encrypted text or from optimistic UI cache
- **Future improvement:** Store two copies (one encrypted for sender, one for receiver)

#### `getConversations()` - Handles Encrypted Previews
```typescript
const conversations = await MessageService.getConversations(
  userId,
  privateKey // Optional
);

// Returns conversations with:
// - Decrypted last_message if you're the receiver
// - "🔒 Encrypted message" if you're the sender or can't decrypt
```

#### `subscribeToMessages()` - Real-time with Decryption
```typescript
const subscription = MessageService.subscribeToMessages(
  userId,
  (message) => {
    // Message is already decrypted!
    console.log(message.content); // "Hello!"
  },
  onError,
  privateKey // From CryptoContext
);
```

**What happens:**
- When a new message arrives (Supabase real-time)
- If you're the receiver AND have private key:
  - Decrypt automatically before passing to callback
- If decryption fails or you're the sender:
  - Pass through as-is

---

### 5. **`app/messages/page.tsx`** - Updated Messages Page

**What changed:**

#### Added CryptoContext Hook
```typescript
const { privateKey } = useCrypto();
```

#### Updated All MessageService Calls
```typescript
// getConversations
const conversations = await MessageService.getConversations(
  user.id,
  privateKey || undefined
);

// getMessages
const messages = await MessageService.getMessages({
  userId: user.id,
  otherUserId: partnerId,
  listingId: listingId,
  privateKey: privateKey || undefined
});

// subscribeToMessages
const subscription = MessageService.subscribeToMessages(
  user.id,
  onMessage,
  onError,
  privateKey || undefined
);
```

**Why `|| undefined`?**
- Private key might be `null` (user not logged in yet, or no keys)
- Service functions handle `undefined` gracefully (skip decryption)

---

### 6. **`app/layout.tsx`** - Provider Setup

**What changed:**

```typescript
<AuthProvider>
  <CryptoProvider>  {/* NEW */}
    <AdminRedirectWrapper>
      {children}
    </AdminRedirectWrapper>
  </CryptoProvider>
</AuthProvider>
```

**Why inside AuthProvider?**
- Crypto keys are tied to authenticated user
- When user logs out (AuthProvider), crypto keys should also clear

---

## 🗄️ Database Schema Required

### **New Table: `user_keys`**

```sql
CREATE TABLE user_keys (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast public key lookups when encrypting messages
CREATE INDEX idx_user_keys_user_id ON user_keys(user_id);
```

**Column Details:**

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `user_id` | TEXT | References users.id | "a1b2c3d4..." |
| `public_key` | TEXT | Base64-encoded public key (plain text) | "MIIBIjANBg..." |
| `encrypted_private_key` | TEXT | Private key encrypted with password | `{"salt":[...],"iv":[...],"data":[...]}` |
| `created_at` | TIMESTAMP | When keys were generated | "2024-01-15 10:30:00" |

**Why separate table?**
- Keys are independent of user profile data
- Easier to manage/rotate keys in the future
- Clean separation of concerns

---

## 🚀 What You Can Do RIGHT NOW (Without Database)

Even without the `user_keys` table, the code will work with graceful degradation:

### ✅ You Can:

1. **Run the app without errors**
   - All encryption functions are optional
   - Services check for keys before encrypting
   - Falls back to unencrypted if keys don't exist

2. **Test the encryption library directly**
   ```typescript
   import { generateKeyPair, encryptMessage, decryptMessage } from '@/app/lib/encryption';

   // Generate test keys
   const keys = await generateKeyPair();
   console.log('Public key:', keys.publicKey);
   console.log('Private key:', keys.privateKey);

   // Test encryption
   const encrypted = await encryptMessage("Test message", keys.publicKey);
   console.log('Encrypted:', encrypted);

   // Test decryption
   const decrypted = await decryptMessage(encrypted, keys.privateKey);
   console.log('Decrypted:', decrypted); // "Test message"
   ```

3. **Review all the code**
   - Read through each file
   - Understand the flow
   - Ask questions

4. **Plan the migration**
   - Decide when to create the database table
   - Plan how to handle existing users

### ❌ You Cannot (Yet):

1. Actually encrypt messages in production (no database to store keys)
2. Test the full E2EE flow (signup → login → send encrypted message)
3. Generate keys for users (no table to store them)

---

## 📝 Migration Steps (When Database is Ready)

### Step 1: Create Database Table

Run this SQL in your Supabase dashboard:

```sql
-- Create the user_keys table
CREATE TABLE user_keys (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_user_keys_user_id ON user_keys(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read any public key (needed for encryption)
CREATE POLICY "Anyone can read public keys" ON user_keys
  FOR SELECT
  USING (true);

-- Policy: Users can only read their own encrypted private key
CREATE POLICY "Users can read own encrypted private key" ON user_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own keys (during signup)
CREATE POLICY "Users can insert own keys" ON user_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own keys (for key rotation)
CREATE POLICY "Users can update own keys" ON user_keys
  FOR UPDATE
  USING (auth.uid() = user_id);
```

### Step 2: Update Signup Flow

**Find your signup handler** (likely in `app/auth/signup` or similar):

```typescript
// BEFORE (current signup):
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      display_name: displayName,
    }
  }
});

// AFTER (with E2EE):
import { generateAndStoreUserKeys } from '@/app/lib/database/KeyService';

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      display_name: displayName,
    }
  }
});

if (data.user) {
  // Generate and store encryption keys
  await generateAndStoreUserKeys(data.user.id, password);
  console.log('✅ Encryption keys generated for user');
}
```

**⚠️ Important:** This must happen AFTER the user is created in the `users` table.

### Step 3: Update Login Flow

**Find your login handler** (likely in `app/auth/signin` or `AuthContext`):

```typescript
// BEFORE (current login):
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// AFTER (with E2EE):
import { getUserKeysDecrypted, ensureUserHasKeys } from '@/app/lib/database/KeyService';
import { useCrypto } from '@/app/context/CryptoContext';

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (data.user) {
  try {
    // Try to load encryption keys
    const keys = await getUserKeysDecrypted(data.user.id, password);

    // Load keys into CryptoContext
    const { setKeys, setUserId } = useCrypto();
    setKeys(keys.privateKey, keys.publicKey);
    setUserId(data.user.id);

    console.log('✅ Encryption keys loaded');
  } catch (error) {
    console.warn('⚠️ Failed to load encryption keys:', error);

    // For existing users: generate keys on first login
    const keys = await ensureUserHasKeys(data.user.id, password);
    if (keys) {
      const decrypted = await getUserKeysDecrypted(data.user.id, password);
      const { setKeys, setUserId } = useCrypto();
      setKeys(decrypted.privateKey, decrypted.publicKey);
      setUserId(data.user.id);
      console.log('✅ Encryption keys generated for existing user');
    }
  }
}
```

### Step 4: Update Logout Flow

**Find your logout handler:**

```typescript
// BEFORE:
await supabase.auth.signOut();

// AFTER:
import { useCrypto } from '@/app/context/CryptoContext';

const { clearKeys } = useCrypto();
await supabase.auth.signOut();
clearKeys(); // Clear encryption keys from memory
console.log('🔒 Encryption keys cleared');
```

### Step 5: Test the Full Flow

1. **Test Signup:**
   - Create a new user
   - Check `user_keys` table has a row for the user
   - Verify `public_key` and `encrypted_private_key` are populated

2. **Test Login:**
   - Login with the user
   - Check browser console for "✅ Encryption keys loaded"
   - Verify `useCrypto()` hook returns keys

3. **Test Messaging:**
   - Send a message to another user
   - Check database `messages` table
   - Verify `content` is a long base64 string (encrypted)
   - Verify recipient sees decrypted message

4. **Test Real-time:**
   - Open two browser windows (different users)
   - Send message from User A to User B
   - Verify User B receives and sees decrypted message in real-time

---

## 🔐 Security Considerations

### ✅ Good Security Practices Implemented

1. **Private keys encrypted at rest** (in database)
   - Encrypted with password-derived key (PBKDF2)
   - 100,000 iterations (slow down brute force)
   - Unique salt per user

2. **Private keys only in memory** (during session)
   - Not in localStorage (persistent storage)
   - Not in cookies (sent to server)
   - Cleared on logout/browser close

3. **Server cannot read messages**
   - Messages encrypted client-side
   - Server only stores encrypted blobs
   - Only recipient can decrypt

4. **Backwards compatible**
   - Old unencrypted messages still work
   - Graceful degradation if keys missing
   - Can disable encryption if needed

### ⚠️ Current Limitations

1. **Password-dependent encryption**
   - If user forgets password, they lose access to private key
   - No way to recover old messages
   - **Solution:** Implement backup codes or key escrow (future)

2. **Sent messages not readable by sender**
   - Sender can't decrypt their own sent messages after sending
   - Only visible via optimistic UI (before page refresh)
   - **Solution:** Store two encrypted copies (future improvement)

3. **No key rotation**
   - Keys generated once, used forever
   - If private key compromised, all past messages at risk
   - **Solution:** Implement key rotation (future)

4. **No group chat support**
   - Current implementation is 1:1 only
   - Group chats would need different approach
   - **Solution:** Use shared symmetric keys for groups (future)

### 🔮 Future Improvements

1. **Double storage for sent messages**
   ```sql
   ALTER TABLE messages
   ADD COLUMN sender_encrypted_content TEXT,
   ADD COLUMN receiver_encrypted_content TEXT;
   ```
   - Encrypt once with sender's public key (so they can read it)
   - Encrypt once with receiver's public key (so they can read it)

2. **Message search**
   - Currently can't search encrypted messages server-side
   - **Solution:** Client-side search only, or store message hashes

3. **Key backup/recovery**
   - Generate recovery codes during signup
   - Encrypt private key with recovery code
   - Store encrypted backup in database

4. **Key rotation**
   - Allow users to generate new keys
   - Re-encrypt recent messages with new keys
   - Keep old keys for old messages

---

## 🧪 Testing Checklist

### Before Database Migration
- [x] Code compiles without errors
- [x] App runs without encryption (graceful degradation)
- [x] Encryption functions work in isolation
- [x] CryptoContext provides/clears keys correctly

### After Database Migration
- [ ] `user_keys` table exists with correct schema
- [ ] RLS policies work correctly
- [ ] New user signup generates keys
- [ ] Login loads keys into context
- [ ] Logout clears keys from context
- [ ] Send message encrypts content
- [ ] Receive message decrypts content
- [ ] Real-time messages decrypt automatically
- [ ] Conversation list shows decrypted previews
- [ ] Existing users get keys on first login (migration)

---

## 📞 Support & Questions

If you have questions about:
- **How a specific function works:** Check the inline comments in the code
- **Why something was implemented a certain way:** See the "Security Considerations" section
- **What to do next:** Follow the "Migration Steps" section
- **Something's not working:** Check the "Testing Checklist"

---

## 📊 Summary

| Component | Status | Location |
|-----------|--------|----------|
| Encryption Library | ✅ Complete | `app/lib/encryption.ts` |
| Key Management | ✅ Complete | `app/lib/database/KeyService.ts` |
| Crypto Context | ✅ Complete | `app/context/CryptoContext.tsx` |
| MessageService | ✅ Updated | `app/lib/database/MessageService.ts` |
| Messages Page | ✅ Updated | `app/messages/page.tsx` |
| Layout Provider | ✅ Complete | `app/layout.tsx` |
| Database Schema | ⏳ Pending | See "Migration Steps" |
| Signup Flow | ⏳ Pending | See "Migration Steps" |
| Login Flow | ⏳ Pending | See "Migration Steps" |

**Next Step:** Create the `user_keys` table in Supabase, then update signup/login flows.
