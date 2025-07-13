// Documentation link:
// https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#implicit_flow_examples

import { setStore } from "./index";
import { getSavedToken, hasValidToken } from "./tokenStorage";
import { checkHTTPSEnvironment, logOAuthDebugInfo } from "./utils/httpsDebug";

export let tokenClient;
let gapiInited;
let gisInited;

function checkBeforeStart() {
  if (gapiInited && gisInited) {
    setStore("isExternalLibLoaded", () => true);
    // HTTPS環境のチェックとOAuth情報のログ出力
    checkHTTPSEnvironment();
    logOAuthDebugInfo();
  }
}

function gapiInit() {
  gapi.client
    .init({})
    .then(() => {
      gapi.client.load("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest");

      // Try to restore saved token
      const savedToken = getSavedToken();
      if (savedToken) {
        console.info("Restoring saved token from localStorage");
        gapi.client.setToken({
          access_token: savedToken,
        });
      }

      gapiInited = true;
      checkBeforeStart();
      console.info("Gapi lib loaded");
      setStore("hasCredential", hasValidToken());
    })
    .catch((err) => {
      console.error("Cannot load Gapi lib");
      console.error(err);
    });
}

function gapiLoad() {
  gapi.load("client", gapiInit);
}

function gisInit() {
  const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"].join(" ");
  
  // Detect current protocol and construct redirect URI
  const currentProtocol = window.location.protocol;
  const currentHost = window.location.host;
  const redirectUri = `${currentProtocol}//${currentHost}/`;
  
  console.info(`OAuth initialization - Protocol: ${currentProtocol}, Host: ${currentHost}, Redirect URI: ${redirectUri}`);
  
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_CLIENT_ID,
      scope: SCOPES,
      callback: "",
      ux_mode: "popup",
      redirect_uri: redirectUri,
    });

    gisInited = true;
    checkBeforeStart();

    console.info("GSI lib loaded successfully");
  } catch (error) {
    console.error("Failed to initialize Google OAuth client:", error);
    console.error("Client ID:", import.meta.env.VITE_CLIENT_ID);
  }
}

function triggerLoadScript(src, onloadCallback, onerrorCallback) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.defer = true;
  script.onload = onloadCallback;
  script.onerror = onerrorCallback;
  document.head.appendChild(script);
}

// Documentation link :
// https://levelup.gitconnected.com/how-to-load-external-javascript-files-from-the-browser-console-8eb97f7db778
triggerLoadScript("https://apis.google.com/js/api.js", gapiLoad, (error) => {
  console.error("Cannot load Gapi lib", error);
  console.error("Failed to load:", "https://apis.google.com/js/api.js");
});

triggerLoadScript("https://accounts.google.com/gsi/client", gisInit, (error) => {
  console.error("Cannot load GIS lib", error);
  console.error("Failed to load:", "https://accounts.google.com/gsi/client");
  console.error("This may be due to CSP restrictions in HTTPS environment");
});

window.onload = () => {
  // Provide a 'mod' function which compute correctly the modulo
  // operation over negative numbers
  Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
  };
};
