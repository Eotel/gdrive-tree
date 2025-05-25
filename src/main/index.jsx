import { createEffect, lazy, onMount } from "solid-js";

import { Route, Routes } from "solid-app-router";
import { hiddenClass } from "../globalConstant";
import { store } from "../index";
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

    // Trigger files request when external lib is loaded
    createEffect(() => {
      if (store.isExternalLibLoaded && initSwitch) {
        triggerFilesRequest(initSwitch);
      }
    });

    return (
      <main ref={refMain} id="mainContent" class="transition-transform custom-transition-duration">
        <Tabs />
        <div class="p-4">
          <SearchBar />
          <SearchResults />
        </div>
        <TreeContainer initSwitch={initSwitch} />
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
