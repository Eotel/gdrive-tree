const TOKEN_STORAGE_KEY = "gdrive_access_token";
const TOKEN_EXPIRY_KEY = "gdrive_token_expiry";

/**
 * Save the access token to localStorage
 * @param {Object} tokenResponse - The token response from Google OAuth
 */
export function saveToken(tokenResponse) {
  if (!tokenResponse || !tokenResponse.access_token) {
    return;
  }

  try {
    // Save the token
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenResponse.access_token);

    // Calculate and save expiry time (expires_in is in seconds)
    if (tokenResponse.expires_in) {
      const expiryTime = Date.now() + tokenResponse.expires_in * 1000;
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
    
    console.info("Token saved successfully to localStorage");
  } catch (error) {
    console.error("Failed to save token to localStorage:", error);
    console.error("This may be due to localStorage restrictions in HTTPS environment");
    console.error("Storage quota exceeded or localStorage disabled");
  }
}

/**
 * Get the saved token from localStorage
 * @returns {string|null} The saved access token or null if not found/expired
 */
export function getSavedToken() {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!token) {
      return null;
    }

    // Check if token has expired
    if (expiryTime) {
      const expiry = Number.parseInt(expiryTime, 10);
      if (Date.now() >= expiry) {
        console.info("Token expired, clearing from localStorage");
        clearToken();
        return null;
      }
    }

    return token;
  } catch (error) {
    console.error("Failed to get token from localStorage:", error);
    console.error("localStorage may be blocked in HTTPS environment");
    return null;
  }
}

/**
 * Clear the saved token from localStorage
 */
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error("Failed to clear token from localStorage:", error);
  }
}

/**
 * Check if a saved token exists and is valid
 * @returns {boolean} True if a valid token exists
 */
export function hasValidToken() {
  return getSavedToken() !== null;
}

/**
 * Get the remaining time before token expires
 * @returns {number} Milliseconds until expiry, or 0 if expired/not found
 */
export function getTokenTimeRemaining() {
  try {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) {
      return 0;
    }

    const expiry = Number.parseInt(expiryTime, 10);
    const remaining = expiry - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error("Failed to get token expiry time:", error);
    return 0;
  }
}
