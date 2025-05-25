import { Show, createEffect, createSignal, onMount } from "solid-js";

import SpinningWheel from "../SpinningWheel";
import { checkHasCredential } from "../checkHasCredential";
import { setStore, store } from "../index";
import Tree from "./tree";
import { triggerFilesRequest } from "./triggerFilesRequest";

const ShowFilesButton = ({ initSwitch }) => {
  onMount(() => {
    // Height settings removed - now handled by CSS layout
  });

  const BigSpinningWheel = () => {
    return <SpinningWheel size="big" />;
  };

  const Container = (props) => {
    return <div id="show-files-button-container">{props.children}</div>;
  };

  const isReady = () => !store.isExternalLibLoaded || store.nodes.isLoading;

  return (
    <Show
      when={isReady()}
      fallback={
        <Container>
          <button class="btn" onClick={() => triggerFilesRequest(initSwitch)}>
            Show Files
          </button>
        </Container>
      }
    >
      <Container>
        <button class="btn" disabled={isReady()}>
          <BigSpinningWheel />
        </button>
      </Container>
    </Show>
  );
};

const TreeContainer = ({ initSwitch }) => {
  createEffect(checkHasCredential);

  return (
    <Show
      when={store.hasCredential && store.nodes.isInitialised && !store.nodes.isLoading}
      fallback={<ShowFilesButton initSwitch={initSwitch} />}
    >
      <Tree id="root" />
    </Show>
  );
};

export default TreeContainer;
