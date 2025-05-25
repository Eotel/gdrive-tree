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
        console.log(`Triggering files request for tab: ${initSwitch}`);
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
