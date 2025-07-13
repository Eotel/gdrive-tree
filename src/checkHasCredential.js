import { setStore, store } from "./index";
import { hasValidToken } from "./tokenStorage";

export function checkHasCredential() {
  // WARNING: this if to check the store.nodes.isLoading signal is necessary to
  //          trigger the run of this effect when the load is done
  store.nodes.isLoading;
  store.nodes.isInitialised;
  if (store.isExternalLibLoaded) {
    // Check both gapi token and localStorage token
    const gapiToken = gapi.client.getToken();
    const hasLocalToken = hasValidToken();
    const newHasCredential = gapiToken !== null || hasLocalToken;
    
    console.info("Credential check:", {
      hasGapiToken: gapiToken !== null,
      hasLocalStorageToken: hasLocalToken,
      newHasCredential: newHasCredential,
      currentHasCredential: store.hasCredential
    });
    
    if (store.hasCredential !== newHasCredential) {
      setStore("hasCredential", () => newHasCredential);
    }
  }
}
