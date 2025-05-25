import { setStore } from "../../index";
import { fetchFileDetails } from "../fileDetailsAPI";
import { findNearestLowerFocusableElement } from "./htmlElement";

const File = ({ node, mustAutofocus }) => {
  return (
    <li id={node.id} class="py-1">
      <span
        class="selectable file"
        tabindex="0"
        autofocus={mustAutofocus}
        onClick={(e) => {
          e.stopPropagation();
          // Single click - show details
          setStore("selectedFile", node);
          fetchFileDetails(node.id);
        }}
        onDblClick={(e) => {
          e.stopPropagation();
          // Double click - open file
          window.open(node.webViewLink, "_blank").focus();
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
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' viewBox='0 0 16 16'%3E%3Cpath d='M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z'/%3E%3C/svg%3E"
          }
          alt=""
          onerror={(event) => {
            const currentImage = event.currentTarget;
            currentImage.onerror = null; // Prevent infinite loop
            // Use a generic file icon as fallback
            currentImage.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' viewBox='0 0 16 16'%3E%3Cpath d='M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z'/%3E%3C/svg%3E";
          }}
        />
        <span
          style="margin-left: 4px; margin-right: 2px; white-space: nowrap"
          contenteditable="false"
        >
          {node.name}
        </span>
      </span>
    </li>
  );
};

export default File;
