import _ from "lodash";
import { produce } from "solid-js/store";

import { setStore, store } from "../../index";

function getNodeById_(nodes, id) {
  const node = nodes.content[id];
  if (!node) {
    return null;
  }

  return node;
}

export function getNodeById(id) {
  return getNodeById_(store.nodes, id);
}

export function getNodePathByNode(node) {
  const nodePath = [node];
  const visitedIds = new Set([node.id]);

  // If node doesn't have a parentNodeId or it's null, return just this node
  if (!node.parentNodeId) {
    return nodePath;
  }

  let currentNode = getNodeById(node.parentNodeId);
  while (currentNode && !visitedIds.has(currentNode.id)) {
    nodePath.push(currentNode);
    visitedIds.add(currentNode.id);

    // Stop if we reach a node without a parent (root node)
    if (!currentNode.parentNodeId) {
      break;
    }

    currentNode = getNodeById(currentNode.parentNodeId);
  }

  if (currentNode && visitedIds.has(currentNode.id)) {
    console.error(
      `Circular reference detected in node path for node ${node.id}, parent chain: ${[...visitedIds].join(" -> ")}`,
    );
  }

  return nodePath.reverse();
}

function setNodeById_(nodes, id, objUpdatesOrFunctionUpdates) {
  const targetNode = nodes.content[id];

  if (!targetNode) {
    console.error(`Cannot find targetNode for id: [${id}]`);
    console.trace();
    return;
  }

  let objUpdates;
  if (typeof objUpdatesOrFunctionUpdates === "object") {
    objUpdates = objUpdatesOrFunctionUpdates;
  }

  if (typeof objUpdatesOrFunctionUpdates === "function") {
    const fUpdates = objUpdatesOrFunctionUpdates;
    objUpdates = fUpdates(targetNode);
  }

  if (!objUpdates) {
    return;
  }

  for (const [k, v] of Object.entries(objUpdates)) {
    if (!_.isEqual(targetNode[k], v)) {
      targetNode[k] = v;
    }
  }
}

export function setNodesContent(nodes) {
  setStore(
    produce((s) => {
      for (const node of nodes) {
        s.nodes.content[node.id] = node;
      }
    }),
  );
}

export function setNodeById(id, objUpdatesOrFunctionUpdates) {
  setStore(
    produce((s) => {
      setNodeById_(s.nodes, id, objUpdatesOrFunctionUpdates);
    }),
  );
}

export function isFolder(node) {
  return node.mimeType === "application/vnd.google-apps.folder";
}

export function getRicherNode(node, parentNodeId) {
  if (isFolder(node)) {
    return {
      ...node,
      parentNodeId,
      subNodesId: null,
      isExpanded: false,
      height: 0,
    };
  } else {
    return { ...node, parentNodeId };
  }
}

export function getRicherNodes(nodes, parentNodeId) {
  return [...nodes].map((n) => getRicherNode(n, parentNodeId));
}
