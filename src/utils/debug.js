const isDevelopment = import.meta.env.DEV;
const isDebugEnabled = import.meta.env.VITE_DEBUG_MODE === 'true' || isDevelopment;

export const debug = {
  log: (...args) => {
    if (isDebugEnabled) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args) => {
    if (isDebugEnabled) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  
  api: (message, data) => {
    if (isDebugEnabled) {
      console.log('[API]', message, data);
    }
  },
  
  auth: (message, data) => {
    if (isDebugEnabled) {
      console.log('[AUTH]', message, data);
    }
  }
};

export const logApiRequest = (url, params) => {
  debug.api(`Request to ${url}`, params);
};

export const logApiResponse = (url, response) => {
  debug.api(`Response from ${url}`, response);
};

export const logApiError = (url, error) => {
  debug.error(`API Error from ${url}`, error);
};