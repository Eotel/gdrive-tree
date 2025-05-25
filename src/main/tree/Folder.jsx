import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

import { getSortedNodesFromDirectory } from "../triggerFilesRequest";
import {
  adjustBodyWidth,
  findChildElementWithPredicat,
  findNearestLowerFocusableElement,
  findNearestUpperLiWithId,
} from "./htmlElement";
import Tree from "./index";
import {
  getNodeById,
  getNodePathByNode,
  getRicherNodes,
  setNodeById,
  setNodesContent,
} from "./node";

import SpinningWheel from "../../SpinningWheel";
import { customTransitionDuration } from "../../globalConstant";
import { setStore } from "../../index";
import { fetchFileDetails } from "../fileDetailsAPI";

// TODO: use solidjs-icon librairy
const ArrowIcon = ({ node, toggleExpanded }) => {
  const isExpanded = () => {
    return node.isExpanded;
  };

  let arrowRef;

  function addClassIfExpanded(isExpanded) {
    if (isExpanded) {
      arrowRef.classList.add("expand-folder");
    } else {
      arrowRef.classList.remove("expand-folder");
    }
  }

  function handleClickArrow() {
    toggleExpanded();
  }

  createEffect(() => {
    addClassIfExpanded(isExpanded());
  });

  onMount(() => {
    arrowRef.addEventListener("click", handleClickArrow);
  });

  onCleanup(() => {
    arrowRef.removeEventListener("click", handleClickArrow);
  });

  return (
    <span ref={arrowRef} class="arrow-container custom-transition-duration">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        width="16px"
        height="16px"
        viewBox="0 -5 25 30"
        aria-hidden="true"
      >
        <path class="arrow" d="m5 20 10 -10 -10 -10 z"></path>
      </svg>
    </span>
  );
};

async function fetchSubNodes(node, fetchState, setFetchState) {
  if (fetchState() !== "done") {
    try {
      setFetchState("running");

      const nodes = await getSortedNodesFromDirectory(999, "*", node.id);
      const richerNodes = getRicherNodes(nodes, node.id);

      setNodesContent(richerNodes);

      // Check if the node exists before updating it
      const existingNode = getNodeById(node.id);
      if (existingNode) {
        setNodeById(node.id, { subNodesId: richerNodes.map((n) => n.id) });
      } else {
        console.warn(`Node ${node.id} not found in content, skipping subNodesId update`);
        // For shared drives, we might need to create the node first
        if (node.kind === "drive#teamDrive") {
          console.log(`Creating shared drive node for ${node.id}`);
          setNodesContent([{ ...node, subNodesId: richerNodes.map((n) => n.id) }]);
        }
      }

      setFetchState("done");
    } catch (error) {
      console.error(error);
      setFetchState("failed");
    }
  }
}

const Folder = ({ node, mustAutofocus }) => {
  const [fetchState, setFetchState] = createSignal("init");

  const SmallSpinningWheel = () => {
    return <SpinningWheel size="small" className="ml-2" />;
  };

  function toggleExpanded() {
    setNodeById(node.id, { isExpanded: !node.isExpanded });
  }

  createEffect(() => {
    const verbose = false;
    function getTreeRef(id) {
      const parentLi = document.getElementById(id);
      if (verbose) {
        console.log("id", id);
        console.log("parentLi", parentLi);
      }
      if (parentLi === null) {
        return null;
      }
      const childUl = findChildElementWithPredicat(parentLi, (element) => element.tagName === "UL");
      if (verbose) {
        console.log("childUl", childUl);
        if (childUl !== null) {
          console.log("childUl.parentElement", childUl.parentElement);
        }
      }
      if (childUl === null) {
        return null;
      }

      return childUl.parentElement;
    }

    function setNodeHeight(node, toExpand) {
      const treeRef = getTreeRef(node.id);
      if (treeRef === null) {
        return null;
      }
      const currentElementHeight = treeRef.getBoundingClientRect().height;
      // The 'heightOffset' gives enough space to avoid the focus border
      // to be cropped on the last element of a folder.
      const heightOffset = 3;
      const heightToSet = currentElementHeight + heightOffset;

      let hasUpdated = false;
      if (node.height === 0 && toExpand) {
        setNodeById(node.id, { height: heightToSet });
        hasUpdated = true;
      } else if (node.height !== 0 && !toExpand) {
        setNodeById(node.id, { height: 0 });
        hasUpdated = true;
      }

      return [hasUpdated, heightToSet];
    }

    function updateNodeHeight(id, incrementHeight) {
      const treeRef = getTreeRef(id);
      if (treeRef === null) {
        return;
      }

      setNodeById(id, (obj) => ({
        height: obj.height + incrementHeight,
      }));
    }

    const res = setNodeHeight(node, node.isExpanded);

    if (res === null) {
      return;
    }

    const nodePath = getNodePathByNode(node);
    // Delete the current node and the root node from nodePath
    nodePath.pop();
    nodePath.shift();

    const [hasUpdated, startNodeHeight] = res;
    if (hasUpdated) {
      while (nodePath.length) {
        const currentNode = nodePath.pop();
        updateNodeHeight(currentNode.id, node.isExpanded ? startNodeHeight : -startNodeHeight);
      }
    }
  });

  const isParentExpanded = () => {
    return getNodeById(node.parentNodeId).isExpanded;
  };

  // Fetch only if the parent tree has been expanded once.
  createEffect(() => {
    if (isParentExpanded()) {
      fetchSubNodes(node, fetchState, setFetchState);
    }
  });

  let nameRef;
  let nameContentRef;

  function handleClickName(e) {
    // Handle only double click
    if (e.detail === 2) {
      toggleExpanded();
    }
  }

  function handleFocus(e) {
    setTimeout(() => {
      adjustBodyWidth();
    }, customTransitionDuration);
  }

  function handleBlur(e) {
    setTimeout(() => {
      adjustBodyWidth();
    }, customTransitionDuration);
  }

  onMount(() => {
    nameRef.addEventListener("click", handleClickName);
    nameRef.addEventListener("focus", handleFocus);
    nameRef.addEventListener("blur", handleBlur);
  });

  onCleanup(() => {
    nameRef.removeEventListener("click", handleClickName);
    nameRef.removeEventListener("focus", handleFocus);
    nameRef.removeEventListener("blur", handleBlur);
  });

  return (
    <li
      id={node.id}
      class="pt-1"
      onClick={(e) => {
        let currentElement = null;
        if (e.target.tagName === "LI" && e.target.getAttribute("id") !== null) {
          currentElement = e.target;
        } else {
          currentElement = findNearestUpperLiWithId(e.target);
        }

        if (currentElement === null) {
          return;
        }

        if (currentElement !== e.currentTarget) {
          return;
        }

        const childFocusableElement = findNearestLowerFocusableElement(e.currentTarget);

        if (document.activeElement !== childFocusableElement) {
          childFocusableElement.focus();
        }

        if (e.detail === 2) {
          toggleExpanded();
        }
        // TODO : handle case if it's a cell phone that make the 'click'.
        //        maybe a 'tap' event is available
      }}
    >
      <span class="folder-surrounding-span">
        <ArrowIcon node={node} toggleExpanded={toggleExpanded} />
        <span
          class="selectable"
          tabindex="0"
          autofocus={mustAutofocus}
          ref={nameRef}
          onClick={(e) => {
            e.stopPropagation();
            // Single click - show details
            setStore("selectedFile", node);
            fetchFileDetails(node.id);
            if (e.detail === 2) {
              // Double click - toggle expanded
              toggleExpanded();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setStore("selectedFile", node);
              fetchFileDetails(node.id);
            }
          }}
        >
          <img
            src={
              node.iconLink ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' viewBox='0 0 16 16'%3E%3Cpath d='M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm0 1h4.586a1 1 0 0 1 .707.293l.707.707H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z'/%3E%3C/svg%3E"
            }
            alt=""
            onerror={(event) => {
              const currentImage = event.currentTarget;

              // Use a fallback icon if the image fails to load
              currentImage.onerror = null; // Prevent infinite loop

              if (node.kind === "drive#teamDrive" || currentImage.src.includes("shared_drive")) {
                // Use a shared drive icon
                currentImage.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%234285f4' viewBox='0 0 16 16'%3E%3Cpath d='M8.5 1.5A1.5 1.5 0 0 1 10 0h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5c-.878 0-1.5.522-1.5 1.5v11c0 .978.622 1.5 1.5 1.5h7c.378 0 .5-.122.5-.5v-11c0-.378-.122-.5-.5-.5h-1a1.5 1.5 0 0 1-1.5-1.5z'/%3E%3C/svg%3E";
              } else {
                // Use a generic folder icon
                currentImage.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' viewBox='0 0 16 16'%3E%3Cpath d='M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm0 1h4.586a1 1 0 0 1 .707.293l.707.707H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z'/%3E%3C/svg%3E";
              }
            }}
          />
          <span
            ref={nameContentRef}
            class="nameContent"
            style={fetchState() === "failed" ? "color: red" : ""}
            contenteditable="false"
          >
            {node.name}
          </span>
        </span>
        {fetchState() === "running" && <SmallSpinningWheel />}
      </span>
      {fetchState() === "done" && <Tree id={node.id} />}
    </li>
  );
};

export default Folder;
