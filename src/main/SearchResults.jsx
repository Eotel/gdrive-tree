import { For, Show } from "solid-js";
import { store } from "../index";
import { isFolder, setNodeById } from "./tree/node";

const SearchResults = () => {
  const handleResultClick = (node) => {
    // Expand all parent nodes to reveal the selected item
    expandPathToNode(node);

    // Focus on the node element
    setTimeout(() => {
      const element = document.getElementById(node.id);
      if (element) {
        const focusableElement = element.querySelector(".selectable");
        if (focusableElement) {
          focusableElement.focus();
          focusableElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 300);
  };

  const expandPathToNode = (targetNode) => {
    const pathNodes = [];
    let currentNode = targetNode;

    // Build path from target to root
    while (currentNode?.parentNodeId) {
      const parentNode = store.nodes.content[currentNode.parentNodeId];
      if (parentNode && isFolder(parentNode)) {
        pathNodes.unshift(parentNode);
      }
      currentNode = parentNode;
    }

    // Expand all folders in the path
    for (const node of pathNodes) {
      if (!node.isExpanded) {
        setNodeById(node.id, { isExpanded: true });
      }
    }
  };

  const getFileIcon = (node) => {
    if (node.iconLink) {
      return (
        <img
          src={node.iconLink}
          alt=""
          class="w-5 h-5"
          onerror={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }

    if (isFolder(node)) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Folder"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        role="img"
        aria-label="File"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  return (
    <Show when={store.isSearchActive && store.searchResults}>
      <div class="search-results-container mb-4 border rounded-lg p-4 max-h-96 overflow-y-auto">
        <Show
          when={store.searchResults.length > 0}
          fallback={
            <div class="text-center text-gray-500 py-8">
              No files or folders found matching your search.
            </div>
          }
        >
          <div class="space-y-2">
            <For each={store.searchResults}>
              {(result) => (
                <div
                  class="search-result-item flex items-center gap-3 p-2 hover:bg-base-200 rounded cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleResultClick(result);
                    }
                  }}
                  tabIndex="0"
                  role="button"
                >
                  <div class="flex-shrink-0">{getFileIcon(result)}</div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium truncate">{result.name}</div>
                    <div class="text-sm text-gray-500 truncate">{result.path}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default SearchResults;
