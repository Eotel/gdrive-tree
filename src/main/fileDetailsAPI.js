import { setStore } from "../index";

/**
 * Fetch detailed information about a file including permissions, owners, and capabilities
 * @param {string} fileId - The ID of the file to fetch details for
 * @returns {Promise<Object>} The file details
 */
export async function fetchFileDetails(fileId) {
  if (!fileId) {
    throw new Error("File ID is required");
  }

  setStore("isLoadingFileDetails", true);

  try {
    let fileData;
    
    // Check if this is a shared drive ID (they typically start with "0A")
    // First try to get it as a shared drive
    if (fileId.startsWith("0A")) {
      try {
        const driveResponse = await gapi.client.drive.drives.get({
          driveId: fileId,
        });
        
        if (driveResponse.result && driveResponse.result.kind === "drive#drive") {
          // This is a shared drive, convert the response to file-like format
          const drive = driveResponse.result;
          fileData = {
            id: drive.id,
            name: drive.name,
            mimeType: "application/vnd.google-apps.folder",
            capabilities: drive.capabilities,
            iconLink: drive.backgroundImageLink || "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
            driveId: drive.id,
            teamDriveId: drive.id,
            createdTime: drive.createdTime,
            kind: "drive#teamDrive",
            shared: true,
            webViewLink: `https://drive.google.com/drive/folders/${drive.id}`,
          };
          
          // For shared drives, we'll fetch permissions separately
        }
      } catch (driveError) {
        console.log("Not a shared drive, trying as regular file");
        // If it fails, fall back to regular file fetch
      }
    }
    
    // If not a shared drive or shared drive fetch failed, try regular file
    if (!fileData) {
      const fileResponse = await gapi.client.drive.files.get({
        fileId: fileId,
        fields:
          "id,name,mimeType,size,createdTime,modifiedTime,owners,permissions(id,type,role,emailAddress,displayName,photoLink,deleted,allowFileDiscovery,expirationTime),capabilities,webViewLink,webContentLink,iconLink,thumbnailLink,description,starred,trashed,parents,teamDriveId,driveId,shared,writersCanShare,viewersCanCopyContent,lastModifyingUser",
        supportsAllDrives: true,
      });

      fileData = fileResponse.result;
    }

    // Fetch permissions separately to ensure we get all of them
    try {
      const permissionsResponse = await gapi.client.drive.permissions.list({
        fileId: fileData.id,
        fields: "permissions(id,type,role,emailAddress,displayName,photoLink,deleted,allowFileDiscovery,expirationTime,domain,permissionDetails,view)",
        supportsAllDrives: true,
      });
      
      if (permissionsResponse.result.permissions) {
        fileData.permissions = permissionsResponse.result.permissions;
        console.log(`Found ${fileData.permissions.length} permissions for file ${fileId}`);
        console.log("Permissions:", fileData.permissions);
        
        // Check for anyoneWithLink permission
        const anyonePermission = fileData.permissions.find(p => p.type === "anyone" || p.id === "anyoneWithLink");
        if (anyonePermission) {
          console.log("Found 'anyone' permission:", anyonePermission);
        }
      }
    } catch (permError) {
      console.error("Failed to fetch permissions:", permError);
      // If permissions fetch fails, keep whatever permissions we got from files.get
      if (!fileData.permissions) {
        fileData.permissions = [];
      }
    }

    // If this file is in a shared drive, fetch the drive members
    // Only fetch if driveId exists AND it's not "My Drive" (which would be the user's root drive)
    // Also handle the case where we're looking at the shared drive itself
    const effectiveDriveId = fileData.driveId || fileData.teamDriveId || (fileData.kind === "drive#teamDrive" ? fileData.id : null);
    
    if (effectiveDriveId && effectiveDriveId !== "root") {
      // Check if this is actually a shared drive by trying to get drive info
      try {
        // If we already have drive info (because this IS a shared drive), skip this step
        if (fileData.kind !== "drive#teamDrive") {
          const driveResponse = await gapi.client.drive.drives.get({
            driveId: effectiveDriveId,
          });

          // If we successfully got drive info, it's a shared drive
          if (driveResponse.result && driveResponse.result.kind === "drive#drive") {
            console.log(`File is in shared drive ${effectiveDriveId}, fetching drive members...`);
          }
        }

        // Fetch permissions for the shared drive itself
        const drivePermissionsResponse = await gapi.client.drive.permissions.list({
          fileId: effectiveDriveId,
          fields: "permissions(id,type,role,emailAddress,displayName,photoLink,domain,allowFileDiscovery,expirationTime)",
          supportsAllDrives: true,
          useDomainAdminAccess: false,
        });

        if (drivePermissionsResponse.result.permissions) {
          // Add drive members to the file data
          fileData.driveMembers = drivePermissionsResponse.result.permissions;
          console.log(`Found ${fileData.driveMembers.length} drive members`);
        }
        
        // For shared drives themselves, also set permissions to the drive members
        if (fileData.kind === "drive#teamDrive" && !fileData.permissions) {
          fileData.permissions = drivePermissionsResponse.result.permissions;
        }
      } catch (driveError) {
        // If we get an error, it's likely not a shared drive (e.g., it's My Drive)
        console.log(`Drive ${effectiveDriveId} is not a shared drive or error occurred:`, driveError);
        // Continue without drive members
      }
    }

    // Format size to human readable
    if (fileData.size) {
      fileData.formattedSize = formatFileSize(Number.parseInt(fileData.size));
    }

    // Format dates
    if (fileData.createdTime) {
      fileData.formattedCreatedTime = new Date(fileData.createdTime).toLocaleString();
    }
    if (fileData.modifiedTime) {
      fileData.formattedModifiedTime = new Date(fileData.modifiedTime).toLocaleString();
    }

    setStore("fileDetails", fileData);
    setStore("isLoadingFileDetails", false);

    return fileData;
  } catch (error) {
    console.error("Failed to fetch file details:", error);
    setStore("isLoadingFileDetails", false);
    setStore("fileDetails", null);
    throw error;
  }
}

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Clear the selected file and its details
 */
export function clearFileDetails() {
  setStore("selectedFile", null);
  setStore("fileDetails", null);
  setStore("isLoadingFileDetails", false);
}
