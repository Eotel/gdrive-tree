import { createEffect, createSignal } from "solid-js";
import { setStore, store } from "../index";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [isSearching, setIsSearching] = createSignal(false);

  let searchInputRef;

  // Keyboard shortcut to focus search (Ctrl/Cmd + F)
  createEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  const handleSearch = (value) => {
    setSearchTerm(value);

    if (value.trim() === "") {
      // Clear search results
      setStore("searchResults", null);
      setStore("isSearchActive", false);
      return;
    }

    setIsSearching(true);
    setStore("isSearchActive", true);

    // Perform search across all loaded nodes
    const results = searchNodes(value.toLowerCase());
    setStore("searchResults", results);
    setIsSearching(false);
  };

  const searchNodes = (term) => {
    const results = [];
    const nodes = store.nodes.content;

    // Search through all nodes
    for (const node of Object.values(nodes)) {
      if (node?.name?.toLowerCase().includes(term)) {
        results.push({
          ...node,
          path: getNodePath(node),
        });
      }
    }

    return results;
  };

  const getNodePath = (node) => {
    const path = [node.name];
    let currentNode = node;

    while (currentNode.parentNodeId && currentNode.parentNodeId !== "root") {
      const parentNode = store.nodes.content[currentNode.parentNodeId];
      if (parentNode) {
        path.unshift(parentNode.name);
        currentNode = parentNode;
      } else {
        break;
      }
    }

    return path.join(" / ");
  };

  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.value = "";
    setStore("searchResults", null);
    setStore("isSearchActive", false);
  };

  return (
    <div class="search-bar-container mb-4">
      <div class="form-control">
        <div class="input-group">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search files and folders... (Ctrl+F)"
            class="input input-bordered flex-1"
            value={searchTerm()}
            onInput={(e) => handleSearch(e.target.value)}
            disabled={!store.nodes.isInitialised || store.nodes.isLoading}
          />
          <button
            type="button"
            class="btn btn-square"
            onClick={clearSearch}
            disabled={searchTerm() === ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Clear search"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      {isSearching() && <div class="text-sm text-gray-500 mt-2">Searching...</div>}
      {store.searchResults && !isSearching() && (
        <div class="text-sm text-gray-500 mt-2">
          Found {store.searchResults.length} result{store.searchResults.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
