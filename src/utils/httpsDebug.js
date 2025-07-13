// HTTPS環境でのデバッグ用ユーティリティ

export function checkHTTPSEnvironment() {
  const isHTTPS = window.location.protocol === 'https:';
  const info = {
    protocol: window.location.protocol,
    host: window.location.host,
    href: window.location.href,
    isHTTPS: isHTTPS,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    userAgent: navigator.userAgent,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };

  // localStorageのテスト
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    info.localStorageAvailable = true;
  } catch (e) {
    info.localStorageAvailable = false;
    info.localStorageError = e.message;
  }

  // sessionStorageのテスト
  try {
    const testKey = '__sessionStorage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    info.sessionStorageAvailable = true;
  } catch (e) {
    info.sessionStorageAvailable = false;
    info.sessionStorageError = e.message;
  }

  // サードパーティCookieの状態を推測
  info.thirdPartyCookiesBlocked = !navigator.cookieEnabled || 
    (isHTTPS && !info.localStorageAvailable);

  console.group('HTTPS Environment Check');
  console.table(info);
  console.groupEnd();

  return info;
}

export function logOAuthDebugInfo() {
  console.group('OAuth Debug Information');
  
  // Google OAuth client ID
  console.log('Client ID:', import.meta.env.VITE_CLIENT_ID);
  
  // Google APIの状態
  if (typeof gapi !== 'undefined') {
    console.log('GAPI loaded:', true);
    console.log('GAPI client loaded:', typeof gapi.client !== 'undefined');
    console.log('Current token:', gapi.client.getToken());
  } else {
    console.log('GAPI loaded:', false);
  }
  
  // Google Identity Servicesの状態
  if (typeof google !== 'undefined' && google.accounts) {
    console.log('GIS loaded:', true);
  } else {
    console.log('GIS loaded:', false);
  }
  
  console.groupEnd();
}