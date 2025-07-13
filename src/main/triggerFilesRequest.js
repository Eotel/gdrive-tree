import _ from "lodash";

import { setStore, store } from "../index";
import { tokenClient } from "../init";
import { clearToken, getSavedToken, saveToken } from "../tokenStorage";
import { getRicherNodes, isFolder } from "./tree/node";
import { debug, logApiRequest, logApiResponse, logApiError } from "../utils/debug";

import { rootId } from "./../globalConstant";

/**
 * Maps a node id to an array of children nodes.
 */
const nodesCache = {};

/**
 * Make a request for a new token
 *
 * @param {string} promptStr
 * @returns A promise
 */
function getToken(promptStr) {
  return new Promise((resolve, reject) => {
    try {
      // Save current path before authentication
      if (promptStr === "consent") {
        try {
          sessionStorage.setItem("gdrive_auth_return_path", window.location.pathname);
        } catch (e) {
          console.error("Failed to save return path to sessionStorage:", e);
        }
      }
      
      console.info(`Requesting OAuth token with prompt: "${promptStr}"`);
      console.info(`Current location: ${window.location.href}`);
      
      // Deal with the response for a new token
      tokenClient.callback = (resp) => {
        console.info("OAuth token response received:", {
          hasError: resp.error !== undefined,
          error: resp.error,
          hasAccessToken: !!resp.access_token,
          expiresIn: resp.expires_in
        });
        
        if (resp.error !== undefined) {
          console.error("OAuth error:", resp.error, resp.error_description);
          reject(resp);
        } else {
          // Save the token to localStorage
          saveToken(resp);
          resolve(resp);
        }
      };
      
      // Ask for a new token
      debug.auth("Requesting access token with params:", {
        prompt: promptStr || "",
        client_id: import.meta.env.VITE_CLIENT_ID,
        protocol: window.location.protocol,
        host: window.location.host
      });
      tokenClient.requestAccessToken({
        prompt: promptStr || "",
      });
    } catch (err) {
      debug.error("Failed to request token:", err);
      reject(err);
    }
  });
}

function buildFilesListArg(args) {
  const result = {};

  const authorisedKeys = [
    "pageSize",
    "fields",
    "q",
    "folderId",
    "pageToken",
    "spaces",
    "includeItemsFromAllDrives",
    "includeTeamDriveItems",
    "supportsAllDrives",
    "supportsTeamDrives",
    "orderBy",
    "corpora",
    "driveId",
  ];

  // Process folderId first if it exists
  if (args.folderId && args.folderId !== undefined) {
    result.q = "'" + args.folderId + "' in parents and trashed = false";
  }

  // Then process all other keys, including 'q' which may override the above
  for (const key of Object.keys(args)) {
    if (!authorisedKeys.includes(key)) {
      continue;
    }
    if (key !== "folderId") {
      result[key] = args[key];
    }
  }

  return result;
}

function gFilesList(listOptions) {
  const args = buildFilesListArg(listOptions);
  logApiRequest('drive.files.list', args);
  return gapi.client.drive.files.list(args);
}

async function loopRequest(listOptions) {
  /**
   * Make as many requests that are necessary to retrieve the content of
   * a folder.
   *
   * @param {object} listOptions : necessary to build the request to google
   * @returns Array of files
   */
  async function grabFiles(listOptions) {
    const result = [];
    let nextPageToken;
    do {
      const response = await gFilesList({
        ...listOptions,
        pageToken: nextPageToken,
      });

      logApiResponse('drive.files.list', response.result);
      nextPageToken = response.result.nextPageToken;
      if (response.result.files.length <= 0) {
        nextPageToken = null;
        break;
      }
      for (const file of response.result.files) {
        result.push(file);
      }
    } while (nextPageToken);
    return result;
  }

  return new Promise(async (resolve, reject) => {
    try {
      const result = await grabFiles(listOptions);
      resolve(result);
    } catch (err) {
      debug.info("First call to google API failed.");
      debug.info(err);
      console.error("API Error details:", {
        status: err.status,
        statusText: err.statusText,
        message: err.message,
        error: err.error,
        result: err.result
      });

      // Clear expired token if it exists
      if (err.status === 401 || err.status === 403) {
        console.info("Authentication error detected, clearing stored token");
        clearToken();
      }

      if (gapi.client.getToken() === null) {
        // Check if we have a saved token before asking for consent
        const savedToken = getSavedToken();
        if (savedToken) {
          debug.info("Restoring saved token from localStorage");
          gapi.client.setToken({
            access_token: savedToken,
          });
          // Try again with the restored token
          try {
            const result = await grabFiles(listOptions);
            resolve(result);
            return;
          } catch (retryErr) {
            debug.info("Saved token failed, will request new token");
            // Clear the invalid token
            clearToken();
          }
        }
        
        debug.info("Ask consentment");
        getToken("consent")
          .then(async (resp) => {
            const result = await grabFiles(listOptions);
            resolve(result);
          })
          .catch((err) => {
            debug.error("Cannot call google API.");
            debug.error(err);
            reject(err);
          });
      } else {
        debug.info("Try silent authentication first");
        // Try without prompt first (silent authentication)
        getToken("")
          .then(async (resp) => {
            const result = await grabFiles(listOptions);
            resolve(result);
          })
          .catch((err) => {
            debug.info("Silent authentication failed, asking for consent");
            // If silent auth fails, ask for consent
            getToken("consent")
              .then(async (resp) => {
                const result = await grabFiles(listOptions);
                resolve(result);
              })
              .catch((err) => {
                debug.error("Cannot call google API.");
                debug.error(err);
                reject(err);
              });
          });
      }
    }
  });
}

function sortNodesDirectoryFirst(node0, node1) {
  if (isFolder(node0) && !isFolder(node1)) {
    return -1;
  }
  if (!isFolder(node0) && isFolder(node1)) {
    return 1;
  }
  return node0.name.localeCompare(node1.name);
}

async function higherGetSortedNodes(getSortedNodesFunction, pageSize, fields, folderId) {
  const nodes = await getSortedNodesFunction(pageSize, fields, folderId);
  nodes.sort(sortNodesDirectoryFirst);
  return nodes;
}

const folderIdDict = {};

function addFolderId(folderId) {
  folderIdDict[folderId] = true;
}

function retrieveFolderIds(nodes) {
  nodes.forEach((node) => {
    // debug.log("node", node);
    if (isFolder(node)) {
      addFolderId(node.id);
    }
  });
}

async function getNodesFromDirectory(pageSize, fields, folderId) {
  if (nodesCache[folderId]) {
    return nodesCache[folderId];
  }

  // Check if this is a shared drive ID by looking at the parent node
  const parentNode = store.nodes.content[folderId];
  const isSharedDrive = parentNode && parentNode.kind === "drive#teamDrive";

  const requestParams = {
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    folderId,
    spaces: "drive",
  };

  // If this is a shared drive, add corpora and driveId parameters
  if (isSharedDrive) {
    requestParams.corpora = "drive";
    requestParams.driveId = folderId;
    requestParams.includeItemsFromAllDrives = true;
    requestParams.supportsAllDrives = true;
    // Keep the folderId to query files in the root of the shared drive
    // The buildFilesListArg function will handle creating the appropriate query
  }

  const result = await loopRequest(requestParams);

  retrieveFolderIds(result);

  nodesCache[folderId] = [...result];

  return result;
}

export async function getSortedNodesFromDirectory(pageSize, fields, folderId) {
  return await higherGetSortedNodes(getNodesFromDirectory, pageSize, fields, folderId);
}

async function getSharedNodes(pageSize, fields) {
  const result = await loopRequest({
    pageSize,
    fields,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    q: "sharedWithMe = true",
    spaces: "drive",
  });

  return result;
}

async function getSortedSharedNodes(pageSize, fields) {
  return await higherGetSortedNodes(getSharedNodes, pageSize, fields);
}

async function initNodesFromRoot() {
  return await getSortedNodesFromDirectory(999, "*", "root");
}

async function initSharedNodes() {
  return await getSortedSharedNodes(999, "*");
}

async function getSharedDrives() {
  // Handle authentication like other API calls
  async function grabDrives() {
    const response = await gapi.client.drive.drives.list({
      pageSize: 100,
      fields: "drives(id, name, kind)",
    });

    // Convert shared drives to node format
    const drives = response.result.drives || [];
    return drives.map((drive) => ({
      id: drive.id,
      name: drive.name,
      mimeType: "application/vnd.google-apps.folder",
      kind: "drive#teamDrive",
      webViewLink: `https://drive.google.com/drive/folders/${drive.id}`,
      iconLink: "https://ssl.gstatic.com/docs/doclist/images/icon_11_shared_drive_2x.png",
    }));
  }

  return new Promise(async (resolve, reject) => {
    try {
      const result = await grabDrives();
      resolve(result);
    } catch (err) {
      debug.info("First call to google API for drives failed.");
      debug.info(err);

      // Clear expired token if it exists
      if (err.status === 401 || err.status === 403) {
        clearToken();
      }

      if (gapi.client.getToken() === null) {
        // Check if we have a saved token before asking for consent
        const savedToken = getSavedToken();
        if (savedToken) {
          debug.info("Restoring saved token from localStorage");
          gapi.client.setToken({
            access_token: savedToken,
          });
          // Try again with the restored token
          try {
            const result = await grabDrives();
            resolve(result);
            return;
          } catch (retryErr) {
            debug.info("Saved token failed, will request new token");
            // Clear the invalid token
            clearToken();
          }
        }
        
        debug.info("Ask consentment");
        getToken("consent")
          .then(async (resp) => {
            const result = await grabDrives();
            resolve(result);
          })
          .catch((err) => {
            debug.error("Cannot call google API for drives.");
            debug.error(err);
            resolve([]); // Return empty array instead of rejecting
          });
      } else {
        debug.info("Try silent authentication first");
        // Try without prompt first (silent authentication)
        getToken("")
          .then(async (resp) => {
            const result = await grabDrives();
            resolve(result);
          })
          .catch((err) => {
            debug.info("Silent authentication failed, asking for consent");
            // If silent auth fails, ask for consent
            getToken("consent")
              .then(async (resp) => {
                const result = await grabDrives();
                resolve(result);
              })
              .catch((err) => {
                debug.error("Cannot call google API for drives.");
                debug.error(err);
                resolve([]); // Return empty array instead of rejecting
              });
          });
      }
    }
  });
}

async function initSharedDrivesNodes() {
  const drives = await getSharedDrives();
  debug.log(`Fetched ${drives.length} shared drives`);
  return drives;
}

async function initEveryNodes() {
  return await getSortedEveryNodes(999, "*");
}

export async function triggerFilesRequest(initSwitch) {
  function grabFiles(initSwitch) {
    switch (initSwitch) {
      case "drive":
        return initNodesFromRoot();
      case "shared":
        return initSharedNodes();
      case "sharedDrives":
        return initSharedDrivesNodes();
      case "every":
        return initEveryNodes();
      default:
        debug.error(`initSwitch "${initSwitch}" is not handled.`);
        return new Promise((resolve, reject) => {
          resolve([]);
        });
    }
  }

  // Clear cache for root when switching tabs to ensure fresh data
  if (initSwitch === "drive" || initSwitch === "shared" || initSwitch === "sharedDrives") {
    delete nodesCache["root"];
  }

  // Set loading state without clearing all data
  setStore("nodes", "isLoading", true);
  setStore("error", null);

  try {
    const newNodes = await grabFiles(initSwitch);

  // For shared drives, the parent should always be "root"
  const parentId = "root";
  const richerNodes = getRicherNodes(newNodes, parentId);

  // Clear only the direct children of root, preserving the root node itself
  const currentRootSubNodes = store.nodes.content.root?.subNodesId || [];
  const newSubNodesId = richerNodes.map((n) => n.id);
  
  // Get the default root node structure
  const rootNode = store.nodes.content.root || {
    id: "root",
    name: "ROOT",
    mimeType: "application/vnd.google-apps.folder",
    parentNodeId: null,
    subNodesId: [],
    isExpanded: true,
  };
  
  // Create a new content object with only root and the new nodes
  const newContent = {
    root: {
      ...rootNode,
      subNodesId: newSubNodesId,
    },
  };

  // Add all new nodes to the content
  for (const node of richerNodes) {
    newContent[node.id] = node;
  }

  // Update the store with new content
  setStore("nodes", (current) => ({
    ...current,
    isInitialised: true,
    isLoading: false,
    content: newContent,
  }));
  } catch (error) {
    debug.error("Error in triggerFilesRequest:", error);
    setStore("nodes", "isLoading", false);
    setStore("error", {
      message: error.message || "ファイルの取得に失敗しました。",
      details: error.error || error,
      status: error.status,
    });
  }
}
