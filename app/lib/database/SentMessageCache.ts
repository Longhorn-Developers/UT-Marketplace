/**
 * SentMessageCache - Caches plain text content of sent messages
 *
 * Since sent messages are encrypted with the receiver's public key,
 * the sender can't decrypt them later. This cache stores the plain text
 * so the sender can see what they sent even after page refresh.
 *
 * Stored in localStorage for persistence across sessions.
 */

const CACHE_KEY = 'sent_messages_cache';
const MAX_CACHE_SIZE = 1000; // Maximum number of messages to cache

interface CachedMessage {
  content: string;
  timestamp: number;
}

type MessageCache = Record<string, CachedMessage>;

/**
 * Get the message cache from localStorage
 */
function getCache(): MessageCache {
  if (typeof window === 'undefined') return {};

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.warn('Failed to load sent message cache:', error);
    return {};
  }
}

/**
 * Save the message cache to localStorage
 */
function saveCache(cache: MessageCache): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save sent message cache:', error);
  }
}

/**
 * Store a sent message's plain text content
 */
export function cacheSentMessage(messageId: string, content: string): void {
  const cache = getCache();

  // Add new message
  cache[messageId] = {
    content,
    timestamp: Date.now()
  };

  // Prune old messages if cache is too large
  const entries = Object.entries(cache);
  if (entries.length > MAX_CACHE_SIZE) {
    // Sort by timestamp and keep only the most recent MAX_CACHE_SIZE messages
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    const prunedCache: MessageCache = {};
    entries.slice(0, MAX_CACHE_SIZE).forEach(([id, msg]) => {
      prunedCache[id] = msg;
    });
    saveCache(prunedCache);
  } else {
    saveCache(cache);
  }
}

/**
 * Get a sent message's cached content
 */
export function getCachedMessage(messageId: string): string | null {
  const cache = getCache();
  return cache[messageId]?.content || null;
}

/**
 * Clear old cached messages (optional cleanup)
 */
export function clearOldCache(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): void {
  const cache = getCache();
  const now = Date.now();
  const filtered: MessageCache = {};

  Object.entries(cache).forEach(([id, msg]) => {
    if (now - msg.timestamp < maxAgeMs) {
      filtered[id] = msg;
    }
  });

  saveCache(filtered);
}
