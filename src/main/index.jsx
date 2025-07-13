import { Show, createEffect, lazy, onCleanup, onMount } from "solid-js";

import { Route, Routes } from "solid-app-router";
import { hiddenClass } from "../globalConstant";
import { store } from "../index";
import FileDetailsPanel from "./FileDetailsPanel";
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";
import Tabs from "./Tabs";
import TreeContainer from "./TreeContainer";
import { triggerFilesRequest } from "./triggerFilesRequest";
import { debug } from "../utils/debug";

const TestSharedDrives = lazy(() => import("../../test-shared-drives"));

const Main = () => {
  const MainContent = ({ initSwitch }) => {
    let refMain;

    onMount(() => {
      const headerElement = document.getElementById("topBar");
      const mainElement = refMain;

      if (headerElement) {
        if (headerElement.classList.contains(hiddenClass)) {
          mainElement.classList.add(hiddenClass);
        } else {
          mainElement.classList.remove(hiddenClass);
        }
      }
    });

    // Track if this specific component instance has loaded data
    let hasLoadedData = false;
    
    // Trigger files request when conditions are met
    createEffect(() => {
      // Check all conditions
      if (store.isExternalLibLoaded && 
          store.hasCredential && 
          !hasLoadedData && 
          !store.nodes.isLoading &&
          initSwitch) {
        debug.log(`Triggering files request for tab: ${initSwitch}`);
        hasLoadedData = true;
        triggerFilesRequest(initSwitch);
      }
    });

    return (
      <main
        ref={refMain}
        id="mainContent"
        class="transition-transform custom-transition-duration h-full"
      >
        <div class="flex flex-col h-full">
          <Tabs />
          <div class="flex flex-1 overflow-hidden">
            <div class="flex-1 flex flex-col min-w-0">
              <div class="p-4 flex-shrink-0">
                <Show when={store.error}>
                  <div class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 class="font-bold">エラーが発生しました</h3>
                      <div class="text-xs">{store.error.message}</div>
                      <Show when={store.error.status}>
                        <div class="text-xs mt-1">ステータスコード: {store.error.status}</div>
                      </Show>
                    </div>
                  </div>
                </Show>
                <SearchBar />
                <SearchResults />
              </div>
              <div class="flex-1 overflow-auto">
                <TreeContainer initSwitch={initSwitch} />
              </div>
            </div>
            <Show when={store.selectedFile}>
              <div class="w-96 flex-shrink-0 border-l border-base-300">
                <FileDetailsPanel />
              </div>
            </Show>
          </div>
        </div>
      </main>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<MainContent initSwitch="drive" />} />
      <Route path="/shared" element={<MainContent initSwitch="shared" />} />
      <Route path="/shared-drives" element={<MainContent initSwitch="sharedDrives" />} />
      <Route path="/test" element={<TestSharedDrives />} />
    </Routes>
  );
};

export default Main;
