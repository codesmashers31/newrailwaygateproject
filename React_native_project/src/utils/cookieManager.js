import { Platform } from 'react-native';

// Dynamically import expo-secure-store to avoid loading crashes on unsupported platforms (like server rendering or web fallback)
let SecureStore = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('expo-secure-store could not be loaded on this platform:', e);
  }
}

export const cookieManager = {
  /**
   * Store token securely for a duration of 7 days
   * @param {string} name Cookie/Token key name
   * @param {string} value Authentication token value
   * @param {number} days Duration of cookie validity (default 7 days)
   */
  setCookie: async (name, value, days = 7) => {
    const expiryTime = Date.now() + days * 24 * 60 * 60 * 1000;
    
    if (Platform.OS === 'web') {
      const expires = new Date(expiryTime).toUTCString();
      // Set secure cookie on web with SameSite=Strict
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
    } else {
      if (SecureStore) {
        const data = JSON.stringify({ value, expires: expiryTime });
        await SecureStore.setItemAsync(name, data);
      } else {
        // Memory fallback if SecureStore is not initialized
        global[`__cookie_${name}`] = { value, expires: expiryTime };
      }
    }
  },

  /**
   * Retrieve stored cookie/token, validating expiration
   * @param {string} name Cookie/Token key name
   * @returns {Promise<string|null>} Stored token value, or null if expired or not found
   */
  getCookie: async (name) => {
    if (Platform.OS === 'web') {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    } else {
      try {
        if (SecureStore) {
          const dataStr = await SecureStore.getItemAsync(name);
          if (!dataStr) return null;
          
          const data = JSON.parse(dataStr);
          if (Date.now() > data.expires) {
            // Delete expired token
            await SecureStore.deleteItemAsync(name);
            return null;
          }
          return data.value;
        } else {
          const data = global[`__cookie_${name}`];
          if (data && Date.now() <= data.expires) {
            return data.value;
          }
          return null;
        }
      } catch (e) {
        console.error('Error retrieving secure cookie:', e);
        return null;
      }
    }
  },

  /**
   * Delete token on logout
   * @param {string} name Cookie/Token key name
   */
  clearCookie: async (name) => {
    if (Platform.OS === 'web') {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`;
    } else {
      if (SecureStore) {
        await SecureStore.deleteItemAsync(name);
      } else {
        delete global[`__cookie_${name}`];
      }
    }
  }
};
