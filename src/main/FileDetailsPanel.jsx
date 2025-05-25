import { For, Show, createEffect, createSignal } from "solid-js";
import SpinningWheel from "../SpinningWheel";
import { setStore, store } from "../index";
import { clearFileDetails } from "./fileDetailsAPI";

const FileDetailsPanel = () => {
  const details = () => store.fileDetails;
  const isLoading = () => store.isLoadingFileDetails;
  const selectedFile = () => store.selectedFile;
  
  // Accordion states
  const [isPeopleExpanded, setIsPeopleExpanded] = createSignal(false);
  const [isDriveMembersExpanded, setIsDriveMembersExpanded] = createSignal(false);
  const [isPublicExpanded, setIsPublicExpanded] = createSignal(false);

  return (
    <div class="file-details-panel h-full bg-base-200 border-l border-base-300 overflow-y-auto">
      <Show
        when={selectedFile()}
        fallback={
          <div class="p-4 text-center text-gray-500">
            <p class="text-sm">Select a file to view details</p>
          </div>
        }
      >
        <div class="p-4">
          {/* Header with close button */}
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">File Details</h2>
            <button type="button" class="btn btn-sm btn-ghost" onClick={clearFileDetails}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-label="Close"
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

          <Show
            when={!isLoading()}
            fallback={
              <div class="flex justify-center py-8">
                <SpinningWheel size="big" />
              </div>
            }
          >
            <Show when={details()}>
              {/* File basic info */}
              <div class="mb-6">
                <h3 class="font-medium mb-2 text-sm">Basic Information</h3>
                <div class="space-y-2 text-sm">
                  <div>
                    <span class="text-gray-600">Name:</span>
                    <p class="font-medium break-words">{details().name}</p>
                  </div>
                  <Show when={details().formattedSize}>
                    <div>
                      <span class="text-gray-600">Size:</span>
                      <p>{details().formattedSize}</p>
                    </div>
                  </Show>
                  <Show when={details().mimeType}>
                    <div>
                      <span class="text-gray-600">Type:</span>
                      <p class="text-xs break-words">{details().mimeType}</p>
                    </div>
                  </Show>
                  <Show when={details().formattedModifiedTime}>
                    <div>
                      <span class="text-gray-600">Modified:</span>
                      <p>{details().formattedModifiedTime}</p>
                    </div>
                  </Show>
                  <Show when={details().shared !== undefined}>
                    <div>
                      <span class="text-gray-600">Shared:</span>
                      <p>{details().shared ? "Yes" : "No"}</p>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Ownership Information */}
              <Show 
                when={
                  (details().owners && details().owners.length > 0) || 
                  details().lastModifyingUser ||
                  (details().driveId && details().driveId !== "root")
                }
              >
                <div class="mb-6">
                  <h3 class="font-medium mb-2 text-sm">Ownership Information</h3>
                  <div class="space-y-2">
                    <Show
                      when={!(details().driveId && details().driveId !== "root")}
                      fallback={
                        <>
                          {/* Shared Drive files don't have traditional owners */}
                          <div class="text-sm text-gray-600">
                            <p class="text-xs mb-2">📁 This file is in a shared drive (no individual owner)</p>
                            <Show when={details().lastModifyingUser}>
                              <div class="flex items-center gap-2 mt-2">
                                <Show when={details().lastModifyingUser.photoLink}>
                                  <img 
                                    src={details().lastModifyingUser.photoLink} 
                                    alt="" 
                                    class="w-6 h-6 rounded-full" 
                                  />
                                </Show>
                                <div>
                                  <p class="text-xs text-gray-500">Last modified by:</p>
                                  <p class="font-medium">
                                    {details().lastModifyingUser.displayName || "Unknown"}
                                  </p>
                                  <Show when={details().lastModifyingUser.emailAddress}>
                                    <p class="text-xs text-gray-600">
                                      {details().lastModifyingUser.emailAddress}
                                    </p>
                                  </Show>
                                  <Show when={details().lastModifyingUser.me}>
                                    <p class="text-xs text-blue-600">That's you</p>
                                  </Show>
                                </div>
                              </div>
                            </Show>
                          </div>
                        </>
                      }
                    >
                      {/* Regular files with owners */}
                      <For each={details().owners || []}>
                        {(owner) => (
                          <div class="flex items-center gap-2 text-sm">
                            <Show when={owner.photoLink}>
                              <img src={owner.photoLink} alt="" class="w-6 h-6 rounded-full" />
                            </Show>
                            <div>
                              <p class="font-medium">{owner.displayName}</p>
                              <p class="text-xs text-gray-600">{owner.emailAddress}</p>
                              <Show when={owner.me}>
                                <p class="text-xs text-blue-600">You are the owner</p>
                              </Show>
                            </div>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>
                </div>
              </Show>

              {/* All Permissions */}
              <Show when={details().permissions && details().permissions.length > 0}>
                <div class="mb-6">
                  <h3 class="font-medium mb-2 text-sm">
                    Sharing & Permissions ({details().permissions.length})
                  </h3>
                  
                  {/* Explanation for shared drive files */}
                  <Show when={details().driveId && details().driveId !== "root"}>
                    <div class="text-xs text-gray-600 mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p>📌 This shows file-specific permissions. These users have explicit access to this file/folder within the shared drive.</p>
                    </div>
                  </Show>

                  {/* Public Link Sharing */}
                  <Show when={details().permissions.some((p) => p.type === "anyone")}>
                    <div class="mb-4">
                      <button
                        type="button"
                        class="w-full text-left flex items-center justify-between p-2 rounded hover:bg-base-300 transition-colors"
                        onClick={() => setIsPublicExpanded(!isPublicExpanded())}
                      >
                        <h4 class="text-xs font-medium text-gray-600">
                          Public Access ({details().permissions.filter((p) => p.type === "anyone").length})
                        </h4>
                        <svg
                          class={`w-4 h-4 transition-transform ${isPublicExpanded() ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <Show when={isPublicExpanded()}>
                        <div class="space-y-2 mt-2">
                          <For each={details().permissions.filter((p) => p.type === "anyone")}>
                            {(permission) => (
                              <div class="border border-blue-300 bg-blue-50 rounded p-2 text-sm">
                                <div class="flex items-center justify-between">
                                  <div>
                                    <p class="font-medium">
                                      🌐 {permission.id === "anyoneWithLink" ? "Anyone with the link" : "Anyone on the internet"}
                                    </p>
                                    <p class="text-xs text-gray-600">No sign-in required</p>
                                    <Show when={permission.allowFileDiscovery !== undefined}>
                                      <p class="text-xs text-gray-600 mt-1">
                                        {permission.allowFileDiscovery 
                                          ? "🔍 Can be found in search results" 
                                          : "🔗 Only accessible via direct link"}
                                      </p>
                                    </Show>
                                  </div>
                                  <span
                                    class={`badge badge-sm ${getRoleBadgeClass(permission.role)}`}
                                  >
                                    {getDisplayRole(permission.role)}
                                  </span>
                                </div>
                                <Show when={permission.expirationTime}>
                                  <p class="text-xs text-gray-600 mt-1">
                                    Expires: {new Date(permission.expirationTime).toLocaleString()}
                                  </p>
                                </Show>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </Show>

                  {/* Specific Users/Groups */}
                  <Show
                    when={
                      details().permissions.filter((p) => p.type === "user" || p.type === "group")
                        .length > 0
                    }
                  >
                    <div class="mb-4">
                      <button
                        type="button"
                        class="w-full text-left flex items-center justify-between p-2 rounded hover:bg-base-300 transition-colors"
                        onClick={() => setIsPeopleExpanded(!isPeopleExpanded())}
                      >
                        <h4 class="text-xs font-medium text-gray-600">
                          People with Access ({details().permissions.filter((p) => p.type === "user" || p.type === "group").length})
                        </h4>
                        <svg
                          class={`w-4 h-4 transition-transform ${isPeopleExpanded() ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <Show when={isPeopleExpanded()}>
                        <div class="space-y-2 mt-2">
                          <For
                            each={details().permissions.filter(
                              (p) => p.type === "user" || p.type === "group",
                            )}
                          >
                            {(permission) => (
                              <div class="border border-base-300 rounded p-2 text-sm">
                                <div class="flex items-center justify-between">
                                  <div class="flex items-center gap-2">
                                    <Show when={permission.photoLink}>
                                      <img
                                        src={permission.photoLink}
                                        alt=""
                                        class="w-6 h-6 rounded-full"
                                      />
                                    </Show>
                                    <div>
                                      <p class="font-medium">
                                        {permission.displayName ||
                                          permission.emailAddress ||
                                          "Unknown User"}
                                      </p>
                                      <Show when={permission.emailAddress}>
                                        <p class="text-xs text-gray-600">{permission.emailAddress}</p>
                                      </Show>
                                      <Show when={permission.type === "group"}>
                                        <p class="text-xs text-gray-500 italic">Group</p>
                                      </Show>
                                    </div>
                                  </div>
                                  <span
                                    class={`badge badge-sm ${getRoleBadgeClass(permission.role)}`}
                                  >
                                    {getDisplayRole(permission.role)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </Show>

                  {/* Domain Permissions */}
                  <Show when={details().permissions.filter((p) => p.type === "domain").length > 0}>
                    <div class="mb-4">
                      <h4 class="text-xs font-medium text-gray-600 mb-2">Domain Access</h4>
                      <div class="space-y-2">
                        <For each={details().permissions.filter((p) => p.type === "domain")}>
                          {(permission) => (
                            <div class="border border-purple-300 bg-purple-50 rounded p-2 text-sm">
                              <div class="flex items-center justify-between">
                                <div>
                                  <p class="font-medium">🏢 {permission.domain}</p>
                                  <p class="text-xs text-gray-600">Anyone in this domain</p>
                                </div>
                                <span
                                  class={`badge badge-sm ${getRoleBadgeClass(permission.role)}`}
                                >
                                  {getDisplayRole(permission.role)}
                                </span>
                              </div>
                              <Show when={permission.expirationTime}>
                                <p class="text-xs text-gray-600 mt-1">
                                  Expires: {new Date(permission.expirationTime).toLocaleString()}
                                </p>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Shared Drive Members */}
                  <Show when={details().driveMembers && details().driveMembers.length > 0}>
                    <div class="mb-4">
                      <button
                        type="button"
                        class="w-full text-left flex items-center justify-between p-2 rounded hover:bg-base-300 transition-colors"
                        onClick={() => setIsDriveMembersExpanded(!isDriveMembersExpanded())}
                      >
                        <h4 class="text-xs font-medium text-gray-600">
                          Shared Drive Members ({details().driveMembers.length})
                        </h4>
                        <svg
                          class={`w-4 h-4 transition-transform ${isDriveMembersExpanded() ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <Show when={isDriveMembersExpanded()}>
                        <div class="mt-2">
                          <p class="text-xs text-gray-500 mb-2">
                            These are drive-level permissions. All drive members have access unless restricted by file-specific permissions above.
                          </p>
                          <div class="space-y-2">
                            <For each={details().driveMembers}>
                              {(member) => (
                                <div class="border border-green-300 bg-green-50 rounded p-2 text-sm">
                                  <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                      <Show when={member.photoLink}>
                                        <img
                                          src={member.photoLink}
                                          alt=""
                                          class="w-6 h-6 rounded-full"
                                        />
                                      </Show>
                                      <div>
                                        <p class="font-medium">
                                          {member.displayName ||
                                            member.emailAddress ||
                                            (member.type === "domain"
                                              ? `Domain: ${member.domain}`
                                              : "Unknown Member")}
                                        </p>
                                        <Show when={member.emailAddress}>
                                          <p class="text-xs text-gray-600">{member.emailAddress}</p>
                                        </Show>
                                        <p class="text-xs text-gray-500 italic">Shared Drive Member</p>
                                      </div>
                                    </div>
                                    <span class={`badge badge-sm ${getRoleBadgeClass(member.role)}`}>
                                      {getDisplayRole(member.role)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </Show>

                  {/* Sharing Status Summary */}
                  <div class="mt-3 p-2 bg-base-300 rounded text-xs">
                    <Show
                      when={
                        details().shared ||
                        (details().driveMembers && details().driveMembers.length > 0) ||
                        (details().permissions && details().permissions.length > 0)
                      }
                      fallback={
                        <p class="text-gray-600">🔒 This file is private (only owner has access)</p>
                      }
                    >
                      <div class="space-y-1 text-gray-700">
                        <Show when={details().driveMembers && details().driveMembers.length > 0}>
                          <p>📁 This file is in a shared drive accessible by {details().driveMembers.length} drive members</p>
                        </Show>
                        <Show when={details().permissions && details().permissions.length > 0}>
                          <p>
                            👥 {details().permissions.length} specific permission{details().permissions.length > 1 ? "s" : ""} set
                          </p>
                        </Show>
                        <Show when={details().permissions.some((p) => p.type === "anyone")}>
                          <p>🌐 Anyone with the link can access this file</p>
                        </Show>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>

              {/* Capabilities */}
              <Show when={details().capabilities}>
                <div class="mb-6">
                  <h3 class="font-medium mb-2 text-sm">Your Capabilities</h3>
                  <p class="text-xs text-gray-600 mb-2">What you can do with this file</p>
                  <div class="space-y-1 text-sm">
                    <CapabilityItem label="Can edit" value={details().capabilities.canEdit} />
                    <CapabilityItem label="Can share" value={details().capabilities.canShare} />
                    <CapabilityItem label="Can comment" value={details().capabilities.canComment} />
                    <CapabilityItem
                      label="Can download"
                      value={details().capabilities.canDownload}
                    />
                    <CapabilityItem label="Can copy" value={details().capabilities.canCopy} />
                    <CapabilityItem label="Can delete" value={details().capabilities.canDelete} />
                    <CapabilityItem label="Can rename" value={details().capabilities.canRename} />
                    <CapabilityItem
                      label="Can move to trash"
                      value={details().capabilities.canTrash}
                    />
                  </div>
                </div>
              </Show>

              {/* Links */}
              <Show when={details().webViewLink}>
                <div class="mb-6">
                  <h3 class="font-medium mb-2 text-sm">Actions</h3>
                  <div class="flex gap-2 flex-wrap">
                    <a
                      href={details().webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-sm btn-primary"
                    >
                      Open in Drive
                    </a>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      onClick={() => {
                        navigator.clipboard.writeText(details().webViewLink);
                        alert("Link copied to clipboard!");
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </Show>
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  );
};

const CapabilityItem = ({ label, value }) => {
  return (
    <div class="flex items-center justify-between">
      <span class="text-gray-600">{label}</span>
      <Show
        when={value}
        fallback={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-label="No"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Yes"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </Show>
    </div>
  );
};

function getRoleBadgeClass(role) {
  switch (role) {
    case "owner":
      return "badge-primary";
    case "organizer":
    case "fileOrganizer":
    case "writer":
      return "badge-success";
    case "contributor":
    case "reader":
      return "badge-info";
    case "commenter":
      return "badge-warning";
    default:
      return "badge-ghost";
  }
}

function getDisplayRole(role) {
  const roleNames = {
    owner: "Owner",
    organizer: "Manager",
    fileOrganizer: "Content Manager",
    writer: "Contributor",
    contributor: "Contributor",
    reader: "Viewer",
    commenter: "Commenter",
  };
  return roleNames[role] || role;
}

export default FileDetailsPanel;
