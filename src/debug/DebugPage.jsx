import { createSignal } from "solid-js";
import { tokenClient } from "../init";

const DebugPage = () => {
  const [url, setUrl] = createSignal("");
  const [fileId, setFileId] = createSignal("");
  const [result, setResult] = createSignal(null);
  const [error, setError] = createSignal(null);
  const [loading, setLoading] = createSignal(false);

  const extractFileId = (urlOrId) => {
    // If it's already just an ID, return it
    if (!urlOrId.includes("/")) {
      return urlOrId;
    }

    // Extract ID from various Google Drive URL formats
    const patterns = [
      /\/folders\/([a-zA-Z0-9-_]+)/,
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/drive\/([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no pattern matches, assume the last part of the URL is the ID
    const parts = urlOrId.split("/");
    return parts[parts.length - 1];
  };

  const fetchFileInfo = async () => {
    const id = extractFileId(url());
    if (!id) {
      setError("Please enter a valid URL or file ID");
      return;
    }

    setFileId(id);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Ensure we have authentication
      if (!gapi.client.getToken()) {
        await new Promise((resolve, reject) => {
          tokenClient.callback = (resp) => {
            if (resp.error !== undefined) {
              reject(resp);
            }
            resolve(resp);
          };
          tokenClient.requestAccessToken({ prompt: "" });
        });
      }

      // Fetch file metadata
      const fileResponse = await gapi.client.drive.files.get({
        fileId: id,
        fields: "*", // Get all fields
        supportsAllDrives: true,
      });

      const fileData = { ...fileResponse.result };

      // Try to fetch permissions
      try {
        const permissionsResponse = await gapi.client.drive.permissions.list({
          fileId: id,
          fields: "*",
          supportsAllDrives: true,
        });
        fileData.permissionsList = permissionsResponse.result.permissions;
      } catch (permError) {
        fileData.permissionsError = permError.message;
      }

      // If it's a shared drive, try to get drive info
      if (fileData.driveId || fileData.teamDriveId) {
        try {
          const driveId = fileData.driveId || fileData.teamDriveId;
          const driveResponse = await gapi.client.drive.drives.get({
            driveId: driveId,
            fields: "*",
          });
          fileData.driveInfo = driveResponse.result;

          // Get shared drive permissions
          try {
            const drivePermissionsResponse = await gapi.client.drive.permissions.list({
              fileId: driveId,
              fields: "*",
              supportsAllDrives: true,
            });
            fileData.drivePermissions = drivePermissionsResponse.result.permissions;
          } catch (drivePermError) {
            fileData.drivePermissionsError = drivePermError.message;
          }
        } catch (driveError) {
          fileData.driveError = driveError.message;
        }
      }

      setResult(fileData);
    } catch (err) {
      setError(err.message || "Failed to fetch file information");
      console.error("Debug fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Google Drive Debug Tool</h1>

      <div class="mb-6">
        <label for="url-input" class="block text-sm font-medium mb-2">
          Enter Google Drive URL or File ID:
        </label>
        <div class="flex gap-2">
          <input
            id="url-input"
            type="text"
            value={url()}
            onInput={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/... or file ID"
            class="input input-bordered flex-1"
          />
          <button
            type="button"
            onClick={fetchFileInfo}
            disabled={loading()}
            class="btn btn-primary"
          >
            {loading() ? "Loading..." : "Fetch Info"}
          </button>
        </div>
      </div>

      {error() && (
        <div class="alert alert-error mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error()}</span>
        </div>
      )}

      {fileId() && !loading() && (
        <div class="mb-4">
          <span class="text-sm text-gray-600">File ID: </span>
          <code class="text-sm bg-base-200 px-2 py-1 rounded">{fileId()}</code>
        </div>
      )}

      {result() && (
        <div class="space-y-6">
          {/* Basic Info Summary */}
          <div class="card bg-base-200">
            <div class="card-body">
              <h2 class="card-title">Basic Information</h2>
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="font-medium">Name:</td>
                    <td>{result().name}</td>
                  </tr>
                  <tr>
                    <td class="font-medium">Type:</td>
                    <td>{result().mimeType}</td>
                  </tr>
                  <tr>
                    <td class="font-medium">Created Time:</td>
                    <td>
                      {result().createdTime
                        ? new Date(result().createdTime).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-medium">Modified Time:</td>
                    <td>
                      {result().modifiedTime
                        ? new Date(result().modifiedTime).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-medium">Shared:</td>
                    <td>{result().shared ? "Yes" : "No"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Owners and Created By */}
          <div class="card bg-base-200">
            <div class="card-body">
              <h2 class="card-title">Ownership Information</h2>
              {result().owners && (
                <div>
                  <h3 class="font-medium mb-2">Owners:</h3>
                  <ul class="list-disc list-inside">
                    {result().owners.map((owner) => (
                      <li>
                        {owner.displayName} ({owner.emailAddress})
                        {owner.me && <span class="badge badge-sm badge-primary ml-2">You</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result().lastModifyingUser && (
                <div class="mt-4">
                  <h3 class="font-medium mb-2">Last Modified By:</h3>
                  <p>
                    {result().lastModifyingUser.displayName} (
                    {result().lastModifyingUser.emailAddress})
                  </p>
                </div>
              )}
              {result().sharingUser && (
                <div class="mt-4">
                  <h3 class="font-medium mb-2">Shared By:</h3>
                  <p>
                    {result().sharingUser.displayName} ({result().sharingUser.emailAddress})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          {result().permissionsList && (
            <div class="card bg-base-200">
              <div class="card-body">
                <h2 class="card-title">Permissions ({result().permissionsList.length})</h2>
                <div class="overflow-x-auto">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Name/Email</th>
                        <th>Role</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result().permissionsList.map((perm) => (
                        <tr>
                          <td>{perm.type}</td>
                          <td>
                            {perm.displayName || perm.emailAddress || perm.domain || "Anyone"}
                          </td>
                          <td>
                            <span class={`badge badge-sm ${getRoleBadgeClass(perm.role)}`}>
                              {perm.role}
                            </span>
                          </td>
                          <td>
                            {perm.expirationTime && (
                              <span class="text-xs">
                                Expires: {new Date(perm.expirationTime).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Drive Permissions if in shared drive */}
          {result().drivePermissions && (
            <div class="card bg-base-200">
              <div class="card-body">
                <h2 class="card-title">
                  Shared Drive Members ({result().drivePermissions.length})
                </h2>
                <div class="overflow-x-auto">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Name/Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result().drivePermissions.map((perm) => (
                        <tr>
                          <td>{perm.type}</td>
                          <td>
                            {perm.displayName || perm.emailAddress || perm.domain || "Unknown"}
                          </td>
                          <td>
                            <span class={`badge badge-sm ${getRoleBadgeClass(perm.role)}`}>
                              {perm.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Full JSON */}
          <div class="card bg-base-200">
            <div class="card-body">
              <h2 class="card-title">Full JSON Response</h2>
              <pre class="overflow-x-auto bg-base-300 p-4 rounded text-xs">
                {JSON.stringify(result(), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
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

export default DebugPage;
